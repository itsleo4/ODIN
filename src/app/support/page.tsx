"use client";

import { X, QrCode, Heart, Coffee, Globe, Wallet, Mail, Copy, Check, ChevronLeft, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"upi" | "paypal" | "gmail">("upi");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const services = {
    upi: {
      id: "7082103328@axl",
      qr: "https://i.ibb.co/nqNg7nxK/upi-qr.png",
      label: "UPI Payment",
      color: "text-green-400",
      bg: "bg-green-500/10",
      desc: "Fastest way to support local development."
    },
    paypal: {
      id: "nitinkumar-dev",
      qr: "https://i.ibb.co/Q3yqK7Z4/paypal-qr.png",
      label: "PayPal Global",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      desc: "Ideal for international neural-grid funding."
    },
    gmail: {
      id: "bhola.kumar.91.99@gmail.com",
      qr: "https://i.ibb.co/B59vNtg3/gmail-qr.png",
      label: "Direct Contact",
      color: "text-red-400",
      bg: "bg-red-500/10",
      desc: "Drop a line for custom architecture."
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Neural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff05 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <Link href="/workspace" className="absolute top-10 left-10 flex items-center gap-2 text-white/20 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group px-4 py-2 border border-white/5 rounded-full bg-white/5 backdrop-blur-md">
         <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Forge
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10"
      >
         {/* Left: Branding & Sarcasm */}
         <div className="flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 shadow-inner"><Heart className="w-6 h-6 text-purple-400 animate-pulse" /></div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-6">Support the <br/><span className="text-purple-500 underline decoration-4 underline-offset-8">Architect</span></h1>
            
            <div className="flex items-center gap-4 mb-10">
               <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Lead Dev: Nitin Kumar</div>
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white/20">A{i}</div>)}
               </div>
            </div>

            <div className="relative p-8 bg-white/5 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles className="w-12 h-12" /></div>
               <p className="text-xl italic text-white/50 leading-relaxed font-medium">
                "ODIN exists because **Nitin Kumar** was so legendarily lazy he taught AI to think for him so he could nap longer. Support his efficient lethargy before he decides your next feature request is 'socially exhausting' to implement."
               </p>
               <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-purple-500/60 uppercase tracking-widest">
                  <Zap className="w-4 h-4 fill-current" /> Forge Enterprise Support Grid V2.5
               </div>
            </div>
         </div>

         {/* Right: Donation Grid */}
         <div className="bg-[#121214] border border-white/10 rounded-[56px] p-2 shadow-3xl">
            <div className="bg-[#0b0b0d] rounded-[54px] p-10 flex flex-col items-center">
               <div className="flex w-full gap-2 p-1 bg-black/40 rounded-3xl mb-10 border border-white/5">
                  {(["upi", "paypal", "gmail"] as const).map(s => (
                    <button 
                     key={s} onClick={() => setActiveTab(s)}
                     className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === s ? "bg-white text-black shadow-xl scale-[1.02]" : "text-white/20 hover:text-white/40"}`}
                    >
                      {s}
                    </button>
                  ))}
               </div>

               <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeTab} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full flex flex-col items-center"
                  >
                     <div className="w-64 h-64 bg-white rounded-[40px] p-8 mb-10 shadow-[0_0_80px_rgba(168,85,247,0.15)] relative group overflow-hidden border-8 border-black">
                        <img src={services[activeTab].qr} alt={activeTab} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-6 text-center">
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure scan with {activeTab} app</span>
                        </div>
                     </div>

                     <div className="text-center mb-8">
                        <h3 className="text-2xl font-black uppercase italic text-white mb-2">{services[activeTab].label}</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/30">{services[activeTab].desc}</p>
                     </div>

                     <div className={`w-full ${services[activeTab].bg} border border-white/5 rounded-3xl p-6 flex items-center justify-between gap-6`}>
                        <div className="flex flex-col items-start min-w-0">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${services[activeTab].color} mb-1 opacity-60`}>Recipient Address</span>
                           <span className="text-[13px] font-bold text-white tracking-tight truncate w-full">{services[activeTab].id}</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(services[activeTab].id, activeTab)}
                          className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                        >
                           {copied === activeTab ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-white/20" />}
                        </button>
                     </div>
                  </motion.div>
               </AnimatePresence>

               <div className="mt-12 text-[10px] font-black text-white/10 uppercase tracking-[0.5em] text-center">Solo Dev Mode Active 🛡️🦾📂</div>
            </div>
         </div>
      </motion.div>
    </div>
  );
}
