"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
        <a 
          href="https://instagram.com/odincalm0" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xl font-bold tracking-tighter flex items-center gap-2 group"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">ODIN</span>
          <span className="group-hover:scale-110 transition-transform duration-300 inline-block">🫀</span>
        </a>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer">
            Login
          </Link>
          <Link href="/login" className="cursor-pointer text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]">
            Sign Up
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
