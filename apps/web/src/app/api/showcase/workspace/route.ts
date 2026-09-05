import { DomainError, scenarioIds } from "@/lib/showcase/domain";
import {
  SESSION_SECONDS,
  checkOrigin,
  cookieName,
  createSession,
  errorResponse,
  readBody,
  requireSession,
  stateFor,
} from "@/lib/showcase/storage";

export const runtime = "nodejs";
async function workspaceResponse(request: Request, reset = false) {
  try {
    checkOrigin(request);
    const hasCookie = request.headers
      .get("cookie")
      ?.split(";")
      .some((value) => value.trim().startsWith(`${cookieName}=`));
    const fresh = reset || !hasCookie;
    const session = fresh
      ? await createSession(request)
      : await requireSession(request);
    const states = await Promise.all(
      scenarioIds.map((id) => stateFor(session, id)),
    );
    return Response.json(
      {
        workspaceId: session.id,
        expiresAt: session.expiresAt,
        states,
        capabilities: {
          ai:
            !!process.env.OPENAI_API_KEY &&
            Number(process.env.SHOWCASE_DAILY_TOKEN_BUDGET) > 0,
          github:
            !!process.env.SHOWCASE_GITHUB_TOKEN &&
            !!process.env.SHOWCASE_GITHUB_REPO,
          githubRepo: process.env.SHOWCASE_GITHUB_REPO ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          ...(fresh
            ? {
                "Set-Cookie": `${cookieName}=${session.id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
              }
            : {}),
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = (request: Request) => workspaceResponse(request);
export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    if (body?.reset !== true)
      throw new DomainError("Choose to start a fresh workspace.");
    return workspaceResponse(request, true);
  } catch (error) {
    return errorResponse(error);
  }
}
