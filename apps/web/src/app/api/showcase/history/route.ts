import {
  errorResponse,
  historyFor,
  requireSession,
} from "@/lib/showcase/storage";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    return Response.json(
      await historyFor(
        session,
        new URL(request.url).searchParams.get("conversationId") ?? "",
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
