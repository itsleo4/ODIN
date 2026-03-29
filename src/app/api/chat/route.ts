import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";

// ODIN V2.5: AUTO-DETECT KEY FORMAT + UNIVERSAL BYOK ROUTER 🏹
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const customKey      = req.headers.get("x-custom-key") || "";
    const customProvider = (req.headers.get("x-custom-provider") || "").toLowerCase().trim();
    // Strip legacy "provider:model" prefix
    const rawModel       = req.headers.get("x-custom-model") || "";
    const customModel    = rawModel.includes(":") ? rawModel.split(":").slice(1).join(":") : rawModel;

    if (!customKey) {
      return new Response(
        `0:${JSON.stringify("⚠️ No API key found. Go to Settings → API Keys and add your key first.")}\n`,
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // ─── AUTO-DETECT KEY FORMAT ────────────────────────────────────────────
    // nvapi- keys are ALWAYS NVIDIA NIM regardless of provider name typed
    const isNvidiaKey = customKey.startsWith("nvapi-");
    // sk-ant- keys are Anthropic
    const isAnthropicKey = customKey.startsWith("sk-ant-");
    // AIza keys are Google
    const isGoogleKey = customKey.startsWith("AIza");
    // gsk_ keys are Groq
    const isGroqKey = customKey.startsWith("gsk_");

    let provider: any;
    let modelId: string;

    // NVIDIA auto-detect: nvapi- key always → NVIDIA NIM
    if (isNvidiaKey || customProvider === "nvidia" || customProvider === "nvidia-nim"
        || customProvider === "moonshotai" || customProvider === "kimi"
        || customProvider === "qwen" || customProvider === "meta"
        || customProvider === "mistral-nim") {
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      // customModel lets user specify exact NVIDIA model (e.g. "moonshotai/kimi-k2-thinking")
      modelId = customModel || "qwen/qwen3-235b-a22b-instruct";

    } else if (isGroqKey || customProvider === "groq") {
      provider = createOpenAI({
        apiKey:  customKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      modelId = customModel || "llama3-8b-8192";

    } else if (isAnthropicKey || customProvider === "anthropic" || customProvider === "claude") {
      provider = createAnthropic({ apiKey: customKey });
      modelId  = customModel || "claude-3-haiku-20240307";

    } else if (isGoogleKey || customProvider === "google" || customProvider === "gemini") {
      provider = createGoogleGenerativeAI({ apiKey: customKey });
      modelId  = customModel || "gemini-2.0-flash";

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
      // UNIVERSAL FALLBACK: treat as OpenAI-compatible
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
        "When writing code, format each file as:\n" +
        "[FILE: filename.tsx]\n```tsx\n// code here\n```\n" +
        "Be concise, accurate, and helpful.",
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[ODIN] Error:", error);
    const msg = error?.message || String(error);

    let friendly: string;
    if (msg.includes("API key") || msg.includes("401") || msg.includes("Incorrect API") || msg.includes("invalid_api_key")) {
      friendly = "⚠️ Invalid API key. Go to Settings and double-check your key.";
    } else if (msg.includes("does not exist") || msg.includes("not found") || msg.includes("model_not_found")) {
      friendly = `⚠️ Model not found on your plan. Check your model ID in Settings. (${msg})`;
    } else if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit")) {
      friendly = "⚠️ Rate limit hit. Wait a moment and try again.";
    } else if (msg.includes("quota") || msg.includes("billing") || msg.includes("insufficient_quota")) {
      friendly = "⚠️ API quota exceeded. Check your account billing or usage limits.";
    } else {
      friendly = `⚠️ ${msg}`;
    }

    return new Response(`0:${JSON.stringify(friendly)}\n`, {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
