/**
 * API route for QuickChat history persistence.
 *
 * Provides Redis-backed storage for chat history with 24h TTL.
 * Uses Upstash Redis with IP address as the key.
 *
 * @module api/anyclick/chat/history
 */
import { createLogger, generateRequestId } from "@/lib/logger";
import { Redis } from "@upstash/redis";

// Create logger instance for this route
const logger = createLogger("AnyClickChatHistory");

const isDev = process.env.NODE_ENV === "development";

// 24 hours in seconds (for Redis TTL)
const TWENTY_FOUR_HOURS_SEC = 24 * 60 * 60;
// 24 hours in milliseconds (for timestamp comparisons)
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const redis = new Redis({
  url: process.env.QUICKCHAT_KV_REST_API_URL,
  token: process.env.QUICKCHAT_KV_REST_API_TOKEN,
});
/**
 * Chat message structure
 */
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

/**
 * Stored chat session
 */
interface StoredSession {
  messages: ChatMessage[];
  createdAt: number;
}

/**
 * Get IP address from request headers
 */
function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

/**
 * Get Redis key for chat history based on IP address
 */
function getChatKey(ip: string): string {
  return `chat:${ip}`;
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();

  try {
    const body = await request.json();
    const { action, messages } = body;
    const ip = getIpFromRequest(request);
    const chatKey = getChatKey(ip);

    logger.debug("History request", {
      requestId,
      action,
      ip: isDev ? ip : ip.slice(0, 20) + "...",
      messageCount: messages?.length || 0,
    });

    if (action === "save") {
      if (!messages || !Array.isArray(messages)) {
        logger.warn("Missing or invalid messages for save action", {
          requestId,
          messagesType: typeof messages,
        });
        return Response.json(
          { error: "messages array is required for save action" },
          { status: 400 },
        );
      }

      const now = Date.now();

      // Get existing session from Redis
      const existingData = await redis.get<StoredSession>(chatKey);
      const existingSession = existingData || null;

      // Merge with existing messages, keeping unique by id
      const existingMessages = existingSession?.messages || [];
      const existingIds = new Set(existingMessages.map((m) => m.id));
      const newMessages = messages.filter(
        (m: ChatMessage) => !existingIds.has(m.id),
      );
      const mergedMessages = [...existingMessages, ...newMessages];

      // Only keep messages from the last 24 hours
      const cutoff = now - TWENTY_FOUR_HOURS_MS;
      const filteredMessages = mergedMessages.filter(
        (m) => m.timestamp > cutoff,
      );

      // Limit to last 50 messages to prevent unbounded growth
      const limitedMessages = filteredMessages.slice(-50);

      const session: StoredSession = {
        messages: limitedMessages,
        createdAt: existingSession?.createdAt || now,
      };

      // Save to Redis with 24h TTL
      await redis.set(chatKey, session, { ex: TWENTY_FOUR_HOURS_SEC });

      logger.info("Chat history saved", {
        requestId,
        ip: isDev ? ip : ip.slice(0, 20) + "...",
        messageCount: limitedMessages.length,
        newMessages: newMessages.length,
      });

      logger.performance("Save operation", requestStartTime, { requestId });

      const expiresAt = now + TWENTY_FOUR_HOURS_MS;

      return Response.json({
        success: true,
        messageCount: limitedMessages.length,
        expiresAt,
      });
    }

    if (action === "load") {
      const session = await redis.get<StoredSession>(chatKey);

      if (!session) {
        logger.debug("No session found for load", {
          requestId,
          ip: isDev ? ip : ip.slice(0, 20) + "...",
        });
        return Response.json({ messages: [], found: false });
      }

      // Filter out messages older than 24h (extra safety check)
      const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
      const validMessages = session.messages.filter(
        (m) => m.timestamp > cutoff,
      );

      logger.info("Chat history loaded", {
        requestId,
        ip: isDev ? ip : ip.slice(0, 20) + "...",
        messageCount: validMessages.length,
      });

      logger.performance("Load operation", requestStartTime, { requestId });

      // Calculate expiresAt based on TTL remaining
      const ttl = await redis.ttl(chatKey);
      const expiresAt =
        ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + TWENTY_FOUR_HOURS_MS;

      return Response.json({
        messages: validMessages,
        found: true,
        createdAt: session.createdAt,
        expiresAt,
      });
    }

    if (action === "clear") {
      const existed = (await redis.exists(chatKey)) === 1;
      await redis.del(chatKey);

      logger.info("Chat history cleared", {
        requestId,
        ip: isDev ? ip : ip.slice(0, 20) + "...",
        existed,
      });

      logger.performance("Clear operation", requestStartTime, { requestId });

      return Response.json({ success: true, cleared: existed });
    }

    logger.warn("Invalid action provided", {
      requestId,
      action,
      validActions: ["save", "load", "clear"],
    });

    return Response.json(
      { error: "Invalid action. Use 'save', 'load', or 'clear'" },
      { status: 400 },
    );
  } catch (error) {
    logger.error("History request failed", error, { requestId });

    const errorMessage = isDev
      ? error instanceof Error
        ? error.message
        : "Failed to process request"
      : "Failed to process request";

    return Response.json(
      { error: errorMessage, ...(isDev && { requestId }) },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for simple session check
 */
export async function GET(request: Request) {
  const ip = getIpFromRequest(request);
  const chatKey = getChatKey(ip);

  const redis = new Redis({
    url: process.env.QUICKCHAT_KV_REST_API_URL,
    token: process.env.QUICKCHAT_KV_REST_API_TOKEN,
  });

  const session = await redis.get<StoredSession>(chatKey);

  if (!session) {
    return Response.json({ hasHistory: false });
  }

  // Calculate expiresAt based on TTL remaining
  const ttl = await redis.ttl(chatKey);
  const expiresAt =
    ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + TWENTY_FOUR_HOURS_MS;

  return Response.json({
    hasHistory: true,
    messageCount: session.messages.length,
    expiresAt,
  });
}
