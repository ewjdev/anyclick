/**
 * Utility functions for rate limiting by IP.
 *
 * @module api/utils
 */
import { createLogger, generateRequestId } from "@/lib/logger";
import { Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create logger instance for this route
const logger = createLogger("AnyClickRateLimit");

const isDev = process.env.NODE_ENV === "development";

// Rate limit: max requests per IP per day
// Testing/Dev: 1 request per day, Production: 10 requests per day
const RATE_LIMIT_PER_DAY_DEV = 1;
const RATE_LIMIT_PER_DAY_PROD = 10;

const todaysRateLimit = isDev
  ? RATE_LIMIT_PER_DAY_DEV
  : RATE_LIMIT_PER_DAY_PROD;

function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

function getDateKeySuffix(): string {
  // YYYY-MM-DD (UTC) — keeps counts isolated per day
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilEndOfDay(): number {
  const now = new Date();
  const tomorrowUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return Math.ceil((tomorrowUtc.getTime() - now.getTime()) / 1000);
}

export const rateLimitByIp = async (
  request: Request,
  limit: Duration = "24 h",
  requestsPerDay?: number,
  requestIdOverride?: string,
) => {
  const requestId = requestIdOverride || generateRequestId();
  const ip = getIpFromRequest(request);
  const dateSuffix = getDateKeySuffix();
  const key = `rl:${ip}:${dateSuffix}`;

  const ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.QUICKCHAT_KV_REST_API_URL,
      token: process.env.QUICKCHAT_KV_REST_API_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(
      requestsPerDay || todaysRateLimit,
      limit || "24 h",
    ),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     */
    prefix: "@anyclick/ratelimit",
  });

  // Determine rate limit based on environment if not explicitly provided
  const rateLimit =
    requestsPerDay ??
    (isDev ? RATE_LIMIT_PER_DAY_DEV : RATE_LIMIT_PER_DAY_PROD);

  try {
    if (ratelimit) {
      // The ratelimit.limit API returns a result with success, remaining, etc.
      const res = await ratelimit.limit(key);
      // res.success indicates allowed or not; res.remaining may exist
      const allowed = !!res.success;

      if (!allowed) {
        logger.warn("Rate limit exceeded", {
          requestId,
          ip: isDev ? ip : ip.slice(0, 20) + "...",
          remaining: res.remaining,
          limit: res.limit,
        });
        const retryAfter = secondsUntilEndOfDay();
        const retryAt = Date.now() + retryAfter * 1000;
        return {
          allowed: false,
          response: Response.json(
            {
              error: "rate_limited",
              message: "Rate limit exceeded. Try again later.",
              limit: rateLimit,
              remaining: 0,
              retryAfterSeconds: retryAfter,
              retryAt,
              ...(isDev && { requestId }),
            },
            {
              status: 429,
              headers: {
                "Retry-After": String(retryAfter),
                "X-Anyclick-Request-Id": requestId,
              },
            },
          ),
          count: res.limit,
          remaining: 0,
        };
      }

      return {
        allowed: true,
        count: res.limit,
        remaining: res.remaining,
      };
    }
  } catch (e) {
    logger.warn("Upstash ratelimit check failed, falling back to in-memory", {
      error: e instanceof Error ? e.message : String(e),
      key,
      requestId,
    });
  }

  // Fallback: if rate limiting is unavailable, allow the request but log a warning
  logger.warn("Rate limiting unavailable, allowing request", {
    requestId,
    ip: isDev ? ip : ip.slice(0, 20) + "...",
  });
  return { allowed: true, count: undefined, remaining: undefined };
};
