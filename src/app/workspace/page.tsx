// @ts-nocheck
"use client";

import { 
  LogOut, Send, Code, MonitorPlay, PanelLeftClose, PanelLeft, 
  PanelRightClose, PanelRight, MessageSquare, Settings, Heart, X,
  Paperclip, Image as ImageIcon, ExternalLink, QrCode, Sparkles, Plus,
  PauseCircle, Pencil, RotateCcw
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";

// ---------------- ELEGANT STARTUP ----------------
const defaultCode = `import React from 'react';
export default function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-8 transition-all animate-in fade-in">
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[40px] p-12 text-center shadow-[0_0_80px_rgba(147,51,234,0.1)]">
        <h1 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 tracking-tighter uppercase">
          Neural Architecture V1
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          All elite AI models are online. <br/>
          Select your architect on the left and start building.
        </p>
        <div className="flex gap-4 justify-center">
           <div className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">Multi-Provider Mode</div>
           <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">Vision Logic</div>
        </div>
      </div>
    </div>
  );
}
`;

export default function Workspace() {
  const router = useRouter();
  const supabase = createClient();
  
  // UI States
  const [selectedModel, setSelectedModel] = useState("DeepSeek-Chat");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isSupportDismissed, setIsSupportDismissed] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Persistence States
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Vision / Multimodal / Interrupt State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  // 1. FETCH INITIAL STATE (HISTORY & AUTH)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login?message=unauthenticated");
      setCurrentUser(user);
      const { data: history } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false }).limit(15);
      if (history) setConversations(history);
    };
    init();
  }, []);

  // 2. LOAD CHAPTER
  const loadChat = async (id) => {
    if (!id) return;
    setIsLoading(true);
    setActiveChatId(id);
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    if (msgs) {
      setMessages(msgs.map(m => ({
        id: m.id, role: m.role, content: m.content,
        experimental_attachments: typeof m.attachments === 'string' ? JSON.parse(m.attachments) : m.attachments
      })));
    }
    setIsLoading(false);
  };

  const handleNewChat = () => { if (abortControllerRef.current) abortControllerRef.current.abort(); setActiveChatId(null); setMessages([]); setChatInput(""); setSelectedImage(null); };

  const stopGeneration = () => { if (abortControllerRef.current) { abortControllerRef.current.abort(); setIsLoading(false); } };

  const handleEditMessage = async (idx: number) => {
    const messageToEdit = messages[idx];
    if (messageToEdit.role !== 'user') return;
    setChatInput(messageToEdit.content);
    const newMessages = messages.slice(0, idx);
    setMessages(newMessages);
    if (activeChatId) { await supabase.from('messages').delete().eq('conversation_id', activeChatId).gt('created_at', messageToEdit.created_at || new Date(0).toISOString()); }
  };

  // 6. CHAT ENGINE (FIXED ORIGINAL MODELS)
  const sendMessage = async (payload: any) => {
    if (!currentUser) return;
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    let convoId = activeChatId;
    if (!convoId) {
      const { data: newConvo, error } = await supabase.from('conversations').insert([{ title: payload.content.slice(0, 30) + '...', model: selectedModel, user_id: currentUser.id }]).select().single();
      if (error) { console.error("Convo Error:", error); return; }
      convoId = newConvo.id;
      setActiveChatId(convoId);
      setConversations([newConvo, ...conversations]);
    }

    await supabase.from('messages').insert([{ conversation_id: convoId, role: 'user', content: payload.content, attachments: payload.experimental_attachments || [] }]);
    
    const newMessages = [...messages, payload];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, model: selectedModel }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("Connection failed. Check your API keys.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = ""; 
      
      const aiMessageId = Math.random().toString(36);
      setMessages(prev => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          // 1. DATA STREAM PROTOCOL (0: Prefix)
          if (trimmed.startsWith('0:')) {
            let chunk = trimmed.slice(2);
            try {
              if (chunk.startsWith('"') && chunk.endsWith('"')) { assistantContent += JSON.parse(chunk); } 
              else if (chunk.startsWith('"')) { assistantContent += chunk.slice(1); } 
              else { assistantContent += chunk; }
            } catch (e) { assistantContent += chunk.replace(/^"/, "").replace(/"$/, ""); }
          } 
          // 2. STANDARD OPENAI SSE PROTOCOL (data: {"choices":...})
          else if (trimmed.startsWith('data: ')) {
            const raw = trimmed.slice(6);
            if (raw === '[DONE]') continue;
            try {
              const parsed = JSON.parse(raw);
              const text = parsed.choices?.[0]?.delta?.content || "";
              assistantContent += text;
            } catch (e) { }
          }
          // 3. UNIVERSAL TEXT EXTRACTOR (For Gemini and Nested JSON Fragments)
          else if (trimmed.includes('"text":')) {
            // Target any JSON property named "text" or "content"
            const textMatch = trimmed.match(/"text":\s*"((?:[^"\\]|\\.)*)"/);
            if (textMatch && textMatch[1]) {
               assistantContent += textMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            }
          }
          // 4. FRAGMENT CLEANER: If nothing above matches, try to find raw strings
          else if (trimmed.length > 5 && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
             assistantContent += trimmed.replace(/^"/, "").replace(/"$/, "");
          }
          
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: assistantContent } : m));
        }
      }

      await supabase.from('messages').insert([{ conversation_id: convoId, role: 'assistant', content: assistantContent }]);
      await supabase.from('conversations').update({ updated_at: new Date() }).eq('id', convoId);

    } catch (err: any) {
      if (err.name === 'AbortError') { console.log('Aborted.'); } 
      else { setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ERROR: ${err.message}. Check your elite AI keys.` }]); }
    } finally {
      setIsLoading(false); abortControllerRef.current = null;
    }
  };

  const handleCustomSubmit = (e?: any) => {
    e?.preventDefault(); if (!(chatInput || "").trim() && !selectedImage) return;
    const msg: any = { id: Math.random().toString(36), role: 'user', content: (chatInput || "").trim() };
    if (selectedImage) msg.experimental_attachments = [{ name: 'upload.png', contentType: 'image/png', url: selectedImage }];
    sendMessage(msg); setChatInput(''); setSelectedImage(null);
  };

  const latestCode = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        const content = messages[i].content;
        const match = content.match(/```tsx\n([\s\S]*?)```/);
        if (match && match[1]) return match[1];
        if (content.includes("```tsx")) { const s = content.split("```tsx\n")[1]; if (s) return s; }
      }
    }
    return defaultCode;
  }, [messages]);

  return (
    <div className="h-screen w-full flex bg-[#09090b] text-gray-200 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <div className={`transition-all duration-300 border-r border-white/5 bg-[#0b0b0e] flex flex-col shrink-0 z-20 ${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 w-[260px] flex-1 flex flex-col overflow-hidden">
           <div className="flex items-center gap-2 mb-4 mt-2 px-2">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">ODIN</span>
              <a href="https://instagram.com/odincalm0" target="_blank" rel="noreferrer" className="text-xl">
                <motion.div animate={isLoading ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 1.5 }} className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] cursor-pointer">🫀</motion.div>
              </a>
           </div>
           <button onClick={handleNewChat} className="flex items-center gap-3 px-3 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-sm font-bold text-gray-200 mb-6 uppercase tracking-widest"><Plus className="w-4 h-4" /> New Chat</button>
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2 select-none">Recently Built</div>
              {conversations.map((convo) => (
                <button key={convo.id} onClick={() => loadChat(convo.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs text-left truncate group ${activeChatId === convo.id ? 'bg-purple-600/10 text-purple-300' : 'hover:bg-[#1a1a1f] text-gray-400'}`}>
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" /> <span className="truncate font-black uppercase">{convo.title}</span>
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* 2. CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#09090b] relative">
        <div className="h-14 px-4 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 z-20">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-gray-400"><PanelLeft className="w-5 h-5" /></button>
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em]">{isLoading ? "Architecting Architecture..." : "Engine Idle"}</div>
          <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className={`p-2 rounded-md ${isPreviewOpen ? 'bg-purple-600/10 text-purple-400' : 'text-gray-400'}`}><PanelRight className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center custom-scrollbar">
          <div className="w-full max-w-4xl flex flex-col pb-44 pt-4">
            {messages.length === 0 && (
              <div className="mt-32 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-purple-500/20 shadow-2xl"><span className="text-4xl">🫀</span></div>
                <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500 mb-2 tracking-tighter uppercase">ODIN Neural Grid</h2>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Elite Multimodal Intelligence Archive</p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={m.id || idx} className={`w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} px-6 py-5 group transition-all`}>
                <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase opacity-30 mb-1">
                     <span>{m.role === 'assistant' ? 'ENGINE CORE' : 'USER INTERFACE'}</span>
                     {m.role === 'user' && <button onClick={() => handleEditMessage(idx)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-purple-400"><Pencil className="w-3 h-3" /></button>}
                  </div>
                  <div className={`px-6 py-4 text-[15.5px] leading-relaxed ${m.role === 'user' ? 'bg-[#1c1c1f] text-gray-100 rounded-[28px] rounded-tr-[5px] border border-white/5' : 'bg-transparent text-gray-200'}`}>
                    {m.experimental_attachments?.[0] && <img src={m.experimental_attachments[0].url} className="max-w-[300px] rounded-2xl mb-4 border border-white/10" />}
                    <div className="whitespace-pre-wrap leading-[1.7]">{m.role === 'user' ? m.content : m.content.replace(/```tsx\n[\s\S]*?```/g, "✨ Building component flux... Complete. Syncing Live Preview.")}</div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="px-6 py-6 flex gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest ml-12">
                  <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{animationDelay:'0.2s'}} />
                  <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{animationDelay:'0.4s'}} />
                  Syncing Neural Grid...
               </div>
            )}
          </div>
        </div>

        {/* INPUT */}
        <div className="absolute bottom-0 left-0 w-full px-6 pb-8 pt-20 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent z-40">
          <div className="max-w-[48rem] mx-auto w-full relative">
            <div className="absolute -top-12 left-0 z-50 flex items-center gap-3">
              <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="bg-[#18181b] hover:bg-[#27272a] text-gray-200 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5 shadow-2xl transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> {selectedModel} <RotateCcw className="w-3 h-3 opacity-40" />
              </button>
              {isLoading && (
                <button onClick={stopGeneration} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-red-500/20 flex items-center gap-2"><PauseCircle className="w-4 h-4" /> Stop Build</button>
              )}
              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#18181b] border border-white/5 rounded-2xl shadow-2xl p-2 backdrop-blur-3xl">
                  {['DeepSeek-Chat', 'Gemini-1.5-Pro', 'Gemini-1.5-Flash', 'Evo2-40b', 'Qwen-3-Super-120b', 'Manus-AI', 'Ollama'].map(m => (
                    <button key={m} onClick={() => { setSelectedModel(m); setIsModelDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#27272a] text-[10px] font-black uppercase tracking-widest ${selectedModel===m ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500'}`}>{m}</button>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleCustomSubmit} className="flex flex-col bg-[#1c1c1f] rounded-[32px] p-2 focus-within:ring-2 focus-within:ring-purple-500/20 shadow-2xl border border-white/10 relative">
              {selectedImage && <div className="px-3 pt-3 relative"><div className="relative inline-block"><img src={selectedImage} className="h-16 w-16 object-cover rounded-xl border border-white/10" /><button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div></div>}
              <textarea className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-[15.5px] font-medium text-gray-100 px-4 py-4 min-h-[60px] max-h-48 leading-relaxed placeholder:uppercase placeholder:text-[10px] placeholder:font-black placeholder:tracking-widest" placeholder={isLoading ? "Neural Processing..." : "Ready for instructions..."} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleCustomSubmit())} disabled={isLoading} />
              <div className="flex items-center justify-between px-2 pb-2">
                <button type="button" onClick={()=>fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-white rounded-full transition-colors"><Paperclip className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} onChange={e=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f);}}} accept="image/*" className="hidden" />
                <button type="submit" disabled={isLoading||(!chatInput.trim()&&!selectedImage)} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${(chatInput.trim()||selectedImage)&&!isLoading?'bg-white text-black shadow-lg scale-105':'bg-white/5 text-white/20 opacity-50'}`}>
                  {isLoading?<div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"/>:<Send className="w-4 h-4 rotate-[-90deg] translate-x-[1px]"/>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 3. PREVIEW */}
      <div className={`transition-all duration-300 bg-[#09090b] border-l border-white/[0.03] shrink-0 z-20 ${isPreviewOpen ? 'w-[45%] min-w-[500px]' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="w-full h-full flex flex-col p-3 overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#141417] rounded-[36px] border border-white/[0.04] shadow-2xl overflow-hidden relative">
            <div className="h-14 border-b border-white/[0.04] flex items-center justify-between px-6 bg-[#141417]/50">
               <div className="flex bg-[#09090b] rounded-xl p-1 border border-white/5">
                  <button onClick={()=>setActiveTab("preview")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab==="preview"?"bg-[#1c1c1f] text-white shadow-lg":"text-gray-500"}`}>Live Engine</button>
                  <button onClick={()=>setActiveTab("code")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab==="code"?"bg-[#1c1c1f] text-white shadow-lg":"text-gray-500"}`}>Architecture</button>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"><div className="w-1 h-1 rounded-full bg-green-400 animate-pulse"/><span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Active Compiler</span></div>
            </div>
            <div className="flex-1 relative bg-white">
              <SandpackProvider template="react-ts" theme="dark" files={{"/App.tsx":latestCode}} customSetup={{dependencies:{"lucide-react":"latest","framer-motion":"latest"}}} options={{classes:{"sp-wrapper":"h-full w-full","sp-layout":"h-full w-full !rounded-none !border-none",}}}>
                <SandpackLayout className="h-full w-full flex !border-none">
                   <div className={`h-full w-full bg-[#141417] ${activeTab==='code'?'block':'hidden'}`}><SandpackCodeEditor showTabs={true} showLineNumbers={true} className="h-full w-full" /></div>
                   <div className={`h-full w-full relative bg-white border-none ${activeTab==='preview'?'block':'hidden'}`}><SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={true} className="h-full w-full" /></div>
                </SandpackLayout>
              </SandpackProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
