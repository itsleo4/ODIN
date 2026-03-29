// ODIN NEURAL GRID (DIRECT PROTOCOL V4.2 - OPTIMIZED TITANS) 🛡️🫀🦾
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages.", { status: 400 });
    }

    console.log(`[ODIN] Architecting with Optimized Titan: ${model}`);

    // SANITIZATION: NVIDIA APIs strictly reject extra fields (like IDs or Attachments)
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    let url = "https://integrate.api.nvidia.com/v1/chat/completions"; 
    let apiKey = "";
    let modelId = "";
    let body: any = {
      messages: [
        { role: "system", content: "You are ODIN, an elite AI developer. Code ONLY in Markdown TSX blocks. Export 'App' as default. Use Tailwind." },
        ...sanitizedMessages
      ],
      stream: true,
      temperature: 0.1
    };

    // ----------------- INTELLIGENCE CORE MAPPING (OPTIMIZED SET) -----------------

    switch (model) {
      case "GPT-OSS-20b":
        apiKey = process.env.GPT_OSS_20B || "";
        modelId = "openai/gpt-oss-20b";
        break;
      case "Mistral-Large-3-675b":
        apiKey = process.env.MISTRAL_LARGE_3_675B || "";
        modelId = "mistralai/mistral-large-3-675b-instruct-2512";
        break;
      case "GLM-5-Reasoning":
        apiKey = process.env.GLM_5 || "";
        modelId = "z-ai/glm-5";
        break;
      case "Qwen3-Coder-480b":
        apiKey = process.env.QWEN3_CODER_480B_A35B_INSTRUCT || "";
        modelId = "qwen/qwen3-coder-480b-a35b-instruct";
        break;
      case "DeepSeek-V3.2":
        apiKey = process.env.DEEPSEEK_V3_2 || "";
        modelId = "deepseek-ai/deepseek-v3.2";
        break;
      case "Stockmark-2-100b":
        apiKey = process.env.STOCKMARK_2_100B_INSTRUCT || "";
        modelId = "stockmark/stockmark-2-100b-instruct";
        break;
      default:
        apiKey = process.env.GPT_OSS_20B || "";
        modelId = "openai/gpt-oss-20b";
    }

    if (!apiKey) {
       return new Response(`0:"⚠️ Engine Access Denied: Missing Key for ${model} in Vercel Env."\n`, { headers: { "Content-Type": "text/plain" } });
    }

    // ----------------- THE DIRECT FETCH EXECUTION -----------------

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
       const errData = await response.json().catch(() => ({ error: { message: "Unknown Intelligence Failure" } }));
       return new Response(`0:"⚠️ ENGINE REJECTED (${model}): ${errData.error?.message || "Not Found/Unauthorized"}. Check your NVIDIA credits."\n`, { 
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
