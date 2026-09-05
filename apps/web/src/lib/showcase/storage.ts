import type { ConversationMessage } from "@ewjdev/anyclick-react";
import { Redis } from "@upstash/redis";
import { createHash, randomBytes } from "node:crypto";
import {
  DomainError,
  type ScenarioId,
  type ScenarioState,
  initialScenario,
  scenarioIds,
} from "./domain";

export const SESSION_SECONDS = 86400;
export const cookieName = "anyclick_showcase";
export interface Session {
  id: string;
  expiresAt: number;
}
export interface History {
  messages: ConversationMessage[];
  revision: number;
}
export function storage() {
  if (
    !process.env.QUICKCHAT_KV_REST_API_URL ||
    !process.env.QUICKCHAT_KV_REST_API_TOKEN
  )
    throw new DomainError(
      "The hosted workspace is not connected yet. You can explore the sample objects; saving will be available when the service is connected.",
      503,
    );
  return new Redis({
    url: process.env.QUICKCHAT_KV_REST_API_URL,
    token: process.env.QUICKCHAT_KV_REST_API_TOKEN,
  });
}
export function key(session: Session, suffix: string) {
  return `showcase:v1:${session.id}:${suffix}`;
}
export function secondsLeft(session: Session) {
  const seconds = Math.ceil((session.expiresAt - Date.now()) / 1000);
  if (seconds <= 0)
    throw new DomainError(
      "This workspace has expired. Start a fresh workspace to continue.",
      401,
    );
  return seconds;
}
export async function requireSession(request: Request): Promise<Session> {
  if (process.env.SHOWCASE_ENABLED !== "true")
    throw new DomainError(
      "The interactive showcase is currently unavailable.",
      503,
    );
  const id = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!id || !/^[a-f0-9]{48}$/.test(id))
    throw new DomainError("Start a workspace to continue.", 401);
  const session = await storage().get<Session>(`showcase:session:${id}`);
  if (!session)
    throw new DomainError(
      "This workspace has expired. Start a fresh workspace to continue.",
      401,
    );
  secondsLeft(session);
  return session;
}
export async function createSession(request?: Request): Promise<Session> {
  if (process.env.SHOWCASE_ENABLED !== "true")
    throw new DomainError(
      "The interactive showcase is currently unavailable.",
      503,
    );
  if (request) {
    const ip = createHash("sha256")
      .update(
        request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
      )
      .digest("hex");
    const day = new Date().toISOString().slice(0, 10);
    if (
      !(await storage().eval(
        budgetScript,
        [`showcase:init:${day}:${ip}`, `showcase:init:${day}:global`],
        [1, 86400, 50, 5000],
      ))
    )
      throw new DomainError(
        "Too many sample workspaces have been started today. Try again later.",
        429,
      );
  }
  const session = {
    id: randomBytes(24).toString("hex"),
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
  };
  await storage().set(`showcase:session:${session.id}`, session, {
    ex: SESSION_SECONDS,
  });
  return session;
}
export async function stateFor(
  session: Session,
  id: ScenarioId,
): Promise<ScenarioState> {
  const redis = storage();
  const stateKey = key(session, `scenario:${id}`);
  await redis.set(stateKey, initialScenario(id), {
    nx: true,
    ex: secondsLeft(session),
  });
  return (await redis.get<ScenarioState>(stateKey))!;
}
export function conversationScenario(conversationId: string): ScenarioId {
  const id = conversationId.split(":")[0];
  if (
    !scenarioIds.includes(id as ScenarioId) ||
    !/^[a-z]+:[a-zA-Z0-9-]{1,128}$/.test(conversationId)
  )
    throw new DomainError("Invalid conversation.");
  return id as ScenarioId;
}
export async function historyFor(
  session: Session,
  conversationId: string,
): Promise<History> {
  conversationScenario(conversationId);
  return (
    (await storage().get<History>(
      key(session, `thread:${conversationId}`),
    )) ?? { messages: [], revision: 0 }
  );
}

