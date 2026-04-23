'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { BrainCircuit, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/'; // Redirect to the core engine
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] flex items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-950/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-neutral-900 rounded-2xl border border-white/5 mb-4">
            <BrainCircuit className="text-blue-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lattice Core</h1>
          <p className="text-neutral-500 text-xs uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Lock size={12} /> Encrypted Vault
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input
              type="email"
              placeholder="System Identity (Email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 text-white placeholder-neutral-600 rounded-xl py-4 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all border border-white/5"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Passphrase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 text-white placeholder-neutral-600 rounded-xl py-4 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all border border-white/5"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold rounded-xl py-4 mt-2 hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Initialize Override'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}