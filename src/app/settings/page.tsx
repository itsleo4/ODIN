"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import {
  Key, Trash2, Check, Plus, LogOut, ArrowLeft, Moon, Sun, Sunset,
  Archive, MessageSquare, Settings, User, Shield, Cpu, ChevronDown, ChevronRight
} from "lucide-react";

interface CustomKey { id: string; name: string; key: string; provider: string; modelId: string; }
interface Conversation { id: string; title: string; model: string; updated_at: string; is_pinned?: boolean; is_archived?: boolean; }

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"keys" | "theme" | "archive" | "account">("keys");
  const [customKeys, setCustomKeys] = useState<CustomKey[]>([]);
  const [newKey, setNewKey] = useState({ name: "", provider: "", key: "" });
  const [activeTheme, setActiveTheme] = useState<"dark" | "midnight" | "light">("dark");
  const [archivedChats, setArchivedChats] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [keyAdded, setKeyAdded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("odin-theme") as any;
    if (savedTheme) setActiveTheme(savedTheme);
    const savedKeys = localStorage.getItem("odin-custom-keys");
    if (savedKeys) setCustomKeys(JSON.parse(savedKeys));

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setCurrentUser(user);
      const { data } = await supabase
        .from("conversations").select("*")
        .eq("is_archived", true)
        .order("updated_at", { ascending: false });
      if (data) setArchivedChats(data);
    };
    init();
  }, []);

  useEffect(() => { if (isMounted) localStorage.setItem("odin-theme", activeTheme); }, [activeTheme, isMounted]);
  useEffect(() => { if (isMounted) localStorage.setItem("odin-custom-keys", JSON.stringify(customKeys)); }, [customKeys, isMounted]);

  const handleAddKey = () => {
    if (!newKey.name.trim() || !newKey.key.trim()) return;
    const keyObj: CustomKey = {
      ...newKey,
      id: Math.random().toString(36).slice(2),
      provider: newKey.provider.trim().toLowerCase() || "openai",
      modelId: ""
    };
    const updated = [...customKeys, keyObj];
    setCustomKeys(updated);
    setNewKey({ name: "", provider: "", key: "" });
    setKeyAdded(true);
    setTimeout(() => setKeyAdded(false), 2000);
  };

  const removeKey = (id: string) => {
    setCustomKeys(customKeys.filter(k => k.id !== id));
  };

  const unarchiveChat = async (id: string) => {
    await supabase.from("conversations").update({ is_archived: false }).eq("id", id);
    setArchivedChats(archivedChats.filter(c => c.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!isMounted) return null;

  const themes = {
    dark: "bg-[#09090b] text-white",
    midnight: "bg-[#020617] text-slate-100",
    light: "bg-[#f8fafc] text-slate-900"
  };

  const tabs = [
    { id: "keys", icon: Key, label: "API Keys" },
    { id: "theme", icon: Moon, label: "Theme" },
    { id: "archive", icon: Archive, label: "Archive" },
    { id: "account", icon: User, label: "Account" },
  ];

  return (
    <div className={`min-h-screen w-full ${themes[activeTheme]} font-sans transition-colors duration-300`}>
      {/* Top Nav */}
      <div className={`sticky top-0 z-50 border-b ${activeTheme === "light" ? "border-gray-200 bg-white/80" : "border-white/5 bg-black/40"} backdrop-blur-xl`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push("/workspace")} className="flex items-center gap-2 text-white/40 hover:text-white transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">Back to ODIN</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Settings</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Tab Bar */}
        <div className={`flex gap-1 p-1 rounded-2xl mb-6 ${activeTheme === "light" ? "bg-gray-100" : "bg-white/5"}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? "bg-purple-600 text-white shadow-lg" : activeTheme === "light" ? "text-gray-400 hover:text-gray-700" : "text-white/30 hover:text-white"}`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[8px] sm:text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* === API KEYS TAB === */}
          {activeTab === "keys" && (
            <motion.div key="keys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h2 className="text-lg font-black tracking-tight mb-1">The Key Forge 🏹</h2>
                <p className={`text-[11px] font-bold ${activeTheme === "light" ? "text-gray-400" : "text-white/30"}`}>Add API keys from any OpenAI-compatible provider. Your keys stay 100% local — never sent to our servers.</p>
              </div>

              {/* Add New Key Form */}
              <div className={`rounded-2xl border p-4 space-y-3 ${activeTheme === "light" ? "border-gray-200 bg-gray-50" : "border-white/8 bg-white/3"}`}>
                <div className="text-[9px] font-black uppercase tracking-widest text-purple-500/80 mb-1">New Key</div>
                <input
                  placeholder="Give it a name (e.g. My Groq Key)"
                  className={`w-full rounded-xl px-4 py-3 text-[13px] font-medium outline-none border transition-all ${activeTheme === "light" ? "bg-white border-gray-200 text-gray-800 placeholder:text-gray-300" : "bg-black/20 border-white/8 text-white placeholder:text-white/20 focus:border-purple-500/40"}`}
                  value={newKey.name} onChange={e => setNewKey({ ...newKey, name: e.target.value })}
                />
                <input
                  placeholder="Provider (nvidia, groq, openai, anthropic, deepseek…)"
                  className={`w-full rounded-xl px-4 py-3 text-[13px] font-medium outline-none border transition-all ${activeTheme === "light" ? "bg-white border-gray-200 text-gray-800 placeholder:text-gray-300" : "bg-black/20 border-white/8 text-white placeholder:text-white/20 focus:border-purple-500/40"}`}
                  value={newKey.provider} onChange={e => setNewKey({ ...newKey, provider: e.target.value })}
                />
                <input
                  placeholder="API Key (sk-...)"
                  type="password"
                  className={`w-full rounded-xl px-4 py-3 text-[13px] font-medium outline-none border transition-all ${activeTheme === "light" ? "bg-white border-gray-200 text-gray-800 placeholder:text-gray-300" : "bg-black/20 border-white/8 text-white placeholder:text-white/20 focus:border-purple-500/40"}`}
                  value={newKey.key} onChange={e => setNewKey({ ...newKey, key: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleAddKey()}
                />
                <motion.button
                  onClick={handleAddKey}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-3 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${keyAdded ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"}`}
                >
                  {keyAdded ? <><Check className="w-4 h-4" /> Key Forged!</> : <><Plus className="w-4 h-4" /> Forge Key</>}
                </motion.button>
              </div>

              {/* Provider Quick Guide */}
              <div className={`rounded-2xl border p-4 ${activeTheme === "light" ? "border-gray-200 bg-gray-50" : "border-white/5 bg-white/2"}`}>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Quick Provider Guide</div>
                {[
                  { provider: "nvidia", desc: "Free tier - qwen3-coder-480b (recommended)", color: "text-green-400" },
                  { provider: "groq", desc: "Free tier - llama3-70b-8192 (fast)", color: "text-yellow-400" },
                  { provider: "deepseek", desc: "Free/Paid - deepseek-coder", color: "text-blue-400" },
                  { provider: "openai", desc: "Paid - gpt-4o (default)", color: "text-emerald-400" },
                  { provider: "anthropic", desc: "Paid - claude-3-5-sonnet", color: "text-orange-400" },
                  { provider: "google", desc: "Paid - gemini-1.5-pro", color: "text-cyan-400" },
                ].map(p => (
                  <div key={p.provider} className="flex items-center gap-3 py-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest w-20 shrink-0 ${p.color}`}>{p.provider}</span>
                    <span className="text-[10px] text-white/30 font-medium">{p.desc}</span>
                  </div>
                ))}
              </div>

              {/* Saved Keys */}
              {customKeys.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Saved Keys ({customKeys.length})</div>
                  {customKeys.map(k => (
                    <motion.div key={k.id} layout className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${activeTheme === "light" ? "border-gray-200 bg-white" : "border-white/8 bg-white/3"}`}>
                      <div>
                        <div className="text-[12px] font-black text-white">{k.name}</div>
                        <div className="text-[9px] font-bold text-purple-500/60 uppercase tracking-widest">{k.provider}</div>
                      </div>
                      <button onClick={() => removeKey(k.id)} className="p-2 text-red-500/40 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* === THEME TAB === */}
          {activeTab === "theme" && (
            <motion.div key="theme" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h2 className="text-lg font-black tracking-tight mb-1">Neural Theme</h2>
                <p className={`text-[11px] font-bold ${activeTheme === "light" ? "text-gray-400" : "text-white/30"}`}>Choose your forge aesthetic.</p>
              </div>
              {[
                { id: "dark", label: "Deep Zinc", desc: "The Original. Pure darkness.", preview: "bg-zinc-900", icon: Moon },
                { id: "midnight", label: "Midnight Blue", desc: "Deep ocean dark mode.", preview: "bg-slate-950", icon: Sunset },
                { id: "light", label: "Snow White", desc: "For the daytime architects.", preview: "bg-white border border-gray-200", icon: Sun },
              ].map(t => (
                <motion.button
                  key={t.id} whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTheme(t.id as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${activeTheme === t.id ? "border-purple-500 bg-purple-500/5" : activeTheme === "light" ? "border-gray-200 bg-white hover:border-gray-300" : "border-white/8 bg-white/3 hover:bg-white/5"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${t.preview} flex items-center justify-center shrink-0`}>
                      <t.icon className={`w-4 h-4 ${t.id === "light" ? "text-gray-400" : "text-white/30"}`} />
                    </div>
                    <div className="text-left">
                      <div className={`text-[12px] font-black ${activeTheme === t.id ? "text-purple-400" : ""}`}>{t.label}</div>
                      <div className="text-[10px] text-white/30 font-medium">{t.desc}</div>
                    </div>
                  </div>
                  {activeTheme === t.id && <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* === ARCHIVE TAB === */}
          {activeTab === "archive" && (
            <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h2 className="text-lg font-black tracking-tight mb-1">Archived Streams</h2>
                <p className={`text-[11px] font-bold ${activeTheme === "light" ? "text-gray-400" : "text-white/30"}`}>{archivedChats.length} archived conversation{archivedChats.length !== 1 ? "s" : ""}.</p>
              </div>
              {archivedChats.length === 0 ? (
                <div className={`rounded-2xl border p-12 text-center ${activeTheme === "light" ? "border-gray-200 bg-gray-50" : "border-white/5 bg-white/2"}`}>
                  <Archive className="w-10 h-10 mx-auto mb-3 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No archived streams.</p>
                </div>
              ) : archivedChats.map(c => (
                <div key={c.id} className={`flex items-center justify-between p-4 rounded-2xl border ${activeTheme === "light" ? "border-gray-200 bg-white" : "border-white/8 bg-white/3"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <MessageSquare className="w-4 h-4 text-white/20 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[12px] font-black truncate">{c.title}</div>
                      <div className="text-[9px] text-white/30 font-medium">{new Date(c.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button onClick={() => unarchiveChat(c.id)} className="ml-3 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 transition-all shrink-0">
                    Restore
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* === ACCOUNT TAB === */}
          {activeTab === "account" && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h2 className="text-lg font-black tracking-tight mb-1">Account</h2>
                <p className={`text-[11px] font-bold ${activeTheme === "light" ? "text-gray-400" : "text-white/30"}`}>Manage your ODIN identity.</p>
              </div>

              {currentUser && (
                <div className={`rounded-2xl border p-4 ${activeTheme === "light" ? "border-gray-200 bg-gray-50" : "border-white/8 bg-white/3"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-lg">
                      {currentUser.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-[12px] font-black">{currentUser.email}</div>
                      <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Architect Identity</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${activeTheme === "light" ? "bg-green-50 border border-green-200" : "bg-green-500/5 border border-green-500/10"}`}>
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">API Keys Stored Locally Only</span>
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                className="w-full py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of ODIN
              </motion.button>

              <div className={`text-center text-[9px] font-black uppercase tracking-widest ${activeTheme === "light" ? "text-gray-300" : "text-white/10"}`}>
                ODIN V2.3 · Pure Singularity · Locally Forged
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
