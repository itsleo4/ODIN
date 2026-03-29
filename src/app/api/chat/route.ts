// ODIN NEURAL GRID (DIRECT PROTOCOL V5.0 - MULTIMODAL V2) 🛡️🫀🦾
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages.", { status: 400 });
    }

    console.log(`[ODIN] Architecting with Multimodal Titan: ${model}`);

    // NEURAL MULTIMODAL CONVERTER: Formats images for NVIDIA NIM/OpenAI protocols
    const formattedMessages = messages.map((m: any) => {
      // 1. Check for Attachments (Images)
      if (m.experimental_attachments && m.experimental_attachments.length > 0) {
        const content: any[] = [{ type: "text", text: m.content }];
        
        m.experimental_attachments.forEach((att: any) => {
          if (att.contentType?.startsWith('image/') || att.url?.startsWith('data:image/')) {
            content.push({
              type: "image_url",
              image_url: { url: att.url }
            });
          }
        });
        
        return { role: m.role==='assistant'?'assistant':'user', content };
      }
      
      // 2. Default Text Content
      return { role: m.role==='assistant'?'assistant':'user', content: m.content };
    });

    let url = "https://integrate.api.nvidia.com/v1/chat/completions"; 
    let apiKey = "";
    let modelId = "";
    let body: any = {
      messages: [
        { role: "system", content: "You are ODIN, an elite Agentic AI Architect. You can read images and files. Generate FULL web applications. Code only in TSX markdown blocks. Specify filenames like: [FILE: App.tsx]." },
        ...formattedMessages
      ],
      stream: true,
      temperature: 0.1,
      max_tokens: 4096 
    };

    // ----------------- INTELLIGENCE CORE MAPPING (V5 TARGETS) -----------------

    switch (model) {
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
        modelId = "mistralai/mistral-small-3.1-24b-instruct-2503";
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
       return new Response(`0:"⚠️ Engine Access Denied: Missing Key for ${model}."\n`, { headers: { "Content-Type": "text/plain" } });
    }

    // ----------------- THE MULTIMODAL EXECUTION -----------------

    body.model = modelId;
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "API_KEY": apiKey, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
       const errData = await response.json().catch(() => ({ error: { message: "Internal Neural Failure" } }));
       return new Response(`0:"⚠️ ENGINE REJECTED (${model}): ${errData.error?.message || "Not Found/Unauthorized"}. Note: Some titans have stricter vision limits."\n`, { 
          status: 200, headers: { "Content-Type": "text/plain" } 
       });
    }

    return new Response(response.body);

  } catch (error: any) {
    return new Response(`0:"⚠️ CRITICAL ENGINE ADVISORY: ${error.message}."\n`, { 
       status: 200, headers: { "Content-Type": "text/plain" } 
    });
  }
}
