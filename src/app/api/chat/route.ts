import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";

// ODIN V2.4: UNIVERSAL BYOK ROUTER — ALL FREE-TIER DEFAULTS 🏹
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Extract credentials from headers (set by the client)
    const customKey      = req.headers.get("x-custom-key");
    const customProvider = (req.headers.get("x-custom-provider") || "").toLowerCase().trim();
    // Strip any legacy "provider:model" prefix (e.g. "openai:gpt-4o" → "gpt-4o")
    const rawModel       = req.headers.get("x-custom-model") || "";
    const customModel    = rawModel.includes(":") ? rawModel.split(":").slice(1).join(":") : rawModel;

    // Guard: must have a key
    if (!customKey) {
      return new Response(
        `0:${JSON.stringify("⚠️ No API key found. Go to Settings → API Keys and add your key first.")}\n`,
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    let provider: any;
    let modelId: string;

    // ─── PROVIDER ROUTING ────────────────────────────────────────────────────
    if (customProvider === "openai" || customProvider === "") {
      // Free tier → gpt-4o-mini. Full tier → gpt-4o
      provider = createOpenAI({ apiKey: customKey });
      modelId  = customModel || "gpt-4o-mini";

    } else if (customProvider === "google" || customProvider === "gemini") {
      // Google / Gemini — free tier uses gemini-2.0-flash (latest free)
      provider = createGoogleGenerativeAI({ apiKey: customKey });
      modelId  = customModel || "gemini-2.0-flash";

    } else if (customProvider === "anthropic" || customProvider === "claude") {
      // Free-cheapest: claude-3-haiku
      provider = createAnthropic({ apiKey: customKey });
      modelId  = customModel || "claude-3-haiku-20240307";

    } else if (customProvider === "nvidia" || customProvider === "nvidia-nim") {
      // NVIDIA NIM is OpenAI-compatible; qwen3-235b is free
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      modelId = customModel || "qwen/qwen3-235b-a22b-instruct";

    } else if (customProvider === "groq") {
      // Groq free tier — fastest inference
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      modelId = customModel || "llama3-8b-8192";

    } else if (customProvider === "deepseek") {
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      modelId = customModel || "deepseek-chat";

    } else if (customProvider === "mistral") {
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://api.mistral.ai/v1",
      });
      modelId = customModel || "mistral-small-latest";

    } else if (customProvider === "together" || customProvider === "togetherai") {
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://api.together.xyz/v1",
      });
      modelId = customModel || "mistralai/Mixtral-8x7B-Instruct-v0.1";

    } else {
      // UNIVERSAL FALLBACK: treat as OpenAI-compatible endpoint
      // If provider looks like a URL use it as baseURL, otherwise OpenAI default
      const baseURL = customProvider.startsWith("http") ? customProvider : undefined;
      provider = createOpenAI({ apiKey: customKey, baseURL });
      modelId  = customModel || "gpt-4o-mini";
    }

    // ─── STREAM ──────────────────────────────────────────────────────────────
    const result = await streamText({
      model: provider(modelId),
      messages: convertToCoreMessages(messages),
      system:
        "You are ODIN, a brilliant AI assistant and code architect. " +
        "When writing code responses, format files as:\n" +
        "[FILE: filename.tsx]\n```tsx\n// code here\n```\n" +
        "Be concise, accurate, and helpful.",
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[ODIN] Error:", error);
    const msg = error?.message || String(error);

    // Human-readable error messages
    let friendly: string;
    if (msg.includes("API key") || msg.includes("401") || msg.includes("Incorrect API")) {
      friendly = "⚠️ Invalid API key. Go to Settings and double-check your key.";
    } else if (msg.includes("does not exist") || msg.includes("not found")) {
      friendly = `⚠️ Model not available on your plan. Your free tier may not support this model. Try a different provider. (${msg})`;
    } else if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit")) {
      friendly = "⚠️ Rate limit hit. Wait a moment and try again.";
    } else if (msg.includes("quota") || msg.includes("billing") || msg.includes("insufficient")) {
      friendly = "⚠️ Usage quota exceeded. Check your API plan or billing.";
    } else {
      friendly = `⚠️ Error: ${msg}`;
    }

    return new Response(`0:${JSON.stringify(friendly)}\n`, {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
