import { login, signup } from "./actions";

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md">
        <div className="flex justify-center mb-8 hover:scale-105 transition-transform duration-300">
           <a 
            href="https://instagram.com/odincalm0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-4xl font-bold tracking-tighter flex items-center gap-2 group"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">ODIN</span>
            <span className="inline-block">🫀</span>
          </a>
        </div>

        <form className="glass p-8 rounded-2xl flex flex-col gap-5 border border-purple-500/20 shadow-[0_0_40px_rgba(139,92,246,0.1)]">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
            <p className="text-gray-400 text-sm mt-2">Log in or create a new account to enter the workspace.</p>
          </div>

          {searchParams?.message && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {searchParams.message}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300 font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300 font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              formAction={login}
              className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] cursor-pointer"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="w-full px-4 py-3 rounded-xl glass hover:bg-white/5 text-gray-300 hover:text-white font-medium transition-all border border-white/5 cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
