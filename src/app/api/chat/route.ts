// ODIN DIRECT PROTOCOL ENGINE (PLAN B) - 100% RELIABILITY 🛡️
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages.", { status: 400 });
    }

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

    // ----------------- DIRECT ENDPOINT MAPPING -----------------

    switch (model) {
      case "DeepSeek-Chat":
        url = "https://api.deepseek.com/chat/completions";
        apiKey = process.env.DEEPSEEK_API_KEY || "";
        modelId = "deepseek-chat";
        break;
      case "Gemini-1.5-Pro":
      case "Gemini-1.5-Flash":
        const geminiModel = model === "Gemini-1.5-Pro" ? "gemini-1.5-pro" : "gemini-1.5-flash";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`;
        body = { contents: messages.map((m: any) => ({ role: m.role==='assistant'?'model':'user', parts: [{ text: m.content }] })) };
        break;
      case "Evo2-40b":
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        apiKey = process.env.NVIDIA_API_KEY || "";
        modelId = "arc/evo2-40b";
        break;
      case "Qwen-3-Super-120b":
        url = "https://integrate.api.nvidia.com/v1/chat/completions";
        apiKey = process.env.QWEN_API_KEY || "";
        modelId = "nvidia/qwen-2.5-72b-instruct";
        break;
      case "Manus-AI":
        url = "https://api.manus.ai/v1/chat/completions";
        apiKey = process.env.MANUS_API_KEY || "";
        modelId = "manus-1.6-agent";
        break;
      case "Ollama":
        url = "http://localhost:11434/v1/chat/completions";
        apiKey = "ollama";
        modelId = "llama3";
        break;
      default:
        url = "https://api.deepseek.com/chat/completions";
        apiKey = process.env.DEEPSEEK_API_KEY || "";
        modelId = "deepseek-chat";
    }

    if (!apiKey && !url.includes("googleapis")) {
       return new Response(`0:"⚠️ Engine Access Denied: Missing Key for ${model}."\n`, { headers: { "Content-Type": "text/plain" } });
    }

    // ----------------- THE DIRECT FETCH -----------------

    if (url.includes("googleapis")) {
       // Raw Google Gemini Fetch (Different Protocol)
       const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
       return new Response(res.body); // Proxies the raw Google stream correctly
    }

    // Standard OpenAI-Compatible Fetch (NVIDIA, DeepSeek, Manus, Ollama)
    body.model = modelId;
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "API_KEY": apiKey, // Legacy/Manus compatibility
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
       const errData = await response.json().catch(() => ({ error: { message: "Unknown API Error" } }));
       return new Response(`0:"⚠️ ENGINE REJECTED (${model}): ${errData.error?.message || "Not Found/Unauthorized"}. Check your dashboard status."\n`, { 
          status: 200, headers: { "Content-Type": "text/plain" } 
       });
    }

    return new Response(response.body); // Streams raw bytes to the frontend 🚀

  } catch (error: any) {
    return new Response(`0:"⚠️ CRITICAL ENGINE FAILURE: ${error.message}."\n`, { 
       status: 200, headers: { "Content-Type": "text/plain" } 
    });
  }
}
