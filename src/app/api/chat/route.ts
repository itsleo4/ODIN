// ODIN NEURAL GRID (DIRECT PROTOCOL V3.6 - PRECISE ARCHITECTURAL SYNC) 🛡️🫀🦾
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages.", { status: 400 });
    }

    console.log(`[ODIN] Architecting with Elite ID: ${model}`);

    let url = ""; 
    let apiKey = "";
    let modelId = "";
    let body: any = {
      messages: [
        { role: "system", content: "You are ODIN, an elite AI developer. Code ONLY in Markdown TSX blocks. Export 'App' as default. Use Tailwind." },
        ...messages
      ],
      stream: true,
      temperature: 0.1
    };

    // ----------------- INTELLIGENCE CORE SYNC (PRECISE MATCH V3.6) -----------------

    switch (model) {
      case "Stockmark-2-100b":
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        // REMOVED _API_KEY SUFFIX TO MATCH .ENV
        apiKey = process.env.STOCKMARK_2_100B_INSTRUCT || "";
        modelId = "stockmark/stockmark-2-100b-instruct";
        break;
      case "GPT-OSS-120b":
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        // REMOVED _API_KEY SUFFIX TO MATCH .ENV
        apiKey = process.env.GPT_OSS_120B || "";
        modelId = "openai/gpt-oss-120b";
        break;
      case "DeepSeek-V3.2":
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        // REMOVED _API_KEY SUFFIX TO MATCH .ENV
        apiKey = process.env.DEEPSEEK_V3_2 || "";
        modelId = "deepseek-ai/deepseek-v3.2";
        break;
      case "Qwen3-Coder-480b":
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        // REMOVED _API_KEY SUFFIX TO MATCH .ENV
        apiKey = process.env.QWEN3_CODER_480B_A35B_INSTRUCT || "";
        modelId = "qwen/qwen3-coder-480b-a35b-instruct";
        break;
      case "Gemini-1.5-Pro":
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`;
        body = { contents: messages.map((m: any) => ({ role: m.role==='assistant'?'model':'user', parts: [{ text: m.content }] })) };
        break;
      case "Manus-AI":
        url = "https://api.manus.ai/v1/chat/completions";
        apiKey = process.env.MANUS_API_KEY || "";
        modelId = "manus-1.6-agent";
        break;
      case "DeepSeek-Official":
        url = "https://api.deepseek.com/chat/completions";
        apiKey = process.env.DEEPSEEK_API_KEY || "";
        modelId = "deepseek-chat";
        break;
      case "Ollama":
        url = "http://localhost:11434/v1/chat/completions";
        apiKey = "ollama";
        modelId = "llama3";
        break;
      default:
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        apiKey = process.env.GPT_OSS_120B || "";
        modelId = "openai/gpt-oss-120b";
    }

    if (!apiKey && !url.includes("googleapis")) {
       return new Response(`0:"⚠️ Engine Access Denied: Missing Key for ${model} in ODIN Backend."\n`, { headers: { "Content-Type": "text/plain" } });
    }

    // ----------------- THE DIRECT FETCH EXECUTION -----------------

    if (url.includes("googleapis")) {
       const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
       return new Response(res.body); 
    }

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
       return new Response(`0:"⚠️ ENGINE REJECTED (${model}): ${errData.error?.message || "Not Found/Unauthorized"}. Ensure your NVIDIA/DeepSeek credits are active."\n`, { 
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
