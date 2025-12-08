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

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create logger instance for this route
const logger = createLogger("AnyClickChat");

const isDev = process.env.NODE_ENV === "development";

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

    const { action, context, message, model, systemPrompt, maxLength } = body;

    logger.debug("Request body parsed", {
      requestId,
      action,
      hasContext: !!context,
      contextLength: context?.length || 0,
      hasMessage: !!message,
      messageLength: message?.length || 0,
      model: model || "default",
      hasSystemPrompt: !!systemPrompt,
      maxLength: maxLength || "default",
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
        model: model || "gpt-5-nano",
      });

      const suggestStartTime = Date.now();
      try {
        const result = await generateText({
          model: openai(model || "gpt-5-nano"),
          system: SUGGESTION_SYSTEM_PROMPT,
          prompt: `Element context:\n${context || "No context provided"}\n\nGenerate question suggestions:`,
          maxTokens: 1000,
        });

        logger.performance("AI generateText (suggest)", suggestStartTime, {
          requestId,
          model: model || "gpt-5-nano",
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
          model: model || "gpt-5-nano",
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
          model: openai("gpt-5-mini"),
          system: effectiveSystemPrompt,
          prompt,
          maxTokens: 500,
        });

        logger.performance("AI generateText (refine)", refineStartTime, {
          requestId,
          model: "gpt-5-mini",
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
          model: "gpt-5-mini",
        });
        throw aiError;
      }
    }

    if (action === "chat") {
      logger.info("Processing chat action", {
        requestId,
        model: model || "gpt-5-nano",
        maxLength: maxLength || 500,
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

Important: Keep your response under ${maxLength || 500} characters.`;

      logger.debug("Chat prompt prepared", {
        requestId,
        messageLength: message.length,
        hasContext: !!context,
        maxLength: maxLength || 500,
        usingCustomSystemPrompt: !!systemPrompt,
      });

      const chatStartTime = Date.now();
      try {
        const result = streamText({
          model: openai(model || "gpt-5-nano"),
          system: effectiveSystemPrompt,
          prompt: message,
          maxTokens: Math.min(Math.ceil((maxLength || 500) / 3), 300),
        });

        logger.info("Chat stream initiated", {
          requestId,
          model: model || "gpt-5-nano",
          maxTokens: Math.min(Math.ceil((maxLength || 500) / 3), 300),
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
