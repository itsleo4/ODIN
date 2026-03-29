import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ODIN 🫀 | AI Web Development Agent",
  description: "Advanced AI web development agent for seamless code generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-purple-500/30 selection:text-purple-200`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
