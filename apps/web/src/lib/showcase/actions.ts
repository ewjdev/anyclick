import { createHash, randomUUID } from "node:crypto";
import {
  type ActionInput,
  DomainError,
  type ScenarioState,
  actionInput,
  getObject,
  mutateScenario,
  taskFor,
  validateAction,
} from "./domain";
import {
  type Session,
  acquire,
  commit,
  key,
  secondsLeft,
  stateFor,
  storage,
} from "./storage";

export interface Preview {
  id: string;
  input: ActionInput;
  hash: string;
  revision: number;
  title: string;
  destination: string;
  before: Record<string, string>;
  expiresAt: number;
}
export interface Receipt {
  id: string;
  hash: string;
  scenario: string;
  objectId: string;
  actionId: string;
  status: "running" | "succeeded" | "failed" | "outcome_unknown";
  message: string;
  url?: string;
  previousFields?: Record<string, string>;
  revision?: number;
  undoable?: boolean;
  createdAt: number;
  assetUrl?: string;
  stage?: "prepared" | "asset" | "issue";
}
export function inputHash(input: ActionInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        values: Object.fromEntries(
          Object.entries(input.values).sort(([a], [b]) => a.localeCompare(b)),
        ),
      }),
    )
    .digest("hex");
}
export async function previewAction(
  session: Session,
  body: unknown,
): Promise<Preview> {
  const parsed = actionInput.safeParse(body);
  if (!parsed.success)
    throw new DomainError("Check the action fields and try again.");
  const input = parsed.data;
  const state = await stateFor(session, input.scenario);
  const object = validateAction(state, input);
  if (
    input.actionId === "issue" &&
    (!process.env.SHOWCASE_GITHUB_REPO || !process.env.SHOWCASE_GITHUB_TOKEN)
  )
    throw new DomainError(
      "The demo GitHub repository is not connected yet. You can keep editing your issue draft.",
      503,
    );
  if (input.actionId === "undo") {
    const receipt = await storage().get<Receipt>(
      key(session, `execution:${input.values.executionId}`),
    );
    if (
      !receipt ||
      receipt.status !== "succeeded" ||
      !receipt.undoable ||
      receipt.scenario !== input.scenario ||
      receipt.objectId !== input.objectId ||
      receipt.revision !== state.revision
    )
      throw new DomainError(
        "This change can no longer be undone because the workspace has changed.",
        409,
      );
  }
  const preview: Preview = {
    id: randomUUID(),
    input,
    hash: inputHash(input),
    revision: state.revision,
    title: taskFor(input.scenario, input.actionId)?.label ?? input.actionId,
    destination:
      input.actionId === "issue"
        ? `GitHub · ${process.env.SHOWCASE_GITHUB_REPO}`
        : "Your hosted sample workspace",
    before: object.fields,
    expiresAt: Math.min(session.expiresAt, Date.now() + 10 * 60_000),
  };
  await storage().set(key(session, `preview:${preview.id}`), preview, {
    ex: Math.min(600, secondsLeft(session)),
  });
  return preview;
}
export async function executeLocal(
  session: Session,
  preview: Preview,
  receipt: Receipt,
) {
  const state = await stateFor(session, preview.input.scenario);
  if (state.revision !== preview.revision)
    throw new DomainError(
      "The workspace changed. Review this action again before saving.",
      409,
    );
  let next: ScenarioState;
  if (preview.input.actionId === "undo") {
    const previous = await storage().get<Receipt>(
      key(session, `execution:${preview.input.values.executionId}`),
    );
    if (
      !previous?.undoable ||
      previous.revision !== state.revision ||
      previous.objectId !== preview.input.objectId ||
      previous.scenario !== state.id ||
      !previous.previousFields
    )
      throw new DomainError("This change is no longer undoable.", 409);
    next = structuredClone(state);
    getObject(next, preview.input.objectId).fields = previous.previousFields;
    next.revision++;
    next.activity = [
      { id: receipt.id, label: `Undid ${previous.actionId}`, at: Date.now() },
      ...next.activity,
    ].slice(0, 30);
  } else next = mutateScenario(state, preview.input, receipt.id, Date.now());
  const complete: Receipt = {
    ...receipt,
    status: "succeeded",
    message: `${preview.title} saved to your sample workspace.`,
    previousFields: preview.before,
    revision: next.revision,
    undoable: [
      "improve",
      "rewrite",
      "reschedule",
      "checkin",
      "update",
      "checklist",
      "shortlist",
      "experiment",
    ].includes(preview.input.actionId),
  };
  await commit(session, `scenario:${state.id}`, state.revision, next, {
    suffix: `execution:${receipt.id}`,
    value: complete,
  });
  return complete;
}
export async function lockedExecution<T>(
  session: Session,
  id: string,
  run: () => Promise<T>,
) {
  const release = await acquire(key(session, `execution-lock:${id}`), 90);
  try {
    return await run();
  } finally {
    await release();
  }
}
