"use client";

export const dynamic = "force-dynamic";

import { 
  LogOut, Send, Code, MonitorPlay, PanelLeftClose, PanelLeft, 
  PanelRightClose, PanelRight, MessageSquare, Settings, Heart, X,
  Paperclip, Image as ImageIcon, ExternalLink, QrCode, Sparkles, Plus,
  PauseCircle, Pencil, RotateCcw, MoreVertical, Pin, Archive, Trash2,
  Terminal, Activity, Cpu, Layers, FileCode, Folder, Hash, Image
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SupportPanel } from "@/components/SupportPanel";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackLayout,
  SandpackFileExplorer
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

// --- TYPES ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  experimental_attachments?: any[];
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  updated_at: string;
}

export default function Workspace() {
  const router = useRouter();
  const supabase = createClient();
  
  // UI States
  const [selectedModel, setSelectedModel] = useState("Step-3.5-Flash");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isSupportDismissed, setIsSupportDismissed] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Persistence States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(["[SYS] Neural Grid Online.", "[SYS] Models Loaded: K2, Flash, 480B."]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFile, setActiveFile] = useState("/App.tsx");
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    "/App.tsx": defaultCode
  });

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
  const loadChat = async (id: string) => {
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
      else { setMessages(prev => [...prev, { id: Math.random().toString(36), role: "assistant", content: `⚠️ ERROR: ${err.message}. Check your elite AI keys.` }]); }
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

  // ADVANCED NEURAL MULTI-FILE EXTRACTOR
  useEffect(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (lastAssistantMessage) {
       const content = lastAssistantMessage.content;
       const fileRegex = /\[FILE: (.*?)\]\n```tsx\n([\s\S]*?)```/g;
       let match;
       const newFiles: Record<string, string> = { ...projectFiles };
       let foundAny = false;

       while ((match = fileRegex.exec(content)) !== null) {
          const fileName = match[1].startsWith('/') ? match[1] : `/${match[1]}`;
          newFiles[fileName] = match[2];
          foundAny = true;
       }

       if (!foundAny) {
          const legacyMatch = content.match(/```tsx\n([\s\S]*?)```/);
          if (legacyMatch && legacyMatch[1]) {
             newFiles["/App.tsx"] = legacyMatch[1];
             foundAny = true;
          }
       }

       if (foundAny) setProjectFiles(newFiles);
    }
  }, [messages]);

  const latestCode = projectFiles["/App.tsx"];

  return (
    <div className="h-screen w-full flex bg-[#09090b] text-gray-200 font-sans overflow-hidden">
      
      <SupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* 1. SIDEBAR */}
      <div className={`transition-all duration-300 border-r border-white/5 bg-[#0b0b0e] flex flex-col shrink-0 z-[100] ${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 w-[260px] flex-1 flex flex-col overflow-hidden relative">
           <div className="flex items-center gap-2 mb-4 mt-2 px-2">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">ODIN</span>
              <a href="https://instagram.com/odincalm0" target="_blank" rel="noreferrer" className="text-xl">
                <motion.div animate={isLoading ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 1.5 }} className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] cursor-pointer">🫀</motion.div>
              </a>
              <div className="ml-auto flex items-center gap-2">
                 <button className="p-2 text-gray-500 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
              </div>
           </div>
           
           <button onClick={handleNewChat} className="flex items-center gap-3 px-3 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 overflow-hidden active:scale-95 group relative">
              <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> New Grid</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2 select-none opacity-40 flex items-center justify-between">
                 Neural History <span>{conversations.length}</span>
              </div>
              {conversations.map((convo) => (
                <div key={convo.id} className="group relative">
                  <button 
                    onClick={() => loadChat(convo.id)} 
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-[10px] tracking-widest text-left truncate relative ${activeChatId === convo.id ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'}`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeChatId === convo.id ? 'text-purple-500 animate-pulse' : 'opacity-20'}`} /> 
                    <span className="truncate font-black uppercase">{convo.title || "Neural Stream"}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === convo.id ? null : convo.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {activeMenuId === convo.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -10 }}
                        className="absolute left-full ml-2 top-0 w-32 bg-[#1c1c1f] border border-white/10 rounded-xl shadow-2xl p-1 z-[200] backdrop-blur-3xl"
                      >
                         <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Pin className="w-3 h-3" /> Pin</button>
                         <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Archive className="w-3 h-3" /> Archive</button>
                         <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 border-t border-white/5 mt-1 pt-3"><Trash2 className="w-3 h-3" /> Delete</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
           </div>

           <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <button 
                onClick={() => setIsSupportOpen(true)}
                className="w-full py-4 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                 <Heart className="w-4 h-4 text-purple-600 fill-purple-600" /> Support Nitin
              </button>
              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] text-center pt-2 select-none group">
                 Built By <span className="group-hover:text-purple-500 transition-colors cursor-help">Nitin Kumar</span> 🫀🦾
              </div>
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
                  {['Step-3.5-Flash', 'Kimi-K2-Thinking', 'Mistral-Small-3-24b', 'GPT-OSS-20b', 'Qwen3-Coder-480b', 'DeepSeek-V3.2'].map(m => (
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
            <div className="flex-1 relative bg-white flex flex-col min-h-0">
              <SandpackProvider 
                template="react-ts" 
                theme="dark" 
                files={projectFiles}
                customSetup={{
                  dependencies: {
                    "lucide-react": "latest",
                    "framer-motion": "latest",
                    "clsx": "latest",
                    "tailwind-merge": "latest"
                  }
                }} 
                options={{
                  classes: {
                    "sp-wrapper": "h-full w-full",
                    "sp-layout": "h-full w-full !rounded-none !border-none",
                  }
                }}
              >
                <SandpackLayout className="h-full w-full flex flex-col !border-none">
                   <div className="h-10 border-b border-white/5 bg-[#0b0b0e] flex items-center px-4 gap-2 justify-between">
                      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                         {Object.keys(projectFiles).map(f => (
                           <button 
                             key={f} 
                             onClick={() => setActiveFile(f)}
                             className={`flex items-center gap-2 px-3 h-full border-b-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeFile===f ? 'border-purple-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                           >
                             <FileCode className="w-3.5 h-3.5" /> {f.replace('/','')}
                           </button>
                         ))}
                      </div>
                      <div className="flex gap-2 shrink-0">
                         <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${activeTab==='preview'?'bg-purple-500/10 text-purple-400 border border-purple-500/20':'text-gray-600'}`}>Mirror Link</div>
                      </div>
                   </div>

                   <div className="flex-1 flex min-h-0">
                      <div className={`w-48 bg-[#0b0b0e] border-r border-white/5 p-3 flex flex-col gap-1 overflow-y-auto no-scrollbar ${activeTab==='code' ? 'block' : 'hidden md:block'}`}>
                         <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 px-2">Project Root</div>
                         {Object.keys(projectFiles).map(f => (
                           <button 
                             key={f} 
                             onClick={() => setActiveFile(f)}
                             className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeFile===f ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500 hover:bg-white/5'}`}
                           >
                             {f.endsWith('.css') ? <Hash className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />} {f.replace('/','')}
                           </button>
                         ))}
                         <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest text-gray-700 hover:text-gray-400 hover:bg-white/5 border border-dashed border-white/5 mt-2">
                           <Plus className="w-3.5 h-3.5" /> New File
                         </button>
                      </div>

                      <div className={`flex-1 w-full bg-[#141417] ${activeTab==='code'?'block':'hidden'}`}><SandpackCodeEditor showTabs={false} showLineNumbers={true} className="h-full w-full" /></div>
                      <div className={`flex-1 w-full relative bg-white border-none ${activeTab==='preview'?'block':'hidden'}`}><SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={true} className="h-full w-full" /></div>
                   </div>
                   
                   {/* ⚠️ NEURAL CONSOLE (BOTTOM LOGS) */}
                   <div className="h-32 bg-black border-t border-white/5 flex flex-col relative shrink-0">
                      <div className="h-8 border-b border-white/5 flex items-center px-4 gap-4 justify-between bg-black/80 backdrop-blur-md">
                         <div className="flex gap-4">
                            <div className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-purple-400" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Neural Console</span></div>
                            <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-indigo-400" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Titan Load: OK</span></div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-green-400" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Status: Syncing</span></div>
                            <div className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-blue-400" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">V5.0.2 Agentic</span></div>
                         </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1 custom-scrollbar scroll-smooth">
                         {logs.map((l, i) => (
                           <div key={i} className="flex gap-3 text-white/40">
                              <span className="text-gray-800 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span> 
                              <span className={l.includes('[SYS]') ? 'text-indigo-400 font-bold' : 'text-white/60'}>{l}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </SandpackLayout>
              </SandpackProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
