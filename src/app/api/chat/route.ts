import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic, anthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";

// ODIN V2.11: 'THE KEY FORGE' (DYNAMIC PROVIDER ADAPTER) 🌑👤🛡️🦾
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    
    // 1. EXTRACT CUSTOM CREDENTIALS (THE KEY FORGE 🏹)
    const customKey = req.headers.get("x-custom-key");
    const customProvider = req.headers.get("x-custom-provider");
    const customModel = req.headers.get("x-custom-model");

    // 2. PROVIDER DETECTION
    let provider: any = openai; 
    let modelId = model || "gpt-4o";

    // 3. OVERRIDE WITH CUSTOM KEYS IF PRESENT (DYNAMIC INJECTION)
    if (customKey && customProvider) {
       if (customProvider === "openai") {
          const client = createOpenAI({ apiKey: customKey });
          provider = client;
          modelId = customModel || "gpt-4o";
       } else if (customProvider === "anthropic") {
          const client = createAnthropic({ apiKey: customKey });
          provider = client;
          modelId = customModel || "claude-3-5-sonnet-20240620";
       } else if (customProvider === "google") {
          const client = createGoogleGenerativeAI({ apiKey: customKey });
          provider = client;
          modelId = customModel || "gemini-1.5-pro";
       } else if (customProvider === "nvidia") {
          // NVIDIA NIM IS OPENAI COMPATIBLE
          const client = createOpenAI({ apiKey: customKey, baseURL: "https://integrate.api.nvidia.com/v1" });
          provider = client;
          modelId = customModel || "qwen/qwen3-coder-480b-a35b-instruct";
       }
    } else {
       // STANDARD ENV-BASED ROUTING
       if (model.startsWith("anthropic:")) {
         provider = anthropic;
         modelId = model.replace("anthropic:", "");
       } else if (model.startsWith("google:")) {
         provider = google;
         modelId = model.replace("google:", "");
       } else if (model.startsWith("openai:")) {
         provider = openai;
         modelId = model.replace("openai:", "");
       } else if (model.startsWith("ollama:")) {
           return handleOllama(messages, model.replace("ollama:", ""));
       } else if (model.startsWith("nvidia:")) {
           return handleNvidia(messages, model.replace("nvidia:", ""));
       }
    }

    // 4. CONVERT & STREAM
    const result = await streamText({
      model: provider(modelId),
      messages: convertToCoreMessages(messages),
      system: "You are ODIN, an elite Agentic AI Architect. Code only in TSX blocks. Specify filenames like: [FILE: App.tsx]."
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[ODIN] Neural Error:", error);
    return new Response(`0:"⚠️ NEURAL ERROR: ${error.message}"\n`, { headers: { "Content-Type": "text/plain" } });
  }
}

// OLLAMA LOCAL ADAPTER (🏠)
async function handleOllama(messages: any[], model: string) {
    const url = process.env.OLLAMA_BASE_URL || "http://localhost:11434/api/chat";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true
        })
    });
    return new Response(response.body);
}

// NVIDIA NIM ADAPTER (🛡️)
async function handleNvidia(messages: any[], model: string) {
    const apiKey = process.env.STEP_3_5_FLASH || ""; 
    const url = "https://integrate.api.nvidia.com/v1/chat/completions";
    const response = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model === "qwin" ? "qwen/qwen3-coder-480b-a35b-instruct" : model,
            messages: [{ role: "system", content: "You are ODIN AI Agent. Use [FILE: name.tsx] format." }, ...messages],
            stream: true
        })
    });
    return new Response(response.body);
}
