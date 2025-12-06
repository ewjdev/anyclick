/**
 * API route for QuickChat AI functionality.
 *
 * Handles both suggestion pre-pass and chat streaming.
 *
 * @module api/anyclick/chat
 */
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, context, message, model, systemPrompt, maxLength } = body;

    if (action === "suggest") {
      // Pre-pass: generate suggested prompts
      const result = await generateText({
        model: openai(model || "gpt-5-nano"),
        system: SUGGESTION_SYSTEM_PROMPT,
        prompt: `Element context:\n${context || "No context provided"}\n\nGenerate question suggestions:`,
        maxTokens: 1000,
      });

      try {
        // Try to parse the JSON response
        const suggestions = JSON.parse(result.text);
        if (Array.isArray(suggestions)) {
          return Response.json({ suggestions: suggestions.slice(0, 5) });
        }
      } catch {
        // If parsing fails, extract suggestions from text
        const lines = result.text
          .split("\n")
          .filter((line) => line.trim())
          .slice(0, 5);
        return Response.json({ suggestions: lines });
      }

      return Response.json({
        suggestions: [
          "What is this element?",
          "How can I style this?",
          "Is this accessible?",
        ],
      });
    }

    if (action === "chat") {
      // Main chat: stream response
      const effectiveSystemPrompt = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

Element context:
${context || "No element context provided."}

Important: Keep your response under ${maxLength || 500} characters.`;

      const result = streamText({
        model: openai(model || "gpt-4o-mini"),
        system: effectiveSystemPrompt,
        prompt: message,
        maxTokens: Math.min(Math.ceil((maxLength || 500) / 3), 300),
      });

      // Return streaming response
      return result.toTextStreamResponse();
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("QuickChat API error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
