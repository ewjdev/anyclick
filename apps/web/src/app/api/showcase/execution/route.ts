import { type Receipt } from "@/lib/showcase/actions";
import { DomainError } from "@/lib/showcase/domain";
import { reconcileIssue, saveReceipt } from "@/lib/showcase/github";
import {
  errorResponse,
  key,
  requireSession,
  storage,
} from "@/lib/showcase/storage";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new DomainError("Invalid execution identifier.");
    let receipt = await storage().get<Receipt>(key(session, `execution:${id}`));
    if (!receipt)
      throw new DomainError("This execution is not available.", 404);
    if (
      receipt.status === "running" &&
      Date.now() - receipt.createdAt > 90_000
    ) {
      receipt = {
        ...receipt,
        status: receipt.stage === "issue" ? "outcome_unknown" : "failed",
        message:
          receipt.stage === "issue"
            ? "Checking whether GitHub completed this issue."
            : "This operation was interrupted before issue creation.",
      };
      await saveReceipt(session, receipt);
    }
    if (receipt.actionId === "issue")
      receipt = await reconcileIssue(session, receipt);
    return Response.json(receipt, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