// Compare-and-swap prevents two tabs from overwriting state. Redis executes this script atomically.
export const commitScript = `
local raw = redis.call('GET', KEYS[1])
local current = raw and cjson.decode(raw) or {revision=0}
if current.revision ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
if #KEYS > 1 then redis.call('SET', KEYS[2], ARGV[4], 'EX', ARGV[3]) end
return 1`;
export async function commit(
  session: Session,
  suffix: string,
  previousRevision: number,
  next: unknown,
  receipt?: { suffix: string; value: unknown },
) {
  const keys = [key(session, suffix)];
  if (receipt) keys.push(key(session, receipt.suffix));
  const result = await storage().eval(commitScript, keys, [
    previousRevision,
    JSON.stringify(next),
    secondsLeft(session),
    JSON.stringify(receipt?.value ?? null),
  ]);
  if (result !== 1)
    throw new DomainError(
      "This record changed in another tab. Reload it and review your edits again.",
      409,
    );
}
const releaseScript = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;
export async function acquire(lockKey: string, ttl: number) {
  const token = randomBytes(16).toString("hex");
  if (!(await storage().set(lockKey, token, { nx: true, ex: ttl })))
    throw new DomainError(
      "Another request is running. Try again in a moment.",
      409,
    );
  return async () => {
    await storage().eval(releaseScript, [lockKey], [token]);
  };
}

const budgetScript = `
for i=1,#KEYS do
 local used=tonumber(redis.call('GET',KEYS[i]) or '0')
 if used+tonumber(ARGV[1]) > tonumber(ARGV[i+2]) then return 0 end
end
for i=1,#KEYS do redis.call('INCRBY',KEYS[i],ARGV[1]); redis.call('EXPIRE',KEYS[i],ARGV[2]) end
return 1`;
export async function reserveBudget(
  request: Request,
  session: Session,
  kind: "chat" | "suggest" | "github",
  tokens = 1,
) {
  const day = new Date().toISOString().slice(0, 10);
  const ip = createHash("sha256")
    .update(request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown")
    .digest("hex");
  const limits =
    kind === "chat"
      ? [40, 400, 2000]
      : kind === "suggest"
        ? [100, 1000, 5000]
        : [5, 20, 100];
  const keys = [
    `showcase:quota:${day}:${kind}:${session.id}`,
    `showcase:quota:${day}:${kind}:ip:${ip}`,
    `showcase:quota:${day}:${kind}:global`,
  ];
  if (!(await storage().eval(budgetScript, keys, [1, 86400, ...limits])))
    throw new DomainError(
      "The daily limit for this service has been reached. Your work is saved; try again tomorrow.",
      429,
    );
  if (kind !== "github") {
    const maxTokens = Number(process.env.SHOWCASE_DAILY_TOKEN_BUDGET);
    if (!Number.isSafeInteger(maxTokens) || maxTokens <= 0)
      throw new DomainError(
        "Live AI is waiting for its service budget configuration. The workspace actions are still available.",
        503,
      );
    if (
      !(await storage().eval(
        budgetScript,
        [`showcase:tokens:${day}`],
        [tokens, 86400, maxTokens],
      ))
    )
      throw new DomainError(
        "The live AI service has reached its daily capacity. Your draft is preserved; try again tomorrow.",
        429,
      );
  }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new DomainError("This request must come from the workspace.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new DomainError("Cross-site requests are not supported.", 403);
}
export async function readBody(request: Request) {
  checkOrigin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new DomainError("Expected JSON.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new DomainError("A request body is required.");
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2 * 1024 * 1024) {
      await reader.cancel();
      throw new DomainError(
        "The capture is too large. Retry without the screenshot.",
        413,
      );
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new DomainError("Invalid JSON.");
  }
}
export function errorResponse(error: unknown) {
  const status = error instanceof DomainError ? error.status : 503;
  return Response.json(
    {
      error:
        error instanceof DomainError
          ? error.message
          : "The service could not complete this request. Your draft is preserved; try again.",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "3600" } : {}),
      },
    },
  );
}
