'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, BookOpen, Shield, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WikiPage() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  useEffect(() => {
    fetch('/api/wiki')
      .then(res => res.json())
      .then(data => {
        setClusters(data.clusters || []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      
      {/* DESKTOP SIDE NAVIGATION */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl shadow-2xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><MessageSquare size={20}/></Link>
          <Link href="/wiki" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
        <Link href="/wiki" className="p-3 text-white flex flex-col items-center gap-1 shadow-inner"><BookOpen size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header className="mb-2 shrink-0">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-600 bg-clip-text text-transparent">Knowledge Graph</h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-2">
            <Shield size={14} className="text-blue-500"/> Categorical Intelligence Synthesis
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-xs uppercase tracking-[0.2em]">Synthesizing Dossiers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clusters.map((cluster, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className={`p-6 rounded-3xl ${GLASS_BG} hover:border-blue-500/40 transition-all group cursor-pointer`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-neutral-900 rounded-2xl border border-white/5 text-blue-400 group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-tighter ${
                    cluster.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {cluster.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{cluster.title}</h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                  {cluster.summary}
                </p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                  <span>Relevance: {cluster.relevance || 98}%</span>
                  <div className="h-1 flex-grow bg-neutral-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${cluster.relevance || 98}%` }}></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {clusters.length === 0 && !loading && (
          <div className={`p-20 text-center rounded-3xl border-2 border-dashed border-white/5 text-neutral-600`}>
            No intelligence clusters detected. Log more thoughts to generate a graph.
          </div>
        )}
      </div>
    </main>
  );
}