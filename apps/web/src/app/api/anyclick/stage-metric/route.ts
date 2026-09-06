/**
 * Stage metric sink: "did the visitor right-click inside an example Stage
 * within 10s of load?" One boolean plus the example id. No PII.
 *
 * Log-based counter for now; swap for a real sink when there is one.
 */
import { createLogger } from "@/lib/logger";

const logger = createLogger("StageMetric");
const MAX_BODY = 1024;

export async function POST(req: Request) {
  let text: string;
  try {
    text = await req.text();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  const b = body as { id?: unknown; withinTenSeconds?: unknown };
  if (
    typeof b?.id !== "string" ||
    !/^[a-z0-9-]{1,64}$/.test(b.id) ||
    typeof b.withinTenSeconds !== "boolean"
  ) {
    return new Response(null, { status: 400 });
  }

  logger.info("stage right-click", {
    id: b.id,
    withinTenSeconds: b.withinTenSeconds,
  });
  return new Response(null, { status: 204 });
}
