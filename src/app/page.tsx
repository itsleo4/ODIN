"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Code2, Wand2, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <Navbar />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="z-10 flex flex-col items-center text-center px-4 max-w-4xl pt-32 pb-20"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium text-purple-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          ODIN 🫀 Platform is live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Build the Future with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 neon-text">
            Autonomous AI
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
          Experience the next generation of web development. ODIN designs, codes, and deploys high-performance web applications inside a seamless AI-driven workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2 group cursor-pointer">
            <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Enter Workspace
          </button>
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl glass hover:bg-white/10 text-white font-semibold text-lg transition-all cursor-pointer">
            View Documentation
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-24 text-left w-full h-full">
          <div className="glass p-6 rounded-2xl flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Smart Generation</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Powered by state of the art models configured to output production-ready code blocks and components.</p>
          </div>
          <div className="glass p-6 rounded-2xl flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Live Preview</h3>
            <p className="text-gray-400 text-sm leading-relaxed">See your beautiful code come to life instantly inside a dedicated browser workspace sandbox.</p>
          </div>
          <div className="glass p-6 rounded-2xl flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Wand2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Premium Aesthetics</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Built-in glassmorphism, stunning micro-animations, and dynamic visual styling out of the box.</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
