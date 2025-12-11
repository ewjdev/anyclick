/**
 * API route for QuickChat history persistence.
 *
 * Provides KV-style storage for chat history with 24h TTL.
 * In production, this should be backed by a proper KV store (Redis, Vercel KV, etc.)
 *
 * @module api/anyclick/chat/history
 */
import { createLogger, generateRequestId } from "@/lib/logger";

// Create logger instance for this route
const logger = createLogger("AnyClickChatHistory");

const isDev = process.env.NODE_ENV === "development";

// 24 hours in milliseconds
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

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
 * Stored chat session with expiry
 */
interface StoredSession {
  messages: ChatMessage[];
  createdAt: number;
  expiresAt: number;
}

/**
 * In-memory KV store for chat history.
 * In production, replace with Vercel KV, Redis, or similar.
 *
 * Key format: `chat:${sessionId}` where sessionId is derived from user/client identifier
 */
const chatStore = new Map<string, StoredSession>();

/**
 * Prune expired sessions from the store.
 */
function pruneExpiredSessions(): void {
  const now = Date.now();
  const entries = Array.from(chatStore.entries());
  for (const [key, session] of entries) {
    if (session.expiresAt < now) {
      chatStore.delete(key);
      logger.debug("Pruned expired session", { key });
    }
  }
}

/**
 * Get session ID from request headers or generate a default.
 * In production, this should be tied to user authentication.
 */
function getSessionId(request: Request): string {
  // Try to get session from header or cookie
  const sessionHeader = request.headers.get("x-anyclick-session");
  if (sessionHeader) return sessionHeader;

  // Fallback to IP-based session (not ideal for production)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";

  // Create a simple hash for the session
  return `session:${ip}`;
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();

  // Periodic cleanup of expired sessions
  if (Math.random() < 0.1) {
    pruneExpiredSessions();
  }

  try {
    const body = await request.json();
    const { action, messages } = body;
    const sessionId = getSessionId(request);

    logger.debug("History request", {
      requestId,
      action,
      sessionId: isDev ? sessionId : sessionId.slice(0, 20) + "...",
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
      const existingSession = chatStore.get(sessionId);

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
        expiresAt: now + TWENTY_FOUR_HOURS_MS,
      };

      chatStore.set(sessionId, session);

      logger.info("Chat history saved", {
        requestId,
        sessionId: isDev ? sessionId : sessionId.slice(0, 20) + "...",
        messageCount: limitedMessages.length,
        newMessages: newMessages.length,
      });

      logger.performance("Save operation", requestStartTime, { requestId });

      return Response.json({
        success: true,
        messageCount: limitedMessages.length,
        expiresAt: session.expiresAt,
      });
    }

    if (action === "load") {
      const session = chatStore.get(sessionId);

      if (!session) {
        logger.debug("No session found for load", {
          requestId,
          sessionId: isDev ? sessionId : sessionId.slice(0, 20) + "...",
        });
        return Response.json({ messages: [], found: false });
      }

      // Check if session has expired
      if (session.expiresAt < Date.now()) {
        chatStore.delete(sessionId);
        logger.debug("Session expired, returning empty", {
          requestId,
          sessionId: isDev ? sessionId : sessionId.slice(0, 20) + "...",
        });
        return Response.json({ messages: [], found: false, expired: true });
      }

      // Filter out messages older than 24h
      const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
      const validMessages = session.messages.filter(
        (m) => m.timestamp > cutoff,
      );

      logger.info("Chat history loaded", {
        requestId,
        sessionId: isDev ? sessionId : sessionId.slice(0, 20) + "...",
        messageCount: validMessages.length,
      });

      logger.performance("Load operation", requestStartTime, { requestId });

      return Response.json({
        messages: validMessages,
        found: true,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      });
    }

    if (action === "clear") {
      const existed = chatStore.has(sessionId);
      chatStore.delete(sessionId);

      logger.info("Chat history cleared", {
        requestId,
        sessionId: isDev ? sessionId : sessionId.slice(0, 20) + "...",
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
  const sessionId = getSessionId(request);
  const session = chatStore.get(sessionId);

  if (!session || session.expiresAt < Date.now()) {
    return Response.json({ hasHistory: false });
  }

  return Response.json({
    hasHistory: true,
    messageCount: session.messages.length,
    expiresAt: session.expiresAt,
  });
}
