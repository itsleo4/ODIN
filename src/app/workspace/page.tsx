"use client";

export const dynamic = "force-dynamic";

import { 
  LogOut, Send, Code, MonitorPlay, PanelLeftClose, PanelLeft, 
  PanelRightClose, PanelRight, MessageSquare, Settings, Heart, X,
  Paperclip, Image as ImageIcon, ExternalLink, QrCode, Sparkles, Plus,
  PauseCircle, Pencil, RotateCcw, MoreVertical, Pin, Archive, Trash2,
  Terminal, Activity, Cpu, Layers, FileCode, Folder, Hash, Image, Save,
  FolderOpen, Maximize2, Minimize2, Play, Eraser, CheckCircle2, AlertCircle,
  Search, GitBranch, Globe, ChevronRight, ChevronDown, Check, MoreHorizontal,
  Cloud, Zap, Home, Key, Smartphone, Monitor, ShieldCheck, Lock
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
const defaultCode = `import React from 'react';\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-8 text-center">\n      <h1 className="text-4xl font-black mb-6 italic uppercase tracking-tighter">Odin Forge V2.12</h1>\n      <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.4em]">Pure Singularity Mode Active</p>\n      <p className="text-purple-500/60 uppercase text-[9px] font-black tracking-[0.2em] mt-4">Stored Locally 🛡️</p>\n    </div>\n  );\n}\n`;

// ODIN V2.12: PURE BYOK MODE (SYSTEM MODELS REMOVED) 🗑️
const MODEL_GROUPS: any[] = []; 

// --- TYPES ---
interface Message { id: string; role: 'user' | 'assistant'; content: string; experimental_attachments?: any[]; created_at?: string; }
interface Conversation { id: string; title: string; model: string; updated_at: string; is_pinned?: boolean; is_archived?: boolean; }
interface CustomKey { id: string; name: string; key: string; provider: string; modelId: string; }

export default function Workspace() {
  const router = useRouter();
  const supabase = createClient();
  
  // UI Layout States
  const [viewMode, setViewMode] = useState<"explorer" | "search" | "support" | "config">("explorer");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"dark" | "midnight" | "light">("dark");
  const [showArchived, setShowArchived] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Key Forge State
  const [customKeys, setCustomKeys] = useState<CustomKey[]>([]);
  const [newKey, setNewKey] = useState({ name: "", key: "", provider: "nvidia", modelId: "" });

  // Agent States
  const [selectedModel, setSelectedModel] = useState("");
  const [activeFileId, setActiveFileId] = useState("/App.tsx");
  const [openFiles, setOpenFiles] = useState<string[]>(["/App.tsx"]);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({ "/App.tsx": defaultCode });
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>(["[SYS] Singularity V2.12 Pure Engine Active.", "[SYS] Privacy Logic: Stored Locally."]);

  // Chat States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setIsMounted(true); 
    const savedTheme = localStorage.getItem("odin-theme") as any;
    if (savedTheme) setActiveTheme(savedTheme);
    const savedKeys = localStorage.getItem("odin-custom-keys");
    if (savedKeys) {
       const keys = JSON.parse(savedKeys);
       setCustomKeys(keys);
       if (keys.length > 0 && !selectedModel) setSelectedModel(keys[0].id);
    }

    const checkMobile = () => {
       const isMob = window.innerWidth < 1024;
       setIsMobile(isMob);
       if (isMob) { setIsSidebarOpen(false); setIsRightSidebarOpen(true); }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  useEffect(() => { localStorage.setItem("odin-theme", activeTheme); }, [activeTheme]);
  useEffect(() => { localStorage.setItem("odin-custom-keys", JSON.stringify(customKeys)); }, [customKeys]);
  
  // MOBILE MASTERY: SCROLL SNAP 📱
  useEffect(() => { 
     if (chatScrollContainerRef.current) {
        chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
     }
  }, [messages, isLoading]);

  const handleAddKey = () => {
    if (!newKey.name || !newKey.key) return;
    const keyObj: CustomKey = { ...newKey, id: Math.random().toString(36), modelId: newKey.modelId || "openai:gpt-4o" };
    setCustomKeys([...customKeys, keyObj]);
    if (!selectedModel) setSelectedModel(keyObj.id);
    setNewKey({ name: "", key: "", provider: "nvidia", modelId: "" });
  };

  const removeKey = (id: string) => {
     const updated = customKeys.filter(k => k.id !== id);
     setCustomKeys(updated);
     if (selectedModel === id) setSelectedModel(updated[0]?.id || "");
  };

  // --- CONVERSATION LIFECYCLE ---
  const fetchConversations = async () => {
    const { data } = await supabase.from("conversations").select("*").order("is_pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (data) setConversations(data);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const handleChatAction = async (id: string, action: "pin" | "archive" | "delete" | "rename") => {
    if (action === "delete") {
      if (confirm("Permanently purge this neural stream?")) {
        await supabase.from("messages").delete().eq("conversation_id", id);
        await supabase.from("conversations").delete().eq("id", id);
        if (activeChatId === id) { setActiveChatId(null); setMessages([]); }
      }
    } else if (action === "pin") {
      const convo = conversations.find(c => c.id === id);
      if (convo) await supabase.from("conversations").update({ is_pinned: !convo.is_pinned }).eq("id", id);
    } else if (action === "archive") {
      const convo = conversations.find(c => c.id === id);
      if (convo) await supabase.from("conversations").update({ is_archived: !convo.is_archived }).eq("id", id);
    } else if (action === "rename") {
      const newTitle = prompt("Enter new title:");
      if (newTitle) await supabase.from("conversations").update({ title: newTitle }).eq("id", id);
    }
    await fetchConversations(); 
    setActiveMenuId(null);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setCurrentUser(user);
      fetchConversations();
    };
    init();
  }, [supabase, router]);

  const loadChat = async (id: string) => {
    setIsLoading(true); setActiveChatId(id);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
    if (msgs) setMessages(msgs.map(m => ({ id: m.id, role: m.role, content: m.content, experimental_attachments: typeof m.attachments === "string" ? JSON.parse(m.attachments) : m.attachments })));
    setIsLoading(false);
  };

  const sendMessage = async (payload: any) => {
    if (!currentUser || !selectedModel) return;
    setIsLoading(true); abortControllerRef.current = new AbortController();
    let convoId = activeChatId;

    if (!convoId) {
      const { data: newConvo } = await supabase.from("conversations").insert([{ title: payload.content.slice(0, 30), model: selectedModel, user_id: currentUser.id }]).select().single();
      convoId = newConvo.id; setActiveChatId(convoId); fetchConversations();
    }

    await supabase.from("messages").insert([{ conversation_id: convoId, role: "user", content: payload.content, attachments: payload.experimental_attachments || [] }]);
    setMessages(prev => [...prev, payload]);

    const customKeyObj = customKeys.find(k => k.id === selectedModel);
    const headers: any = { "Content-Type": "application/json" };
    if (customKeyObj) {
       headers["x-custom-key"] = customKeyObj.key;
       headers["x-custom-provider"] = customKeyObj.provider;
       headers["x-custom-model"] = customKeyObj.modelId;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers,
        body: JSON.stringify({ messages: [...messages, payload], model: customKeyObj ? customKeyObj.modelId : selectedModel }),
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
        const lines = chunk.split("\n");
        for (const line of lines) {
           if (line.trim().startsWith("0:")) {
              try {
                const text = JSON.parse(line.trim().slice(2));
                assistantContent += text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: assistantContent } : m));
              } catch (e) { assistantContent += line.trim().slice(2).replace(/^"/,"").replace(/"$/,""); }
           }
        }
      }
      await supabase.from("messages").insert([{ conversation_id: convoId, role: "assistant", content: assistantContent }]);
      supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId).then(() => fetchConversations());
    } catch (err: any) { 
        if (err.name !== "AbortError") setLogs(prev => [...prev.slice(-49), "[ERR] Neural Failure"]);
    } finally { setIsLoading(false); }
  };

  const handleCustomSubmit = (e?: any) => {
    e?.preventDefault(); if (!chatInput.trim() && !selectedImage) return;
    const msg: any = { id: Math.random().toString(36), role: "user", content: chatInput.trim() };
    if (selectedImage) msg.experimental_attachments = [{ name: "upload.png", contentType: "image/png", url: selectedImage }];
    sendMessage(msg); setChatInput(""); setSelectedImage(null);
  };

  const handleOpenFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      const files: Record<string, string> = {};
      const readDir = async (dirHandle: any, path = "") => {
        for await (const entry of dirHandle.values()) {
          const entryPath = `${path}/${entry.name}`;
          if (entry.kind === "directory") await readDir(entry, entryPath);
          else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts") || entry.name.endsWith(".css")) {
            const file = await entry.getFile();
            files[entryPath] = await file.text();
          }
        }
      };
      await readDir(handle);
      setProjectFiles(files);
      setLogs(prev => [...prev, `[SYS] Mounted Local Source: ${handle.name}`]);
    } catch (err: any) { console.error("Access Refused."); }
  };

  const saveToLocal = async (fileName: string, content: string) => {
    if (!directoryHandle) return;
    try {
      const parts = fileName.split("/").filter(Boolean);
      let currentDir = directoryHandle;
      for (let i = 0; i < parts.length - 1; i++) currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
      const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1], { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      setLogs(prev => [...prev.slice(-49), `[SYS] Sync: ${fileName}`]);
    } catch (err: any) { console.error("Sync Failure:", fileName); }
  };

  useEffect(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (lastAssistantMessage) {
       const content = lastAssistantMessage.content;
       const fileRegex = /\[FILE: (.*?)\]\n```tsx\n([\s\S]*?)```/g;
       let match;
       const newFiles = { ...projectFiles };
       let found = false;
       while ((match = fileRegex.exec(content)) !== null) {
          const fileName = match[1].startsWith("/") ? match[1] : `/${match[1]}`;
          if (newFiles[fileName] !== match[2]) {
             newFiles[fileName] = match[2];
             found = true;
             if (directoryHandle) saveToLocal(fileName, match[2]);
          }
       }
       if (found) setProjectFiles(newFiles);
    }
  }, [messages, directoryHandle]);

  if (!isMounted) return null;

  const themes = { dark: "bg-[#09090b] text-white", midnight: "bg-[#020617] text-slate-100", light: "bg-[#f8fafc] text-slate-900 border-gray-200" };

  return (
    <div className={`h-screen w-full flex ${themes[activeTheme]} font-sans overflow-hidden select-none transition-colors duration-500`}>
      <SupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* A. ACTIVITY BAR (HIDDEN ON MOBILE EXCEPT BOTTOM) */}
      <div className={`w-[50px] h-full ${activeTheme === "light" ? "bg-white border-gray-200" : "bg-black/20"} border-r border-white/5 flex flex-col items-center py-4 gap-4 z-[200] ${isMobile ? "hidden" : "flex"}`}>
         {[
           { id: "explorer", icon: Folder, label: "Explorer" },
           { id: "search", icon: Search, label: "Search" },
           { id: "support", icon: Heart, label: "Support" },
           { id: "config", icon: Settings, label: "Settings" }
         ].map(item => (
           <button 
            key={item.id} onClick={() => { if(item.id === "support") setIsSupportOpen(true); else { setViewMode(item.id as any); setIsSidebarOpen(true); } }}
            className={`p-2 rounded-lg transition-all relative group ${viewMode === item.id ? "text-purple-500" : "text-white/20 hover:text-white"}`}
           >
              <item.icon className="w-5 h-5" />
              <div className="absolute left-14 px-2 py-1 bg-black text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap border border-white/5 shadow-2xl z-50">{item.label}</div>
           </button>
         ))}
         <div className="mt-auto flex flex-col items-center gap-4">
            <button onClick={handleLogout} className="text-white/20 hover:text-red-500 transition-all group relative"><LogOut className="w-5 h-5" /><div className="absolute left-14 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100">Logout</div></button>
         </div>
      </div>

      {/* B. SIDEBAR (HIDDEN ON MOBILE) */}
      <AnimatePresence>
        {isSidebarOpen && !isMobile && (
          <motion.div initial={{ width: 0 }} animate={{ width: 280 }} exit={{ width: 0 }} className="h-full border-r border-white/5 bg-black/10 flex-col flex shrink-0">
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4">
               <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">{viewMode}</span>
               <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-white/20 hover:text-white"><PanelLeftClose className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-2">
               {viewMode === "explorer" && (
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 text-[10px] font-black text-white/40 uppercase tracking-widest">Neural Streams <Plus onClick={() => { setActiveChatId(null); setMessages([]); }} className="w-3.5 h-3.5 cursor-pointer hover:text-white" /></div>
                    <div className="space-y-0.5">
                       {conversations.filter(c => showArchived ? c.is_archived : !c.is_archived).map(c => (
                         <div key={c.id} className="relative group">
                            <button 
                              onClick={() => loadChat(c.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11.5px] font-bold transition-all ${activeChatId === c.id ? "bg-purple-500/10 text-purple-400" : "text-white/40 hover:bg-white/5 hover:text-white"}`}
                            >
                               {c.is_pinned ? <Pin className="w-3 h-3 text-purple-500" /> : <MessageSquare className="w-3 h-3 opacity-30" />}
                               <span className="truncate flex-1 text-left font-black tracking-tight">{c.title}</span>
                               <MoreHorizontal onClick={(e)=>{e.stopPropagation(); setActiveMenuId(activeMenuId === c.id ? null : c.id);}} className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-white cursor-pointer" />
                            </button>
                            {activeMenuId === c.id && (
                               <div className="absolute right-2 top-8 w-36 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1 z-[300]">
                                  {[
                                    { l: c.is_pinned?"Unpin":"Pin", i: Pin, a: "pin" },
                                    { l: "Rename", i: Pencil, a: "rename" },
                                    { l: c.is_archived?"Restore":"Archive", i: Archive, a: "archive" },
                                    { l: "Delete", i: Trash2, a: "delete", c: "text-red-500" }
                                  ].map(opt => (
                                    <button onClick={()=>handleChatAction(c.id, opt.a as any)} className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 transition-all ${opt.c||"text-white/60"}`}>
                                       <opt.i className="w-3 h-3" /> {opt.l}
                                    </button>
                                  ))}
                               </div>
                            )}
                         </div>
                       ))}
                       {conversations.length === 0 && <div className="p-4 text-center text-[10px] font-black uppercase text-white/10 tracking-[0.3em]">No streams found</div>}
                    </div>
                 </div>
               )}

               {viewMode === "config" && (
                 <div className="p-4 space-y-8">
                    {/* KEY FORGE Expansion */}
                    <div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Key className="w-3 h-3" /> The Key Forge</div>
                        <div className="space-y-2 mb-4">
                           {customKeys.map(k => (
                             <div key={k.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group transition-all hover:border-purple-500/20">
                                <span className="text-[10px] font-black uppercase text-white/60 truncate max-w-[120px]">{k.name}</span>
                                <Trash2 onClick={() => removeKey(k.id)} className="w-3.5 h-3.5 text-red-500/40 hover:text-red-500 cursor-pointer transition-all" />
                             </div>
                           ))}
                           {customKeys.length === 0 && <div className="text-[9px] font-black uppercase text-purple-500/40 italic px-2">Forge empty. Add keys below 🏹</div>}
                        </div>
                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 space-y-3">
                           <input placeholder="Personal Name (e.g. My Llama)" className="w-full bg-transparent border-none text-[10px] font-bold outline-none placeholder:text-white/10 text-white" value={newKey.name} onChange={e=>setNewKey({...newKey, name: e.target.value})} />
                           <input placeholder="API Key" className="w-full bg-transparent border-none text-[10px] font-bold outline-none placeholder:text-white/10 text-white" type="password" value={newKey.key} onChange={e=>setNewKey({...newKey, key: e.target.value})} />
                           <select className="w-full bg-transparent border-none text-[10px] font-black uppercase outline-none text-white/60 cursor-pointer" value={newKey.provider} onChange={e=>setNewKey({...newKey, provider: e.target.value})}>
                              <option value="nvidia">NVIDIA (Free)</option>
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic</option>
                              <option value="google">Google</option>
                           </select>
                           <input placeholder="Model ID (openai:gpt-4o)" className="w-full bg-transparent border-none text-[10px] font-bold outline-none placeholder:text-white/10 text-white" value={newKey.modelId} onChange={e=>setNewKey({...newKey, modelId: e.target.value})} />
                           <button onClick={handleAddKey} className="w-full py-2 bg-white text-black text-[9px] font-black uppercase rounded-lg hover:scale-[1.02] active:scale-95 transition-all">Forge Dynamic Key</button>
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Neural Theme</div>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: "dark", label: "Deep Zinc", bg: "bg-zinc-900" },
                                { id: "midnight", label: "Midnight Blue", bg: "bg-slate-950" },
                                { id: "light", label: "Snow White", bg: "bg-white border text-black" }
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveTheme(t.id as any)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activeTheme === t.id ? "border-purple-500 bg-purple-500/5 text-purple-400" : "border-white/5 bg-white/5 hover:bg-white/10 text-white/40"}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                                    {activeTheme === t.id && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* C. EDITOR CORE (HIDDEN ON MOBILE) */}
      <div className={`flex-1 flex-col min-w-0 bg-[#09090b] ${isMobile ? "hidden" : "flex"}`}>
         <div className="h-9 w-full bg-black/40 flex overflow-x-auto no-scrollbar border-b border-white/5 relative z-50">
            {openFiles.map(fileId => (
               <div key={fileId} onClick={() => setActiveFileId(fileId)} className={`h-full min-w-[120px] flex items-center px-4 gap-3 cursor-pointer border-r border-white/5 transition-all group relative ${activeFileId === fileId ? "bg-black/40 text-white" : "text-white/30 hover:text-white/60"}`}>
                  <FileCode className={`w-3.5 h-3.5 ${activeFileId === fileId ? "text-purple-500" : "opacity-30"}`} />
                  <span className="text-[11px] font-bold truncate">{fileId.split("/").pop()}</span>
                  <X className="w-3 h-3 opacity-0 group-hover:opacity-100 p-0.5" onClick={e=>{e.stopPropagation(); setOpenFiles(openFiles.filter(f=>f!==fileId));}} />
                  {activeFileId === fileId && <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500" />}
               </div>
            ))}
         </div>

         <div className="flex-1 relative overflow-hidden">
           <SandpackProvider template="react-ts" theme="dark" files={projectFiles}>
              <SandpackLayout className="h-full w-full !border-none !rounded-none">
                 <SandpackCodeEditor showTabs={false} showLineNumbers={true} className="h-full w-full !font-mono text-[14px]" />
              </SandpackLayout>
           </SandpackProvider>
         </div>

         {/* STATUS BAR */}
         <div className="h-6 w-full bg-purple-700 flex items-center justify-between px-3 z-50">
            <div className="flex items-center gap-4 h-full text-[10px] font-black text-white/90">
               <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleOpenFolder}><GitBranch className="w-3 h-3" /> hardware-bridge*</div>
               <div className="flex items-center gap-1.5"><RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> {isLoading ? "Neural Processing..." : "Ready"}</div>
            </div>
            <div className="flex items-center gap-4 h-full text-[10px] font-black text-white">
               <span className="uppercase tracking-widest">{customKeys.find(k => k.id === selectedModel)?.name || "NO MODEL"}</span>
               <div className="bg-white/10 px-2 h-full flex items-center">UTF-8</div>
            </div>
         </div>
      </div>

      {/* D. CHAT COLUMN (MOBILE-MASTERY) 📱 */}
      <AnimatePresence>
        {isRightSidebarOpen && (
          <motion.div initial={{ width: 0 }} animate={{ width: isMobile ? "100%" : 420 }} exit={{ width: 0 }} className="h-full border-l border-white/5 bg-black/20 flex flex-col shrink-0 relative overflow-hidden">
             {/* Header */}
             <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 shrink-0 z-50">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{isMobile ? "Odin Assistant" : "Pure Singularity"}</span>
                   </div>
                   <div className="flex items-center gap-1 text-[8px] font-black text-purple-500/60 uppercase tracking-widest">
                      <Lock className="w-2 h-2" /> Stored Locally
                   </div>
                </div>
                {isMobile && <button onClick={() => setIsSupportOpen(true)} className="p-2 bg-white/5 rounded-xl text-purple-400 group"><Heart className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /></button>}
                <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-white">
                  {customKeys.find(k => k.id === selectedModel)?.name.split(" ")[0] || "SELECT GEAR"} <ChevronDown className="w-3 h-3" />
                </button>
             </div>

             {/* UNIVERSAL MODEL DROPDOWN */}
             <AnimatePresence>
                {isModelDropdownOpen && (
                   <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="absolute top-14 right-6 w-64 bg-[#141416] border border-white/10 rounded-2xl shadow-3xl p-3 z-[400] overflow-y-auto max-h-[70vh] no-scrollbar">
                      {customKeys.length > 0 ? (
                        <div className="mb-4">
                           <div className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-500/60 mb-2 px-2 italic">Forged Intelligence 🏹</div>
                           <div className="space-y-1">
                              {customKeys.map(k => (
                                 <button key={k.id} onClick={() => { setSelectedModel(k.id); setIsModelDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${selectedModel === k.id ? "bg-purple-500/10 text-purple-400" : "text-white/40 hover:bg-white/5 hover:text-white"}`}>
                                    <div className="flex items-center gap-3"><Key className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase truncate max-w-[140px] text-white">{k.name}</span></div>
                                    {selectedModel === k.id && <Check className="w-3 h-3 text-purple-500" />}
                                 </button>
                              ))}
                           </div>
                        </div>
                      ) : (
                         <div className="p-4 text-center">
                            <AlertCircle className="w-8 h-8 text-white/5 mx-auto mb-2" />
                            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest leading-relaxed">Forge empty. <br/> Add keys in Settings.</p>
                         </div>
                      )}
                   </motion.div>
                )}
             </AnimatePresence>

             {/* Messages Container 📱 */}
             <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-8 no-scrollbar scroll-smooth flex flex-col pb-48">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10 py-20 px-10">
                     <Cloud className="w-12 h-12 mb-4" />
                     <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Neural Grid Offline</div>
                     <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed max-w-[200px]">Provide your own API keys in Settings to ignite the singularity engine.</p>
                  </div>
                ) : (
                  <div className="flex-1" /> // Spacer for bottom-up alignment
                )}
                {messages.map((m, idx) => (
                  <div key={m.id || idx} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                     <div className={`max-w-[92%] px-5 py-4 rounded-[28px] text-[13.5px] leading-relaxed shadow-sm transition-all ${m.role === "user" ? "bg-white/5 text-white border border-white/5" : "bg-black/40 text-gray-200 border border-white/5 shadow-inner"}`}>
                        {m.experimental_attachments?.[0] && <img src={m.experimental_attachments[0].url} className="w-full rounded-2xl mb-4" />}
                        <div className="whitespace-pre-wrap font-medium">{m.role === "user" ? m.content : m.content.replace(/```tsx\n[\s\S]*?```/g, "🛠️ Building Modules...")}</div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Input Forge 🏹 */}
             <div className="p-4 lg:p-6 pt-0 absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d] to-transparent z-50">
                <form onSubmit={handleCustomSubmit} className="bg-[#18181b]/80 border border-white/10 rounded-[32px] p-2 flex flex-col focus-within:ring-4 focus-within:ring-purple-500/10 transition-all shadow-3xl backdrop-blur-3xl relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                   <textarea 
                    className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none px-4 py-3 text-[14px] min-h-[50px] max-h-40 font-medium placeholder:text-white/10 text-white"
                    placeholder={isMobile ? "Say something..." : "Enter neural instruction..."} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),handleCustomSubmit())}
                   />
                   <div className="flex items-center justify-between px-2 pb-1 transition-opacity group-focus-within:opacity-100">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={()=>fileInputRef.current?.click()} className="p-2.5 text-white/10 hover:text-white transition-all"><Paperclip className="w-4 h-4"/></button>
                        {isMobile && <span className="text-[8px] font-black uppercase text-white/10 bg-white/5 px-2 py-1 rounded-full">{customKeys.find(k => k.id === selectedModel)?.name || "NO ENGINE"}</span>}
                      </div>
                      <button type="submit" disabled={isLoading||(!chatInput.trim()&&!selectedImage)||!selectedModel} className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${(!chatInput.trim()&&!selectedImage)||!selectedModel? "bg-white/5 text-white/5" : "bg-white text-black shadow-xl"}`}><Send className="w-3.5 h-3.5 rotate-[-90deg] translate-x-px"/></button>
                   </div>
                </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={e=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f);}}} accept="image/*" className="hidden" />
    </div>
  );
}
