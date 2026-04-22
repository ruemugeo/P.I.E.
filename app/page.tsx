'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, Send, MessageSquare, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [content, setContent] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [thoughts, setThoughts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(data => setThoughts(data.thoughts || []));
  }, []);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsLogging(true);
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setContent('');
      // Refresh history
      fetch('/api/history').then(res => res.json()).then(data => setThoughts(data.thoughts || []));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLogging(false);
    }
  };

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      
      {/* DESKTOP SIDE NAVIGATION */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl shadow-2xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><MessageSquare size={20}/></Link>
        </div>
      </motion.nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-600 bg-clip-text text-transparent">Lattice</h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-2">
            <Zap size={14} className="text-yellow-400"/> Core Online
          </p>
        </header>

        {/* INPUT BOX */}
        <form onSubmit={handleLog} className="relative w-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Log a thought, idea, or task..."
            className={`w-full h-32 p-6 pr-16 rounded-3xl ${GLASS_BG} text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none`}
            disabled={isLogging}
          />
          <button type="submit" disabled={isLogging || !content.trim()} className="absolute right-4 bottom-4 p-3 bg-neutral-100 text-black rounded-2xl hover:bg-white disabled:opacity-50 transition-all shadow-xl">
            {isLogging ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        {/* RECENT THOUGHTS */}
        <div className="flex flex-col gap-4">
          <h3 className="text-neutral-500 uppercase text-xs font-bold tracking-widest pl-2">Recent Logs</h3>
          {thoughts.map((t: any) => (
            <div key={t.id} className={`p-5 rounded-2xl ${GLASS_BG}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs px-2 py-1 bg-neutral-900 rounded border border-white/5 text-neutral-400">{t.category}</span>
                <span className="text-xs text-neutral-500">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed">{t.content}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}