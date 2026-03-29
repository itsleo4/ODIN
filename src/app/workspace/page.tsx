"use client";

export const dynamic = "force-dynamic";

import { 
  LogOut, Send, Code, MonitorPlay, PanelLeftClose, PanelLeft, 
  PanelRightClose, PanelRight, MessageSquare, Settings, Heart, X,
  Paperclip, Image as ImageIcon, ExternalLink, QrCode, Sparkles, Plus,
  PauseCircle, Pencil, RotateCcw, MoreVertical, Pin, Archive, Trash2,
  Terminal, Activity, Cpu, Layers, FileCode, Folder, Hash, Image, Save,
  FolderOpen, Maximize2, Minimize2, Play, Eraser
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
} from "@codesandbox/sandpack-react";

// ---------------- ELEGANT STARTUP ----------------
const defaultCode = `import React from 'react';
export default function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-8 transition-all animate-in fade-in">
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[40px] p-12 text-center shadow-[0_0_80px_rgba(147,51,234,0.1)]">
        <h1 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 tracking-tighter uppercase">
          ODIN Architecture V2.1
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          Local Folder Sync is Active. <br/>
          Select your local project and start building directly on your machine.
        </p>
        <div className="flex gap-4 justify-center">
           <div className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">Agentic Sync</div>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Agent / Code States
  const [activeFile, setActiveFile] = useState("/App.tsx");
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    "/App.tsx": defaultCode
  });
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [isFloatingPreviewOpen, setIsFloatingPreviewOpen] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [logs, setLogs] = useState<string[]>(["[SYS] Neural Grid Online.", "[SYS] V2.1 Agent Active."]);

  // Persistence States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Vision / Interrupt State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  // Hydration fix
  useEffect(() => { setIsMounted(true); }, []);

  // --- LOCAL FILE SYSTEM AGENT LOGIC ---
  const handleOpenFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      const files: Record<string, string> = { ...projectFiles };
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
           const file = await entry.getFile();
           const content = await file.text();
           files[`/${entry.name}`] = content;
        }
      }
      setProjectFiles(files);
      setLogs(prev => [...prev, `[SYS] Synced with local folder: ${handle.name}`]);
    } catch (err: any) { console.error("Folder Error:", err); }
  };

  const saveToLocal = async (fileName: string, content: string) => {
    if (!directoryHandle) return;
    try {
      const name = fileName.replace('/', '');
      const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      setLogs(prev => [...prev, `[SYS] Agent Auto-Saved: ${name}`]);
    } catch (err: any) { setLogs(prev => [...prev, `[ERR] Failed to save ${fileName}`]); }
  };

  // 1. FETCH INITIAL STATE
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login?message=unauthenticated");
      setCurrentUser(user);
      const { data: history } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false }).limit(15);
      if (history) setConversations(history);
    };
    init();
  }, [supabase, router]);

  // 2. LOAD CHAT
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
  };

  const sendMessage = async (payload: any) => {
    if (!currentUser) return;
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    let convoId = activeChatId;
    if (!convoId) {
      const { data: newConvo, error } = await supabase.from('conversations').insert([{ title: payload.content.slice(0, 30) + '...', model: selectedModel, user_id: currentUser.id }]).select().single();
      if (error) return;
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
      if (!response.ok) throw new Error("Connection failed.");
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
          if (trimmed.startsWith('0:')) {
            let chunk = trimmed.slice(2);
            try { 
                if (chunk.startsWith('"')) { assistantContent += JSON.parse(chunk); } 
                else { assistantContent += chunk; }
            } catch (e) { assistantContent += chunk.replace(/^"/, "").replace(/"$/, ""); }
          } 
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: assistantContent } : m));
        }
      }
      await supabase.from('messages').insert([{ conversation_id: convoId, role: 'assistant', content: assistantContent }]);
    } catch (err: any) {
      if (err.name !== 'AbortError') setMessages(prev => [...prev, { id: Math.random().toString(36), role: "assistant", content: `⚠️ ERROR: ${err.message}` }]);
    } finally { setIsLoading(false); abortControllerRef.current = null; }
  };

  const handleCustomSubmit = (e?: any) => {
    e?.preventDefault(); if (!(chatInput || "").trim() && !selectedImage) return;
    const msg: any = { id: Math.random().toString(36), role: 'user', content: (chatInput || "").trim() };
    if (selectedImage) msg.experimental_attachments = [{ name: 'upload.png', contentType: 'image/png', url: selectedImage }];
    sendMessage(msg); setChatInput(''); setSelectedImage(null);
  };

  // MULTI-FILE EXTRACTOR
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
          if (legacyMatch && legacyMatch[1]) { newFiles["/App.tsx"] = legacyMatch[1]; foundAny = true; }
       }
       if (foundAny) {
          setProjectFiles(newFiles);
          if (directoryHandle) {
             Object.entries(newFiles).forEach(([name, code]) => {
                if (projectFiles[name] !== code) saveToLocal(name, code);
             });
          }
       }
    }
  }, [messages, directoryHandle]);

  if (!isMounted) return null;

  return (
    <div className="h-screen w-full flex bg-[#09090b] text-gray-200 font-sans overflow-hidden">
      <SupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* 1. SIDEBAR */}
      <div className={`transition-all duration-300 border-r border-white/5 bg-[#0b0b0e] flex flex-col shrink-0 z-[100] ${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 w-[260px] flex-1 flex flex-col overflow-hidden relative">
           <div className="flex items-center gap-2 mb-4 mt-2 px-2">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">ODIN</span>
              <a href="https://instagram.com/odincalm0" target="_blank" rel="noreferrer" className="text-xl">🫀</a>
           </div>
           <button onClick={handleNewChat} className="flex items-center gap-3 px-3 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 group relative">
              <Plus className="w-4 h-4" /> New Grid
           </button>
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-2 opacity-40">Neural History</div>
              {conversations.map((convo) => (
                <button key={convo.id} onClick={() => loadChat(convo.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-[10px] tracking-widest text-left truncate ${activeChatId === convo.id ? 'bg-purple-600/10 text-purple-400' : 'hover:bg-white/5 text-gray-500'}`}>
                   <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-20" /> 
                   <span className="truncate font-black uppercase text-[9px]">{convo.title || "Neural Stream"}</span>
                </button>
              ))}
           </div>
           <div className="mt-4 pt-4 border-t border-white/5">
              <button onClick={() => setIsSupportOpen(true)} className="w-full py-4 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Support Nitin</button>
           </div>
        </div>
      </div>

      {/* 2. NEURAL AGENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-all"><PanelLeft className="w-5 h-5" /></button>
            <div className="h-4 w-px bg-white/5" />
            <button onClick={handleOpenFolder} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all ${directoryHandle ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/5 border-white/5 text-gray-500'}`}>
               <FolderOpen className="w-4 h-4" /> {directoryHandle ? directoryHandle.name : "Sync Local Folder"}
            </button>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsFloatingPreviewOpen(!isFloatingPreviewOpen)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl ${isFloatingPreviewOpen ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                <Play className={`w-4 h-4 ${isFloatingPreviewOpen ? 'fill-white' : ''}`} /> {isFloatingPreviewOpen ? "Engaged" : "Launch Engine"}
             </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 relative z-10 bg-[#09090b]">
          <SandpackProvider template="react-ts" theme="dark" files={projectFiles} customSetup={{dependencies: { "lucide-react": "latest", "framer-motion": "latest", "clsx": "latest", "tailwind-merge": "latest" }}}>
            <SandpackLayout className="h-full w-full !border-none !rounded-none flex overflow-hidden">
               <div className="w-56 border-r border-white/5 bg-[#0b0b0e] flex flex-col p-4 shrink-0 overflow-hidden">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">Structure</div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                     {Object.keys(projectFiles).map(f => (
                       <button key={f} onClick={() => setActiveFile(f)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${activeFile===f ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500 hover:bg-white/5'}`}>
                         {f.endsWith('.css') ? <Hash className="w-3.5 h-3.5 opacity-30" /> : <FileCode className="w-3.5 h-3.5 opacity-30" />} 
                         <span className="truncate">{f.replace('/','')}</span>
                       </button>
                     ))}
                  </div>
               </div>
               <div className="flex-1 min-w-0 flex flex-col relative bg-[#0b0b0e]">
                  <div className="h-10 border-b border-white/5 flex items-center px-6 bg-black/40 backdrop-blur-md">
                     <FileCode className="w-3.5 h-3.5 text-purple-500" />
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{activeFile.replace('/','')}</span>
                  </div>
                  <SandpackCodeEditor showTabs={false} showLineNumbers={true} className="h-full w-full !font-mono text-[13px]" />
               </div>
            </SandpackLayout>
          </SandpackProvider>
        </div>

        {/* ⚠️ NEURAL CONSOLE */}
        <div className="h-44 bg-[#070709] border-t border-white/5 flex flex-col relative shrink-0 z-20">
          <div className="h-9 border-b border-white/5 flex items-center px-6 gap-6 justify-between bg-black/80 backdrop-blur-2xl">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[9px] text-gray-500"><Terminal className="w-3.5 h-3.5 text-purple-500" /> Neural Terminal</div>
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[9px] text-gray-500"><Cpu className="w-3.5 h-3.5" /> Active</div>
              </div>
              <button onClick={() => setLogs([])} className="p-1.5 text-gray-700 hover:text-white transition-all"><Eraser className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 px-6 font-mono text-[10px] space-y-1.5 custom-scrollbar scroll-smooth">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-4 group transition-all">
                  <span className="text-gray-800 shrink-0 opacity-40">0{i+1}</span>
                  <span className={l.includes('[SYS]') ? 'text-indigo-400 font-bold' : l.includes('[ERR]') ? 'text-red-400' : 'text-white/60'}>{l}</span>
                </div>
               ))}
          </div>
        </div>

        {/* FLOATING ARCHITECT */}
        <div className="absolute bottom-52 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-[60]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="absolute -top-12 left-0 flex items-center gap-2 pointer-events-auto">
              <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="bg-[#18181b]/95 backdrop-blur-2xl text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 shadow-3xl">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> {selectedModel}
              </button>
              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-52 bg-[#0b0b0e] border border-white/10 rounded-2xl shadow-3xl p-2 z-[100]">
                  {['Step-3.5-Flash', 'Kimi-K2-Thinking', 'Mistral-Small-3-24b', 'GPT-OSS-20b', 'Qwen3-Coder-480b', 'DeepSeek-V3.2'].map(m => (
                    <button key={m} onClick={() => { setSelectedModel(m); setIsModelDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${selectedModel===m ? 'text-purple-400' : 'text-gray-500'}`}>{m}</button>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleCustomSubmit} className="flex flex-col bg-[#0b0b0e]/95 backdrop-blur-3xl rounded-[32px] p-2 focus-within:ring-2 focus-within:ring-purple-500/20 shadow-2xl border border-white/10 relative">
              {selectedImage && <div className="px-4 pt-4 relative inline-block"><img src={selectedImage} className="h-14 w-14 object-cover rounded-xl border border-white/10" /><button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5"><X className="w-3.5 h-3.5" /></button></div>}
              <div className="flex items-center">
                <button type="button" onClick={()=>fileInputRef.current?.click()} className="p-4 text-gray-500 hover:text-purple-400 transition-all"><Paperclip className="w-5 h-5" /></button>
                <textarea className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none text-[15px] font-medium text-gray-100 px-2 py-5 h-[64px] max-h-48 whitespace-pre-wrap placeholder:text-white/10" placeholder={isLoading ? "Neuralgrid Processing..." : "Instruct the Architect..."} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleCustomSubmit())} disabled={isLoading} />
                <button type="submit" disabled={isLoading||(!chatInput.trim()&&!selectedImage)} className={`w-12 h-12 flex items-center justify-center rounded-[20px] transition-all duration-500 ${(chatInput.trim()||selectedImage)&&!isLoading?'bg-white text-black scale-110':'bg-white/5 text-white/10 opacity-40'}`}>
                  {isLoading?<div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"/>:<Send className="w-5 h-5 rotate-[-90deg] translate-x-[2px]"/>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 3. NEURAL FLOATING PREVIEW */}
      <AnimatePresence>
        {isFloatingPreviewOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 100 }} className={`fixed z-[300] transition-all duration-700 ${isPreviewMaximized ? 'inset-6' : 'bottom-12 right-12 w-[650px] h-[550px]'}`}>
             <div className="w-full h-full bg-[#141417]/90 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-10 bg-black/40">
                   <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Neural Live Engine</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setIsPreviewMaximized(!isPreviewMaximized)} className="text-gray-500 hover:text-white transition-all">{isPreviewMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}</button>
                      <button onClick={() => setIsFloatingPreviewOpen(false)} className="bg-red-600 text-white rounded-full p-2.5 transition-all"><X className="w-5 h-5" /></button>
                   </div>
                </div>
                <div className="flex-1 bg-white relative">
                   <SandpackProvider template="react-ts" theme="dark" files={projectFiles}>
                      <SandpackLayout className="h-full w-full !border-none !rounded-none">
                         <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={true} className="h-full w-full" />
                      </SandpackLayout>
                   </SandpackProvider>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={e=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f);}}} accept="image/*" className="hidden" />
    </div>
  );
}
