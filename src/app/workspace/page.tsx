"use client";

export const dynamic = "force-dynamic";

import { 
  LogOut, Send, Code, MonitorPlay, PanelLeftClose, PanelLeft, 
  PanelRightClose, PanelRight, MessageSquare, Settings, Heart, X,
  Paperclip, Image as ImageIcon, ExternalLink, QrCode, Sparkles, Plus,
  PauseCircle, Pencil, RotateCcw, MoreVertical, Pin, Archive, Trash2,
  Terminal, Activity, Cpu, Layers, FileCode, Folder, Hash, Image, Save,
  FolderOpen, Maximize2, Minimize2, Play, Eraser, CheckCircle2, AlertCircle
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

// --- STARTUP CONFIG ---
const defaultCode = `import React from 'react';
export default function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[40px] p-12 text-center shadow-2xl">
        <h1 className="text-4xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 uppercase tracking-tighter">
          ODIN IDE V2.2
        </h1>
        <p className="text-gray-400 text-lg mb-8 uppercase text-[10px] font-black tracking-[0.3em]">
          High Focus Agentic Workspace
        </p>
        <div className="flex gap-4 justify-center">
           <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest">Architect 3.5</div>
           <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest">Local Sync</div>
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
  
  // UI Layout States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [isFloatingPreviewOpen, setIsFloatingPreviewOpen] = useState(false);

  // Agent States
  const [selectedModel, setSelectedModel] = useState("Step-3.5-Flash");
  const [activeFile, setActiveFile] = useState("/App.tsx");
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({ "/App.tsx": defaultCode });
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>(["[SYS] Workspace Initialized.", "[SYS] V2.2 Architecture Ready."]);

  // Chat & History States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hydration fix & Scroll
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // --- LOCAL FILE SYSTEM LOGIC ---
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
      setLogs(prev => [...prev, `[SYS] Folder Synced: ${handle.name}`]);
    } catch (err: any) { console.error("Folder Access Rejected."); }
  };

  const saveToLocal = async (fileName: string, content: string) => {
    if (!directoryHandle) return;
    try {
      const name = fileName.replace('/', '');
      const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      setLogs(prev => [...prev, `[SYS] Syncing File: ${name}`]);
    } catch (err: any) { setLogs(prev => [...prev, `[ERR] Sync Error: ${fileName}`]); }
  };

  // --- CHAT ENGINE V2.2 ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setCurrentUser(user);
      const { data: history } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false }).limit(20);
      if (history) setConversations(history);
    };
    init();
  }, [supabase, router]);

  const loadChat = async (id: string) => {
    setIsLoading(true);
    setActiveChatId(id);
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    if (msgs) setMessages(msgs.map(m => ({
        id: m.id, role: m.role, content: m.content,
        experimental_attachments: typeof m.attachments === 'string' ? JSON.parse(m.attachments) : m.attachments
    })));
    setIsLoading(false);
  };

  const handleNewChat = () => { setActiveChatId(null); setMessages([]); setChatInput(""); };

  const sendMessage = async (payload: any) => {
    if (!currentUser) return;
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    let convoId = activeChatId;

    if (!convoId) {
      const { data: newConvo } = await supabase.from('conversations').insert([{ 
        title: payload.content.slice(0, 30), 
        model: selectedModel, 
        user_id: currentUser.id 
      }]).select().single();
      convoId = newConvo.id; setActiveChatId(convoId); setConversations([newConvo, ...conversations]);
    }

    await supabase.from('messages').insert([{ conversation_id: convoId, role: 'user', content: payload.content, attachments: payload.experimental_attachments || [] }]);
    setMessages(prev => [...prev, payload]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, payload], model: selectedModel }),
        signal: abortControllerRef.current.signal
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const aiMessageId = Math.random().toString(36);
      setMessages(prev => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
           if (line.trim().startsWith('0:')) {
              try {
                const text = JSON.parse(line.trim().slice(2));
                assistantContent += text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: assistantContent } : m));
              } catch (e) { assistantContent += line.trim().slice(2).replace(/^"/,'').replace(/"$/,''); }
           }
        }
      }
      await supabase.from('messages').insert([{ conversation_id: convoId, role: 'assistant', content: assistantContent }]);
    } catch (err: any) { 
        if (err.name !== 'AbortError') setLogs(prev => [...prev, `[ERR] AI Build Error.`]);
    } finally { setIsLoading(false); }
  };

  const handleCustomSubmit = (e?: any) => {
    e?.preventDefault(); if (!chatInput.trim() && !selectedImage) return;
    const msg: any = { id: Math.random().toString(36), role: 'user', content: chatInput.trim() };
    if (selectedImage) msg.experimental_attachments = [{ name: 'upload.png', contentType: 'image/png', url: selectedImage }];
    sendMessage(msg); setChatInput(''); setSelectedImage(null);
  };

  // MULTI-FILE ARCHITECT ENGINE
  useEffect(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (lastAssistantMessage) {
       const content = lastAssistantMessage.content;
       const fileRegex = /\[FILE: (.*?)\]\n```tsx\n([\s\S]*?)```/g;
       let match;
       const newFiles = { ...projectFiles };
       let found = false;
       while ((match = fileRegex.exec(content)) !== null) {
          const fileName = match[1].startsWith('/') ? match[1] : `/${match[1]}`;
          if (newFiles[fileName] !== match[2]) { newFiles[fileName] = match[2]; found = true; }
       }
       if (!found) {
         const legacy = content.match(/```tsx\n([\s\S]*?)```/);
         if (legacy && newFiles["/App.tsx"] !== legacy[1]) { newFiles["/App.tsx"] = legacy[1]; found = true; }
       }
       if (found) {
          setProjectFiles(newFiles);
          if (directoryHandle) Object.entries(newFiles).forEach(([n, c]) => saveToLocal(n, c));
       }
    }
  }, [messages, directoryHandle]);

  if (!isMounted) return null;

  return (
    <div className="h-screen w-full flex bg-[#09090b] text-white font-sans overflow-hidden">
      <SupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* 1. LEFT COLUMN: EXPLORER & HISTORY */}
      <AnimatePresence>
        {isLeftSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-white/5 bg-[#0b0b0d] flex flex-col shrink-0"
          >
            <div className="p-4 flex-1 flex flex-col min-h-0">
               <div className="flex items-center justify-between mb-8 px-2">
                  <span className="text-xl font-black tracking-tighter uppercase italic">Odin</span>
                  <div className="flex gap-1">
                     <button onClick={handleOpenFolder} className="p-2 text-gray-500 hover:text-white transition-all"><FolderOpen className="w-4 h-4" /></button>
                     <button onClick={handleNewChat} className="p-2 text-gray-500 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                  </div>
               </div>

               {/* EXPLORER PANE */}
               <div className="mb-8">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 px-2">Project Root</div>
                  <div className="space-y-1">
                     {Object.keys(projectFiles).map(f => (
                       <button 
                        key={f} onClick={() => setActiveFile(f)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${activeFile === f ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                       >
                         <FileCode className="w-4 h-4 opacity-40 shrink-0" /> <span className="truncate">{f.replace('/','')}</span>
                       </button>
                     ))}
                  </div>
               </div>

               {/* HISTORY PANE */}
               <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 px-2">History</div>
                  <div className="space-y-1">
                     {conversations.map(c => (
                       <button 
                        key={c.id} onClick={() => loadChat(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold text-left transition-all ${activeChatId === c.id ? 'bg-white/5 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                       >
                         <MessageSquare className="w-4 h-4 opacity-40 shrink-0" /> <span className="truncate">{c.title}</span>
                       </button>
                     ))}
                  </div>
               </div>
            </div>
            {/* SUPPORT FOOTER */}
            <div className="p-4 border-t border-white/5">
                <button onClick={() => setIsSupportOpen(true)} className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mb-2">
                   <Heart className="w-3.5 h-3.5 fill-black" /> Support 
                </button>
                <div className="text-[8px] font-black text-white/10 uppercase tracking-widest text-center">Built by Nitin Kumar</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MIDDLE COLUMN: ARCHITECT EDITOR */}
      <div className="flex-1 flex flex-col min-w-0 relative">
         {/* EDITOR HEADER */}
         <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <button onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} className="p-2 text-gray-500 hover:text-white transition-all"><PanelLeft className="w-5 h-5" /></button>
               <div className="flex items-center gap-2 ml-2">
                  <FileCode className="w-4 h-4 text-purple-500" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-white/40">{activeFile.replace('/','')}</span>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsFloatingPreviewOpen(!isFloatingPreviewOpen)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${isFloatingPreviewOpen ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
               >
                  <Play className={`w-3.5 h-3.5 ${isFloatingPreviewOpen ? 'fill-white':'fill-none'}`} /> {isFloatingPreviewOpen ? "Active Preview" : "Mirror Engine"}
               </button>
               <button onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} className="p-2 text-gray-500 hover:text-white transition-all"><PanelRight className="w-5 h-5" /></button>
            </div>
         </div>

         {/* PULSING PROGRESS HUD */}
         <AnimatePresence>
            {isLoading && (
               <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="h-1 w-full bg-purple-500/20 relative overflow-hidden">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent w-1/2" />
               </motion.div>
            )}
         </AnimatePresence>

         {/* MAIN EDITOR SPACE */}
         <div className="flex-1 relative overflow-hidden bg-[#0b0b0d]">
           <SandpackProvider 
            template="react-ts" theme="dark" files={projectFiles} 
            customSetup={{ dependencies: { "lucide-react": "latest", "framer-motion": "latest", "clsx": "latest", "tailwind-merge": "latest" }}}
           >
              <SandpackLayout className="h-full w-full !border-none !rounded-none">
                 <SandpackCodeEditor showTabs={false} showLineNumbers={true} className="h-full w-full !font-mono text-[14px]" />
              </SandpackLayout>
           </SandpackProvider>
         </div>

         {/* TERMINAL STATUS BAR */}
         <div className="h-40 border-t border-white/5 bg-[#070709] flex flex-col p-4">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
               <div className="flex gap-6 items-center">
                  <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest"><Terminal className="w-3.5 h-3.5" /> Neural Terminal</div>
                  {directoryHandle && <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest"><CheckCircle2 className="w-3.5 h-3.5" /> Hardware Linked</div>}
               </div>
               <button onClick={() => setLogs([])} className="p-1.5 text-gray-700 hover:text-white"><Eraser className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[11px] space-y-1">
               {logs.map((l, i) => (
                 <div key={i} className="flex gap-4">
                    <span className="text-white/10 shrink-0">0{i+1}</span>
                    <span className={l.includes('[SYS]') ? 'text-indigo-400' : 'text-white/40'}>{l}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* 3. RIGHT COLUMN: AGENT SIDEBAR (CHAT) */}
      <AnimatePresence>
        {isRightSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }} animate={{ width: 420, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-white/5 bg-[#0b0b0d] flex flex-col shrink-0"
          >
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
               <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">Agent Intelligence</span>
               </div>
               <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  {selectedModel} <RotateCcw className="w-3 h-3 opacity-20" />
               </button>
               {isModelDropdownOpen && (
                  <div className="absolute top-14 right-6 w-52 bg-[#1c1c1f] border border-white/10 rounded-2xl shadow-3xl p-2 z-[200]">
                    {[
                      { name: 'Step-3.5-Flash', vision: true },
                      { name: 'Kimi-K2-Thinking', vision: true },
                      { name: 'Mistral-Small-3-24b', vision: false },
                      { name: 'Qwen3-Coder-480b', vision: false },
                      { name: 'DeepSeek-V3.2', vision: true }
                    ].map(m => (
                      <button key={m.name} onClick={() => { setSelectedModel(m.name); setIsModelDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-between ${selectedModel===m.name ? 'text-purple-400 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}>
                        {m.name}
                        {m.vision && <div className="flex items-center gap-1 opacity-40"><span className="text-[10px]">👁️</span></div>}
                      </button>
                    ))}
                  </div>
               )}
            </div>

            {/* MESSAGE STREAM */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <Sparkles className="w-12 h-12 mb-4" />
                    <div className="text-[11px] font-black uppercase tracking-[0.5em]">Initiate Architecture</div>
                 </div>
               )}
               {messages.map((m, idx) => (
                 <div key={m.id || idx} className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-20">{m.role === 'assistant' ? 'Odin Agent' : 'Architect'}</div>
                    <div className={`max-w-[90%] px-5 py-4 rounded-[24px] text-[14px] leading-relaxed ${m.role === 'user' ? 'bg-white/5 text-gray-200 rounded-tr-lg' : 'bg-transparent text-gray-300 border border-white/5'}`}>
                       {m.experimental_attachments?.[0] && <img src={m.experimental_attachments[0].url} className="w-full rounded-xl mb-4" />}
                       <div className="whitespace-pre-wrap">{m.role === 'user' ? m.content : m.content.replace(/```tsx\n[\s\S]*?```/g, "✨ Building Source Modules...")}</div>
                    </div>
                 </div>
               ))}
               <div ref={messagesEndRef} />
            </div>

            {/* FLOATING INPUT AT BOTTOM OF SIDEBAR */}
            <div className="p-6 pt-0">
               <form onSubmit={handleCustomSubmit} className="bg-white/5 border border-white/10 rounded-[28px] p-2 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all flex flex-col group">
                  {selectedImage && <div className="px-3 pt-3 relative"><img src={selectedImage} className="h-12 w-12 object-cover rounded-lg" /><button type="button" onClick={()=>setSelectedImage(null)} className="absolute top-1 left-11 bg-red-500 rounded-full p-1"><X className="w-3 h-3"/></button></div>}
                  <textarea 
                    className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none px-4 py-3 text-[14px] min-h-[60px] max-h-48 scrollbar-hide font-medium placeholder:text-white/10"
                    placeholder="Describe your design..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleCustomSubmit())} disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-2 pb-1">
                     <button type="button" onClick={()=>fileInputRef.current?.click()} className="p-2.5 text-white/20 hover:text-white transition-all"><Paperclip className="w-4 h-4"/></button>
                     <button type="submit" disabled={isLoading||(!chatInput.trim()&&!selectedImage)} className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${(!chatInput.trim()&&!selectedImage)?'bg-white/5 text-white/10':'bg-white text-black shadow-xl ring-4 ring-white/10'}`}>
                        {isLoading ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <Send className="w-3.5 h-3.5 rotate-[-90deg] translate-x-px"/>}
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODULAR FLOATING PREVIEW ENGINE */}
      <AnimatePresence>
        {isFloatingPreviewOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="fixed top-14 bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] z-[500] pointer-events-auto">
             <div className="w-full h-full bg-[#141416]/95 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-10">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Mirror Engine</span>
                   </div>
                   <button onClick={() => setIsFloatingPreviewOpen(false)} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-all"><X className="w-5 h-5"/></button>
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
