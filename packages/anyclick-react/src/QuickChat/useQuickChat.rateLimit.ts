export type RateLimitNotice = {
  status: 429;
  message: string;
  retryAt?: number;
  retryAfterSeconds?: number;
  requestId?: string;
  endpoint?: string;
  raw?: string;
};

type RateLimitPayload = {
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
  retryAt?: number;
  requestId?: string;
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function formatRetryAt(retryAtMs: number): string {
  try {
    const d = new Date(retryAtMs);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return new Date(retryAtMs).toLocaleTimeString();
  }
}

function getRequestIdFromHeaders(
  res: Response | undefined,
): string | undefined {
  return (
    res?.headers?.get?.("X-Anyclick-Request-Id") ??
    res?.headers?.get?.("x-anyclick-request-id") ??
    undefined
  );
}

function parseRetryAfterSeconds(args: {
  payload: RateLimitPayload | null;
  res?: Response;
}): number | undefined {
  const { payload, res } = args;
  if (typeof payload?.retryAfterSeconds === "number")
    return payload.retryAfterSeconds;
  const headerRetryAfter = res?.headers?.get?.("Retry-After");
  if (!headerRetryAfter) return undefined;
  const n = Number(headerRetryAfter);
  return Number.isFinite(n) ? n : undefined;
}

function parseRetryAt(args: {
  payload: RateLimitPayload | null;
  retryAfterSeconds?: number;
  nowMs: number;
}): number | undefined {
  const { payload, retryAfterSeconds, nowMs } = args;
  if (
    typeof payload?.retryAt === "number" &&
    Number.isFinite(payload.retryAt)
  ) {
    return payload.retryAt;
  }
  if (
    typeof retryAfterSeconds === "number" &&
    Number.isFinite(retryAfterSeconds)
  ) {
    return nowMs + Math.max(0, retryAfterSeconds) * 1000;
  }
  return undefined;
}

function buildNotice(args: {
  rawText: string;
  endpoint?: string;
  res?: Response;
  nowMs: number;
}): RateLimitNotice {
  const { rawText, endpoint, res, nowMs } = args;

  const parsed = safeJsonParse(rawText);
  const payload =
    parsed && typeof parsed === "object" ? (parsed as RateLimitPayload) : null;

  const retryAfterSeconds = parseRetryAfterSeconds({ payload, res });
  const retryAt = parseRetryAt({ payload, retryAfterSeconds, nowMs });

  const timePart = retryAt ? `Try again at ${formatRetryAt(retryAt)}.` : "";
  const message = timePart ? `Rate limited. ${timePart}` : "Rate limited.";

  const requestId = payload?.requestId ?? getRequestIdFromHeaders(res);

  return {
    status: 429,
    message,
    retryAt,
    retryAfterSeconds,
    requestId,
    endpoint,
    raw: rawText,
  };
}

/**
 * Create a rate-limit notice from a 429 Response. This will consume the body.
 */
export async function rateLimitNoticeFromResponse(
  res: Response,
  endpoint?: string,
): Promise<RateLimitNotice | null> {
  if (res.status !== 429) return null;
  const raw = await res.text().catch(() => "");
  return buildNotice({ rawText: raw, endpoint, res, nowMs: Date.now() });
}

/**
 * Create a rate-limit notice from an error object surfaced by ai-sdk.
 */
export function rateLimitNoticeFromError(args: {
  statusCode: number;
  response?: Response;
  responseText?: string;
  endpoint?: string;
}): RateLimitNotice | null {
  const { statusCode, response, responseText, endpoint } = args;
  if (statusCode !== 429) return null;
  const raw = responseText ?? "";
  return buildNotice({
    rawText: raw,
    endpoint,
    res: response,
    nowMs: Date.now(),
  });
}
