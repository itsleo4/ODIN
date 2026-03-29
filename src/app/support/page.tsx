"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Heart, Copy, Check, ExternalLink, HandCoins, DollarSign } from "lucide-react";
import Link from "next/link";

type SupportMethod = "upi" | "paypal" | "gmail";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<SupportMethod>("upi");
  const [copied, setCopied] = useState(false);

  const methods = {
    upi: {
      id: "UPI",
      address: "bharti00077-2@okaxis",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent("upi://pay?pa=bharti00077-2@okaxis"),
      icon: <HandCoins className="w-4 h-4 text-emerald-400" />,
      desc: "Instant bank transfer within India"
    },
    paypal: {
      id: "PayPal",
      address: "https://www.paypal.me/PawanKumar35438",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent("https://www.paypal.me/PawanKumar35438"),
      icon: <DollarSign className="w-4 h-4 text-blue-400" />,
      desc: "Global international payments"
    },
    gmail: {
      id: "Gmail",
      address: "bhart00077@gmail.com",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent("mailto:bhart00077@gmail.com"),
      icon: <Mail className="w-4 h-4 text-red-400" />,
      desc: "Alternative via email scan"
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeData = methods[activeTab];

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 flex flex-col font-sans selection:bg-purple-500/30 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-5xl mx-auto p-6 flex justify-between items-center z-10 relative">
        <Link href="/workspace" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-2 py-2">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Return to Engine</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">ODIN</span>
          <span className="text-xl drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]">🫀</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 z-10 relative">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Text Side */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 w-fit">
              <Heart className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
              <span className="text-sm font-bold tracking-wider text-purple-300 uppercase">Support the Dictatorship</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black leading-[1.15] tracking-tight">
              Fuel the future of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">ODIN Agent.</span>
            </h1>
            
            <p className="text-gray-400 text-lg max-w-md leading-relaxed font-medium">
              ODIN is built entirely by a solo developer. By contributing, you help sustain server costs, integrate elite models, and continually expand our empire. 
            </p>

            {/* Method Selectors */}
            <div className="flex flex-wrap gap-3 mt-4">
              {(Object.keys(methods) as SupportMethod[]).map((key) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                        : 'bg-[#18181b] border border-[#27272a] text-gray-400 hover:bg-[#27272a] hover:text-white'
                    }`}
                  >
                    {methods[key].icon}
                    {methods[key].id}
                  </button>
                )
              })}
            </div>
            
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-4">
              * Note: If UPI does not work internationally, <br/> please consider using PayPal or Gmail.
            </p>
          </div>

          {/* Right QR Card Side */}
          <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all duration-500 hover:border-purple-500/30 flex flex-col items-center text-center">
            
            <h2 className="text-2xl font-black text-white mb-2">{activeData.id} Transfer</h2>
            <p className="text-gray-400 text-sm font-medium mb-8">{activeData.desc}</p>
            
            {/* QR Code Frame */}
            <div className="w-64 h-64 bg-white rounded-2xl p-4 flex items-center justify-center mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity -z-10 rounded-full" />
              
              {/* Dynamic Image logic API rendering */}
              <div className="w-full h-full border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden bg-white hover:border-purple-300 transition-colors">
                 <img 
                    src={activeData.qr} 
                    alt={`${activeData.id} Dynamic QR API`}
                    className="w-full h-full object-contain absolute inset-0 z-10 mix-blend-multiply opacity-0 animate-in fade-in duration-500 fill-mode-forwards"
                    style={{ animationDelay: '200ms' }}
                 />
                 {/* Loading spinner behind image */}
                 <div className="flex flex-col items-center justify-center absolute inset-0 text-gray-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Generating QR</span>
                 </div>
              </div>
            </div>

            {/* Address Click-to-Copy Area */}
            <div className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-4 flex items-center justify-between group/copy relative overflow-hidden">
               <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
               <div className="flex flex-col items-start gap-1 relative z-10 overflow-hidden w-full pr-4">
                 <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{activeData.id} Routing Address</span>
                 {activeTab === 'paypal' ? (
                   <a href={activeData.address} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-mono text-sm sm:text-base truncate w-full text-left inline-flex items-center gap-2 transition-colors">
                     {activeData.address.replace('https://', '')}
                     <ExternalLink className="w-3 h-3" />
                   </a>
                 ) : (
                   <span className="text-gray-200 font-mono text-sm sm:text-base truncate w-full text-left font-bold tracking-tight">
                     {activeData.address}
                   </span>
                 )}
               </div>
               
               <button 
                 onClick={() => handleCopy(activeData.address)}
                 className="w-10 h-10 shrink-0 bg-[#27272a] hover:bg-white hover:text-black rounded-lg flex items-center justify-center transition-colors relative z-10 ml-2"
                 title="Copy to clipboard"
               >
                 {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
               </button>
            </div>
            
            <div className="h-6 mt-3">
              {copied && <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-1">Address Copied Base!</p>}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
