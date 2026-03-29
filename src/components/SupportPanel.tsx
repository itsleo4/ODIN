"use client";

import { X, QrCode, Heart, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportPanel = ({ isOpen, onClose }: SupportPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
        >
          <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-[40px] p-10 relative shadow-[0_0_100px_rgba(168,85,247,0.15)] overflow-hidden">
            {/* Neural Background Decor */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 shadow-inner">
                 <Heart className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>

              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">
                The Nitin Kumar <br/> Support Grid
              </h2>
              
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] mb-6">
                ARCHITECT: NITIN KUMAR
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4 italic font-medium">
                "ODIN was architected solo by **Nitin Kumar**—a developer so legendarily lazy he taught atoms to solve his problems so he could nap longer. Support his lethargy before he decides your next UI request is 'socially exhausting' to implement. 🛋️😴💸"
              </p>

              {/* QR PLACEHOLDER BOX (USER CAN ADD IMAGES HERE) */}
              <div className="w-full aspect-square max-w-[200px] bg-white rounded-3xl p-6 mb-8 flex items-center justify-center shadow-2xl relative group overflow-hidden border-8 border-[#09090b]">
                   <QrCode className="w-full h-full text-black opacity-20" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest px-4 text-center">Drop your QR Image here, Nitin! 🫀🦾</span>
                   </div>
              </div>

              <div className="flex gap-3 w-full">
                 <button className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5">
                    <Coffee className="w-4 h-4" /> Fund My Laziness
                 </button>
              </div>

              <p className="mt-8 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                Solo Dev Mode Active 🛡️🦾📂
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
