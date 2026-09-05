import { previewAction } from "@/lib/showcase/actions";
import {
  errorResponse,
  readBody,
  requireSession,
} from "@/lib/showcase/storage";

export async function POST(request: Request) {
  try {
    return Response.json(
      await previewAction(
        await requireSession(request),
        await readBody(request),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
