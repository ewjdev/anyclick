/**
 * API route for QuickChat AI functionality.
 *
 * Handles both suggestion pre-pass and chat streaming.
 *
 * @module api/anyclick/chat
 */
import { createLogger, generateRequestId } from "@/lib/logger";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

const DEFAULT_MODEL = "gpt-5-nano";
const DEFAULT_MODEL_FAST = "gpt-5-mini";
const DEFAULT_MAX_TOKENS = 10000;
const CHARACTER_TO_TOKEN_RATIO = 3;

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create logger instance for this route
const logger = createLogger("AnyClickChat");

const isDev = process.env.NODE_ENV === "development";

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// Default system prompt for element context
const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that provides quick, concise answers about web elements and UI. 
Keep responses brief (2-3 sentences max) and actionable. 
Focus on practical information the user can use immediately.
If you don't have enough context, say so briefly and ask a clarifying question.`;

// Suggestion system prompt
const SUGGESTION_SYSTEM_PROMPT = `You are generating quick question suggestions about a web element.
Based on the element context provided, generate 3-4 short, useful questions a developer might ask.
Return ONLY a JSON array of strings, no explanation. Example: ["What is this?", "How to style it?"]
Questions should be concise (under 30 characters ideally).`;

// Default refinement system prompt for t3.chat
const DEFAULT_REFINEMENT_SYSTEM_PROMPT = `You are a prompt refinement assistant for a coding/UI agent.
You receive:
- The user's selected text
- Optional context that may include page URL, DOM hierarchy/path, surrounding text, and element attributes

Return exactly ONE concise prompt (<= 200 characters) that:
- Starts with the user's intent/question when clear, otherwise ask a single clarifying question
- Includes relevant element or page details (text, role/tag/aria, hierarchy/path, URL) when provided
- Avoids markdown, quotes, or bullet points
- Never returns an empty string; if information is missing, ask the most helpful clarifying question.`;

function buildFallbackRefinePrompt(
  selectedText: string,
  context?: unknown,
): string {
  const cleanSelected = selectedText.trim().replace(/\s+/g, " ");

  const contextSnippet =
    typeof context === "string"
      ? context.trim().replace(/\s+/g, " ").slice(0, 300)
      : context
        ? JSON.stringify(context).slice(0, 300)
        : "";

  const contextPart = contextSnippet
    ? ` Context: ${contextSnippet}`
    : " Context: none provided";

  return `Improve or clarify: "${cleanSelected}".${contextPart}`;
}

/**
 * Extract text content from a message (handles both v1 and v2 formats).
 * v1: { content: string }
 * v2: { parts: Array<{ type: 'text', text: string }> }
 */
function getMessageText(msg: {
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}): string {
  // v2+ format: extract from parts
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .map((p) => {
        const maybeText = (p as unknown as { text?: unknown }).text;
        if (typeof maybeText === "string") return maybeText;
        const maybeContent = (p as unknown as { content?: unknown }).content;
        if (typeof maybeContent === "string") return maybeContent;
        return "";
      })
      .join("");
  }
  // v1 format: use content directly
  return msg.content || "";
}

/**
 * Handle ai-sdk useChat format requests.
 * useChat sends: { messages: [...], ...body options from the body config }
 */
