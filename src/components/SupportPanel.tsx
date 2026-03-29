"use client";

import { X, QrCode, Heart, Coffee, Globe, Wallet, Mail, Copy, Check, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface SupportPanelProps { isOpen: boolean; onClose: () => void; }

export function SupportPanel({ isOpen, onClose }: SupportPanelProps) {
  const [activeTab, setActiveTab] = useState<"upi" | "paypal" | "gmail">("upi");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const services = {
    upi: {
      id: "bharti00077-2@okaxis",
      qr: "https://i.ibb.co/rRHZvvd2/upi-qr.png",
      label: "UPI Payment",
      color: "text-green-400",
      bg: "bg-green-500/10",
      desc: "Fastest way to support local development."
    },
    paypal: {
      id: "@PawanKumar35438",
      qr: "https://i.ibb.co/CKv4bVd7/p-qr.png",
      label: "PayPal Global",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      desc: "Ideal for international neural-grid funding."
    },
    gmail: {
      id: "bharti00077@gmail.com",
      qr: "https://i.ibb.co/3YW8KrCL/g-qr.png",
      label: "Direct Contact",
      color: "text-red-400",
      bg: "bg-red-500/10",
      desc: "Drop a line for custom architecture."
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-xl" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#121214] border border-white/10 rounded-[48px] shadow-3xl no-scrollbar"
          >
            {/* Top Right Close Button (Universal) */}
            <button 
              onClick={onClose} 
              className="absolute top-8 right-8 z-[600] p-3 rounded-full bg-white/5 border border-white/10 hover:border-white/40 hover:bg-white/10 transition-all text-white/40 hover:text-white"
            >
               <X className="w-5 h-5" />
            </button>

            {/* Left Col: Branding */}
            <div className="p-12 flex flex-col items-start text-left bg-gradient-to-br from-purple-500/5 to-transparent">
               <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-10 shadow-inner"><Heart className="w-6 h-6 text-purple-400 animate-pulse" /></div>
               <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">Forge <br/><span className="text-purple-500">Patron</span></h2>
               <p className="text-white/40 text-sm font-medium leading-relaxed mb-10 max-w-xs">
                ODIN is built by a solo developer who taught AI to code so he could nap. Support his efficient lethargy and legendary architectural lazyness. 🛋️🔌
               </p>

               <div className="flex flex-col gap-3 w-full">
                  <a href="https://instagram.com/odincalm0" target="_blank" className="w-full flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/40 hover:bg-white/10 transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 flex items-center justify-center text-white"><Globe className="w-5 h-5" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Social Forge</span>
                     </div>
                     <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </a>
                  <button onClick={() => window.open("/support", "_blank")} className="w-full py-5 bg-purple-600 rounded-[32px] text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all">Go to Full Support Page</button>
               </div>
            </div>

            {/* Right Col: Instant Grid */}
            <div className="p-10 bg-[#0b0b0d] flex flex-col items-center justify-center">
               <div className="flex w-full gap-2 p-1 bg-black/40 rounded-3xl mb-10 border border-white/5">
                  {(["upi", "paypal", "gmail"] as const).map(s => (
                    <button 
                     key={s} onClick={() => setActiveTab(s)}
                     className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === s ? "bg-white text-black shadow-xl" : "text-white/20 hover:text-white/40"}`}
                    >
                      {s}
                    </button>
                  ))}
               </div>

               <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeTab} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full flex flex-col items-center"
                  >
                     <div className="w-60 h-60 bg-white rounded-[40px] p-6 mb-10 shadow-2xl relative group overflow-hidden border-8 border-black">
                        <img src={services[activeTab].qr} alt={activeTab} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-6 text-center">
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure scan with {activeTab}</span>
                        </div>
                     </div>

                     <div className={`w-full ${services[activeTab].bg} border border-white/5 rounded-3xl p-6 flex items-center justify-between gap-6`}>
                        <div className="flex flex-col items-start min-w-0">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${services[activeTab].color} mb-1 opacity-60`}>{services[activeTab].label}</span>
                           <span className="text-[12px] font-bold text-white tracking-tight truncate w-full">{services[activeTab].id}</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(services[activeTab].id, activeTab)}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                        >
                           {copied === activeTab ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/10" />}
                        </button>
                     </div>
                  </motion.div>
               </AnimatePresence>

               <button onClick={onClose} className="mt-10 p-4 rounded-full bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group">
                  <X className="w-4 h-4 text-white/30 group-hover:text-white transition-all" />
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
