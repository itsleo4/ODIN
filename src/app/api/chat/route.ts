import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";

// ODIN V2.4: UNIVERSAL KEY FORGE — SMART FREE-TIER ROUTING 🏹
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    // 1. EXTRACT CUSTOM CREDENTIALS
    const customKey = req.headers.get("x-custom-key");
    const customProvider = req.headers.get("x-custom-provider") || "";
    // Strip any provider prefix from model (e.g. "openai:gpt-4o" → "gpt-4o")
    const rawCustomModel = req.headers.get("x-custom-model") || "";
    const customModel = rawCustomModel.includes(":") 
      ? rawCustomModel.split(":").slice(1).join(":") 
      : rawCustomModel;

    if (!customKey) {
      return new Response(
        `0:"⚠️ No API key found. Go to Settings → API Keys and add your key first."\n`,
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // 2. SMART PROVIDER ROUTING — free-tier defaults
    const lp = customProvider.toLowerCase().trim();
    let provider: any;
    let modelId: string;

    if (lp === "openai" || lp === "") {
      // OpenAI: free tier = gpt-4o-mini, paid = gpt-4o
      provider = createOpenAI({ apiKey: customKey });
      modelId = customModel || "gpt-4o-mini";

    } else if (lp === "anthropic") {
      provider = createAnthropic({ apiKey: customKey });
      // Free/cheapest: claude-haiku. Paid: claude-3-5-sonnet
      modelId = customModel || "claude-3-haiku-20240307";

    } else if (lp === "google") {
      provider = createGoogleGenerativeAI({ apiKey: customKey });
      // Free tier: gemini-1.5-flash. Paid: gemini-1.5-pro
      modelId = customModel || "gemini-1.5-flash";

    } else if (lp === "nvidia" || lp === "nvidia-nim") {
      provider = createOpenAI({
        apiKey: customKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      // NVIDIA free tier — qwen3-235b is smaller and free
      modelId = customModel || "qwen/qwen3-235b-a22b-instruct";

    } else if (lp === "groq") {
      provider = createOpenAI({
        apiKey: customKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      // Groq free tier — fastest free model
      modelId = customModel || "llama3-8b-8192";

    } else if (lp === "deepseek") {
      provider = createOpenAI({
        apiKey: customKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      // DeepSeek cheapest/free model
      modelId = customModel || "deepseek-chat";

    } else if (lp === "together" || lp === "togetherai") {
      provider = createOpenAI({
        apiKey: customKey,
        baseURL: "https://api.together.xyz/v1",
      });
      modelId = customModel || "mistralai/Mixtral-8x7B-Instruct-v0.1";

    } else if (lp === "mistral") {
      provider = createOpenAI({
        apiKey: customKey,
        baseURL: "https://api.mistral.ai/v1",
      });
      modelId = customModel || "mistral-small-latest";

    } else {
      // UNIVERSAL FALLBACK: treat as OpenAI-compatible
      // Provider name might be a base URL or unknown service
      const baseURL = lp.startsWith("http") ? lp : undefined;
      provider = createOpenAI({ apiKey: customKey, baseURL });
      // Use the provider as the model name if it looks like one, else default
      modelId = customModel || (baseURL ? "gpt-4o-mini" : lp);
    }

    // 3. STREAM
    const result = await streamText({
      model: provider(modelId),
      messages: convertToCoreMessages(messages),
      system:
        "You are ODIN, an elite AI assistant and code architect. When writing code, wrap files like: [FILE: App.tsx]\n```tsx\n...\n```",
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[ODIN] Neural Error:", error);

    // Give the user a readable error in the chat
    const msg = error?.message || "Unknown error";
    const friendly = msg.includes("does not exist")
      ? `⚠️ Model not found. Your plan may not support this model. Try a free-tier model. (${msg})`
      : msg.includes("Incorrect API key") || msg.includes("401")
      ? "⚠️ Invalid API key. Double-check the key in Settings."
      : msg.includes("429") || msg.includes("rate limit")
      ? "⚠️ Rate limit hit. Wait a moment and try again."
      : msg.includes("quota") || msg.includes("billing")
      ? "⚠️ Usage quota exceeded. Check your API plan billing."
      : `⚠️ NEURAL ERROR: ${msg}`;

    return new Response(`0:${JSON.stringify(friendly)}\n`, {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