async function handleAiSdkChat(
  request: Request,
  body: {
    messages: Array<{
      role: string;
      content?: string;
      parts?: Array<{ type: string; text?: string }>;
    }>;
    action?: string;
    context?: string;
    model?: string;
    systemPrompt?: string;
    maxLength?: number;
  },
  requestId: string,
  requestStartTime: number,
) {
  const { messages, context, model, systemPrompt, maxLength } = body;

  logger.info("[BACKEND] Request headers (chat)", {
    requestId,
    contentType: request.headers.get("content-type"),
    accept: request.headers.get("accept"),
    userAgent: isDev
      ? request.headers.get("user-agent")
      : (request.headers.get("user-agent") || "").slice(0, 50),
  });

  logger.info("[BACKEND] Processing ai-sdk chat format", {
    requestId,
    messageCount: messages.length,
    messages: messages.map((m) => {
      const text = getMessageText(m);
      return {
        role: m.role,
        contentLength: text.length,
        hasParts: !!m.parts,
        hasContent: !!m.content,
      };
    }),
    model: model || DEFAULT_MODEL,
    hasContext: !!context,
    contextLength: context?.length || 0,
    bodyKeys: Object.keys(body),
  });

  // Ensure there's at least one user message.
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  if (!lastUserMessage) {
    logger.warn("[BACKEND] No user message found in messages array", {
      requestId,
      messages: messages.map((m) => m.role),
    });
    return Response.json({ error: "No user message found" }, { status: 400 });
  }

  const lastUserText = getMessageText(lastUserMessage);
  logger.info("[BACKEND] Found last user message", {
    requestId,
    content: lastUserText.substring(0, 100),
    contentLength: lastUserText.length,
  });

  const maxTokens =
    typeof maxLength === "number"
      ? Math.min(maxLength, DEFAULT_MAX_TOKENS)
      : DEFAULT_MAX_TOKENS;
  const maxChars = Math.ceil(maxTokens * CHARACTER_TO_TOKEN_RATIO);
  // Build system prompt with context
  const effectiveSystemPrompt = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

Element context:
${context || "No element context provided."}

Important: Keep your response under ${maxChars} characters.`;

  logger.debug("[BACKEND] ai-sdk chat prompt prepared", {
    requestId,
    lastMessageLength: lastUserText.length,
    hasContext: !!context,
    maxTokens,
    maxChars,
    systemPromptLength: effectiveSystemPrompt.length,
  });

  const chatStartTime = Date.now();
  try {
    // Stream using the full message history (ai-sdk transport expects data stream protocol)
    const modelName = model || DEFAULT_MODEL;

    logger.info("[BACKEND] About to call streamText (streaming)", {
      requestId,
      modelName,
      maxTokens,
      systemPromptLength: effectiveSystemPrompt.length,
      lastUserMessage: lastUserText.substring(0, 200),
    });

    const result = streamText({
      // IMPORTANT: use chat model explicitly for streaming text deltas.
      // With some OpenAI "responses" models/settings, we observed reasoning events
      // without any text deltas; `openai.chat()` reliably emits text.
      model: openai.chat(modelName as Parameters<typeof openai.chat>[0]),
      system: effectiveSystemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: getMessageText(m),
      })),
      maxOutputTokens: maxTokens,
      // Reduce chance of "reasoning-only" output.
      providerOptions: {
        openai: {
          // This model does not accept "none" (it supports minimal/low/medium/high).
          reasoningEffort: "minimal",
          textVerbosity: "low",
        },
      },
    });

    logger.info("[BACKEND] streamText started", {
      requestId,
      modelName,
      maxTokens,
    });

    logger.performance("streamText init time", chatStartTime, { requestId });

    // ai-sdk versions differ in which streaming response helpers are available.
    // DefaultChatTransport typically expects the "data stream" protocol; older
    // clients use the "UI message stream" protocol. We choose the best available
    // method at runtime and log which one we used.
    const anyResult = result as unknown as {
      toDataStreamResponse?: () => Response;
      toUIMessageStreamResponse: () => Response;
    };

    const baseResponse =
      typeof anyResult.toDataStreamResponse === "function"
        ? (() => {
            logger.info("[BACKEND] Using toDataStreamResponse()", {
              requestId,
            });
            return anyResult.toDataStreamResponse();
          })()
        : (() => {
            logger.info("[BACKEND] Using toUIMessageStreamResponse()", {
              requestId,
            });
            return anyResult.toUIMessageStreamResponse();
          })();

    // Add headers that make proxy buffering less likely (best-effort).
    const responseHeaders = new Headers(baseResponse.headers);
    responseHeaders.set("Cache-Control", "no-cache, no-transform");
    responseHeaders.set("X-Accel-Buffering", "no");
    responseHeaders.set("X-Anyclick-Request-Id", requestId);

    logger.info("[BACKEND] Returning stream response", {
      requestId,
      status: baseResponse.status,
      responseHeaders: isDev ? headersToObject(responseHeaders) : undefined,
      contentType: responseHeaders.get("content-type"),
    });

    const bodyStream = baseResponse.body;
    if (!bodyStream) {
      logger.warn("[BACKEND] Stream response had no body", { requestId });
      return new Response(null, {
        status: baseResponse.status,
        headers: responseHeaders,
      });
    }

    // Tee the stream so we can log chunk timings without consuming the client stream.
    const [clientStream, logStream] = bodyStream.tee();
    void (async () => {
      const logStart = Date.now();
      let firstChunkMs: number | null = null;
      let totalBytes = 0;
      let chunks = 0;
      const previews: string[] = [];
      const reader = logStream.getReader();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          chunks += 1;
          if (value) {
            totalBytes += value.byteLength;
            if (firstChunkMs === null) {
              firstChunkMs = Date.now() - logStart;
              logger.info("[BACKEND] Stream first chunk observed", {
                requestId,
                firstChunkMs,
                firstChunkBytes: value.byteLength,
              });
            }
            // In dev, log a few chunk previews to confirm protocol/data.
            if (isDev && chunks <= 5) {
              try {
                const preview = new TextDecoder().decode(value).slice(0, 200);
                previews.push(preview);
                logger.debug("[BACKEND] Stream chunk preview", {
                  requestId,
                  chunk: chunks,
                  preview,
                });
              } catch {
                // ignore decoding issues
              }
            }
          }
        }

        logger.info("[BACKEND] Stream completed", {
          requestId,
          chunks,
          totalBytes,
          durationMs: Date.now() - logStart,
          previews: isDev ? previews : undefined,
        });
      } catch (err) {
        logger.error("[BACKEND] Stream logging failed", err, { requestId });
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
      }
    })();

    return new Response(clientStream, {
      status: baseResponse.status,
      headers: responseHeaders,
    });
  } catch (aiError) {
    logger.error("[BACKEND] AI stream failed (ai-sdk path)", aiError, {
      requestId,
      model: model || DEFAULT_MODEL,
      errorMessage:
        aiError instanceof Error ? aiError.message : String(aiError),
      errorStack: aiError instanceof Error ? aiError.stack : undefined,
    });
    throw aiError;
  }
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();
  const requestUrl = request.url;
  const userAgent = request.headers.get("user-agent") || "unknown";

  logger.info("Incoming request", {
    requestId,
    method: "POST",
    url: requestUrl,
    userAgent: isDev ? userAgent : userAgent.substring(0, 50),
  });

  try {
    const bodyStartTime = Date.now();
    const body = await request.json();
    logger.performance("Request body parsed", bodyStartTime, { requestId });

    // Handle ai-sdk useChat format (messages array)
    // useChat sends: { messages: [...], ...body options }
    logger.info("[BACKEND] Checking request format", {
      requestId,
      hasMessages: !!body.messages,
      isMessagesArray: Array.isArray(body.messages),
      bodyKeys: Object.keys(body),
      bodySample: JSON.stringify(body).substring(0, 500),
    });

    if (body.messages && Array.isArray(body.messages)) {
      logger.info(
        "[BACKEND] Detected ai-sdk format, routing to handleAiSdkChat",
        {
          requestId,
          messageCount: body.messages.length,
        },
      );
      return handleAiSdkChat(request, body, requestId, requestStartTime);
    }

    logger.info("[BACKEND] Using legacy action-based format", { requestId });

    const { action, context, message, model, systemPrompt, maxLength } = body;

    const maxTokens =
      typeof maxLength === "number"
        ? Math.min(maxLength, DEFAULT_MAX_TOKENS)
        : DEFAULT_MAX_TOKENS;
    const maxChars = Math.ceil(maxTokens * CHARACTER_TO_TOKEN_RATIO);

    logger.debug("Request body parsed", {
      message: JSON.stringify(message),
      requestId,
      action,
      hasContext: !!context,
      contextLength: context?.length || 0,
      hasMessage: !!message,
      messageLength: message?.length || 0,
      model: model || "default",
      hasSystemPrompt: !!systemPrompt,
      maxTokens: maxTokens || "default",
      maxChars: maxChars || "default",
    });

    if (!action) {
      logger.warn("Missing action parameter", {
        requestId,
        body: Object.keys(body),
      });
      return Response.json(
        { error: "Missing action parameter" },
        { status: 400 },
      );
    }

    if (action === "suggest") {
      logger.info("Processing suggest action", {
        requestId,
        model: model || DEFAULT_MODEL,
      });

      const suggestStartTime = Date.now();
      try {
        const result = await generateText({
          model: openai(model || DEFAULT_MODEL),
          system: SUGGESTION_SYSTEM_PROMPT,
          prompt: `Element context:\n${context || "No context provided"}\n\nGenerate question suggestions:`,
          maxOutputTokens: Math.min(DEFAULT_MAX_TOKENS, 4000),
        });

        logger.performance("AI generateText (suggest)", suggestStartTime, {
          requestId,
          model: model || DEFAULT_MODEL,
          responseLength: result.text.length,
        });

        let suggestions: unknown;
        try {
          // Try to parse the JSON response
          suggestions = JSON.parse(result.text);
          if (Array.isArray(suggestions)) {
            const finalSuggestions = suggestions.slice(0, 5);
            logger.info("Suggestions generated successfully", {
              requestId,
              count: finalSuggestions.length,
              suggestions: JSON.stringify(finalSuggestions),
            });
            logger.performance(
              "Total request time (suggest)",
              requestStartTime,
              { requestId },
            );
            return Response.json({ suggestions: finalSuggestions });
          }
        } catch (parseError) {
          logger.warn(
            "Failed to parse suggestions as JSON, falling back to text parsing",
            {
              requestId,
              error:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError),
            },
          );
          // If parsing fails, extract suggestions from text
          const lines = result.text
            .split("\n")
            .filter((line) => line.trim())
            .slice(0, 5);
          logger.info("Suggestions extracted from text", {
            requestId,
            count: lines.length,
          });
          logger.performance("Total request time (suggest)", requestStartTime, {
            requestId,
          });
          return Response.json({ suggestions: lines });
        }

        logger.warn("Suggestions parsing returned non-array, using fallback", {
          requestId,
          parsedType: typeof suggestions,
        });
        logger.performance("Total request time (suggest)", requestStartTime, {
          requestId,
        });
        return Response.json({
          suggestions: [
            "What is this element?",
            "How can I style this?",
            "Is this accessible?",
          ],
        });
      } catch (aiError) {
        logger.error("AI generation failed for suggest action", aiError, {
          requestId,
          model: model || DEFAULT_MODEL,
        });
        throw aiError;
      }
    }

    if (action === "refine") {
      logger.info("Processing refine action", { requestId });
      const { selectedText } = body;

      if (!selectedText || typeof selectedText !== "string") {
        logger.warn("Missing or invalid selectedText for refine action", {
          requestId,
          selectedTextType: typeof selectedText,
          hasSelectedText: !!selectedText,
        });
        return Response.json(
          { error: "selectedText is required for refine action" },
          { status: 400 },
        );
      }

      const effectiveSystemPrompt =
        systemPrompt || DEFAULT_REFINEMENT_SYSTEM_PROMPT;

      const prompt = `Selected text to refine:
"""
${selectedText}
"""

${context ? `Context:\n${context}` : ""}

Refine this into a clear, well-formed prompt for t3.chat:`;

      logger.debug("Refine prompt prepared", {
        requestId,
        selectedTextLength: selectedText.length,
        hasContext: !!context,
        usingCustomSystemPrompt: !!systemPrompt,
      });

      const refineStartTime = Date.now();
      try {
        const result = await generateText({
          model: openai(DEFAULT_MODEL),
          system: effectiveSystemPrompt,
          prompt,
          maxOutputTokens: Math.min(DEFAULT_MAX_TOKENS, 4000),
        });

        logger.performance("AI generateText (refine)", refineStartTime, {
          requestId,
          model: DEFAULT_MODEL,
          responseLength: result.text.length,
        });

        const refinedPrompt = result.text.trim();
        if (!refinedPrompt) {
          const fallbackPrompt = buildFallbackRefinePrompt(
            selectedText,
            context,
          );
          logger.warn("Refine returned empty, using fallback prompt", {
            requestId,
            hasContext: !!context,
            selectedTextLength: selectedText.length,
          });
          logger.performance("Total request time (refine)", requestStartTime, {
            requestId,
          });
          return Response.json({ refinedPrompt: fallbackPrompt });
        }

        logger.info("Prompt refined successfully", {
          requestId,
          originalLength: selectedText.length,
          refinedLength: refinedPrompt.length,
        });
        logger.performance("Total request time (refine)", requestStartTime, {
          requestId,
        });

        return Response.json({ refinedPrompt });
      } catch (aiError) {
        logger.error("AI generation failed for refine action", aiError, {
          requestId,
          model: DEFAULT_MODEL,
        });
        throw aiError;
      }
    }

    if (action === "chat") {
      logger.info("Processing chat action", {
        requestId,
        model: model || DEFAULT_MODEL,
        maxTokens,
        maxChars,
      });

      if (!message) {
        logger.warn("Missing message for chat action", { requestId });
        return Response.json(
          { error: "message is required for chat action" },
          { status: 400 },
        );
      }

      // Main chat: stream response
      const effectiveSystemPrompt = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

Element context:
${context || "No element context provided."}

Important: Keep your response under ${maxChars} characters.`;

      logger.debug("Chat prompt prepared", {
        requestId,
        messageLength: message.length,
        hasContext: !!context,
        maxTokens,
        maxChars,
        usingCustomSystemPrompt: !!systemPrompt,
      });

      const chatStartTime = Date.now();
      try {
        const result = streamText({
          model: openai(model || DEFAULT_MODEL),
          system: effectiveSystemPrompt,
          prompt: message,
          maxOutputTokens: maxTokens,
        });

        logger.info("Chat stream initiated", {
          requestId,
          model: model || DEFAULT_MODEL,
          maxTokens,
        });
        logger.performance("Stream initialization time", chatStartTime, {
          requestId,
        });
        logger.performance("Total request time (chat)", requestStartTime, {
          requestId,
        });

        // Return streaming response
        return result.toTextStreamResponse();
      } catch (aiError) {
        logger.error("AI stream failed for chat action", aiError, {
          requestId,
          model: model || "gpt-5-nano",
        });
        throw aiError;
      }
    }

    logger.warn("Invalid action provided", {
      requestId,
      action,
      validActions: ["suggest", "refine", "chat"],
    });
    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Request processing failed", error, {
      requestId,
      url: requestUrl,
    });
    logger.performance("Total request time (error)", requestStartTime, {
      requestId,
    });

    // Don't expose internal error details in production
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
