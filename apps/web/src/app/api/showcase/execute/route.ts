import {
  type Preview,
  type Receipt,
  executeLocal,
  lockedExecution,
} from "@/lib/showcase/actions";
import { DomainError } from "@/lib/showcase/domain";
import { executeGitHub, saveReceipt } from "@/lib/showcase/github";
import {
  errorResponse,
  key,
  readBody,
  requireSession,
  reserveBudget,
  stateFor,
  storage,
} from "@/lib/showcase/storage";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const body = z
      .object({
        previewId: z.string().uuid(),
        idempotencyKey: z.string().uuid(),
      })
      .strict()
      .safeParse(await readBody(request));
    if (!body.success) throw new DomainError("Invalid action submission.");
    const { previewId, idempotencyKey: id } = body.data;
    const result = await lockedExecution(session, id, async () => {
      const preview = await storage().get<Preview>(
        key(session, `preview:${previewId}`),
      );
      if (!preview)
        throw new DomainError(
          "This preview expired. Review the action again.",
          409,
        );
      const existing = await storage().get<Receipt>(
        key(session, `execution:${id}`),
      );
      if (existing) {
        if (existing.hash !== preview.hash)
          throw new DomainError(
            "This submission identifier belongs to different inputs.",
            409,
          );
        if (existing.status !== "failed") return existing;
      }
      if (preview.expiresAt < Date.now())
        throw new DomainError(
          "This preview expired. Review the action again.",
          409,
        );
      const state = await stateFor(session, preview.input.scenario);
      if (state.revision !== preview.revision)
        throw new DomainError(
          "The workspace changed. Reload and review your edits again.",
          409,
        );
      const receipt: Receipt = {
        id,
        hash: preview.hash,
        scenario: preview.input.scenario,
        objectId: preview.input.objectId,
        actionId: preview.input.actionId,
        status: "running",
        message: "Saving your action…",
        createdAt: Date.now(),
        stage: "prepared",
      };
      if (receipt.actionId === "issue") {
        const duplicateKey = key(session, `github-input:${preview.hash}`);
        const claimed = await storage().set(duplicateKey, id, {
          nx: true,
          ex: 7 * 86400,
        });
        if (!claimed) {
          const priorId = await storage().get<string>(duplicateKey);
          const prior =
            priorId &&
            (await storage().get<Receipt>(
              key(session, `execution:${priorId}`),
            ));
          if (priorId !== id) {
            if (prior) return prior;
            throw new DomainError(
              "An identical submission is being prepared. Check its status before trying again.",
              409,
            );
          }
        }
        try {
          await reserveBudget(request, session, "github");
        } catch (error) {
          if (claimed) await storage().del(duplicateKey);
          throw error;
        }
        await saveReceipt(session, receipt);
        return executeGitHub(session, preview, receipt);
      }
      return executeLocal(session, preview, receipt);
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
