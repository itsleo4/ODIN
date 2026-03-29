// ODIN NEURAL GRID (DIRECT PROTOCOL V5.0 - MULTIMODAL V2.3) 🛡️🫀🦾
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages.", { status: 400 });
    }

    // 1. VISION DETECTION: Identify if any message in the stream has an attachment
    const hasVision = messages.some((m: any) => m.experimental_attachments && m.experimental_attachments.length > 0);
    
    // 2. CAPABILITY MAP: Identify which models support image input
    const VISION_CAPABLE = ["Step-3.5-Flash", "Kimi-K2-Thinking", "DeepSeek-V3.2"];
    let modelToUse = model;
    let fallbackInfo = "";

    // 3. AUTO-FALLBACK LOGIC: If image exists but model lacks "eyes", switch to Step-3.5-Flash
    if (hasVision && !VISION_CAPABLE.includes(model)) {
       modelToUse = "Step-3.5-Flash";
       fallbackInfo = `👁️ [SYS] Model ${model} is code-pure (Text-only). Routing vision via Step-3.5-Flash Titan. `;
       console.log(`[ODIN] Vision Fallback: ${model} -> ${modelToUse}`);
    }

    console.log(`[ODIN] Architecting with Titan: ${modelToUse} ${hasVision ? '(Multimodal)' : '(Text)'}`);

    // NEURAL MULTIMODAL CONVERTER: Formats images for NVIDIA NIM protocols
    const formattedMessages = messages.map((m: any) => {
      if (m.experimental_attachments && m.experimental_attachments.length > 0) {
        const content: any[] = [{ type: "text", text: m.content }];
        m.experimental_attachments.forEach((att: any) => {
          if (att.contentType?.startsWith('image/') || att.url?.startsWith('data:image/')) {
            content.push({ type: "image_url", image_url: { url: att.url } });
          }
        });
        return { role: m.role==='assistant'?'assistant':'user', content };
      }
      return { role: m.role==='assistant'?'assistant':'user', content: m.content };
    });

    let url = "https://integrate.api.nvidia.com/v1/chat/completions"; 
    let apiKey = "";
    let modelId = "";

    // ----------------- STABILIZED TITAN IDENTIFIERS (V2.3) -----------------
    switch (modelToUse) {
      case "Step-3.5-Flash":
        apiKey = process.env.STEP_3_5_FLASH || "";
        modelId = "stepfun-ai/step-3.5-flash";
        break;
      case "Kimi-K2-Thinking":
        apiKey = process.env.KIMI_K2_THINKING || "";
        modelId = "moonshotai/kimi-k2-thinking";
        break;
      case "Mistral-Small-3-24b":
        apiKey = process.env.MISTRAL_SMALL_3_24B || "";
        modelId = "mistralai/mistral-small-24b-instruct-2503"; 
        break;
      case "GPT-OSS-20b":
        apiKey = process.env.GPT_OSS_20B || "";
        modelId = "openai/gpt-oss-20b";
        break;
      case "Qwen3-Coder-480b":
        apiKey = process.env.QWEN3_CODER_480B_A35B_INSTRUCT || "";
        modelId = "qwen/qwen3-coder-480b-a35b-instruct";
        break;
      case "DeepSeek-V3.2":
        apiKey = process.env.DEEPSEEK_V3_2 || "";
        modelId = "deepseek-ai/deepseek-v3.2";
        break;
      default:
        apiKey = process.env.STEP_3_5_FLASH || "";
        modelId = "stepfun-ai/step-3.5-flash";
    }

    if (!apiKey) {
       return new Response(`0:"⚠️ Engine Access Denied: Missing Key for ${modelToUse}."\n`, { headers: { "Content-Type": "text/plain" } });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: "You are ODIN, an elite Agentic AI Architect. Code only in TSX blocks. Specify filenames like: [FILE: App.tsx]." },
          ...formattedMessages
        ],
        stream: true,
        temperature: 0.1,
        max_tokens: 4096 
      })
    });

    if (!response.ok) {
       const errData = await response.json().catch(() => ({ error: { message: "Internal Neural Failure" } }));
       return new Response(`0:"⚠️ ENGINE REJECTED (${modelToUse}): ${errData.error?.message || "Not Found/Unauthorized"}. Profile Key mismatch."\n`, { 
          status: 200, headers: { "Content-Type": "text/plain" } 
       });
    }

    // 4. INJECT FALLBACK INFO IF NECESSARY
    if (fallbackInfo) {
       const stream = new ReadableStream({
          async start(controller) {
             controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(fallbackInfo)}\n`));
             const reader = response.body!.getReader();
             while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
             }
             controller.close();
          }
       });
       return new Response(stream);
    }

    return new Response(response.body);

  } catch (error: any) {
    return new Response(`0:"⚠️ CRITICAL ENGINE ADVISORY: ${error.message}."\n`, { 
       status: 200, headers: { "Content-Type": "text/plain" } 
    });
  }
}
