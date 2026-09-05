import { DomainError, scenarioIds } from "@/lib/showcase/domain";
import {
  errorResponse,
  readBody,
  requireSession,
  storage,
} from "@/lib/showcase/storage";
import { z } from "zod";

const eventSchema = z
  .object({
    scenario: z.enum(scenarioIds),
    event: z.enum([
      "scenario_open",
      "action_start",
      "action_complete",
      "recipe_open",
      "chat_open",
    ]),
  })
  .strict();
export async function POST(request: Request) {
  try {
    await requireSession(request);
    const parsed = eventSchema.safeParse(await readBody(request));
    if (!parsed.success) throw new DomainError("Invalid event.");
    const { scenario, event } = parsed.data;
    const key = `showcase:events:${new Date().toISOString().slice(0, 10)}:${scenario}:${event}`;
    await storage().eval(
      "local n=redis.call('INCR',KEYS[1]); redis.call('EXPIRE',KEYS[1],604800); return n",
      [key],
      [],
    );
    return Response.json({ recorded: true });
  } catch (error) {
    return errorResponse(error);
  }
}
