'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Flame, Send, Database, Tag, Zap } from 'lucide-react';

type Thought = {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  created_at: string;
};

export default function Home() {
  const [thought, setThought] = useState('');
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [history, setHistory] = useState<Thought[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await fetch('/api/history');
    if (res.ok) {
      const data = await res.json();
      setHistory(data.thoughts);
    }
  };

  const submitThought = async () => {
    if (!thought) return;
    setIsProcessing(true);
    setStatus('Indexing shadow data...');
    
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: thought }),
    });
    
    if (res.ok) {
      setStatus('Thought captured.');
      setThought('');
      setAnalysis('');
      fetchHistory();
      setTimeout(() => setStatus(''), 3000);
    } else {
      setStatus('Failed to capture.');
    }
    setIsProcessing(false);
  };

  const getAnalysis = async (mode: 'angel' | 'devil') => {
    if (!thought) {
      setStatus('Type a thought first before summoning!');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    setIsProcessing(true);
    setStatus(`Summoning the ${mode}...`);
    setAnalysis('');
    
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: thought, mode }),
    });
    
    const data = await res.json();
    setAnalysis(data.analysis);
    setStatus('');
    setIsProcessing(false);
  };

  const getCollision = async () => {
    if (!thought) {
      setStatus('Type a thought first to trigger a collision!');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    setIsProcessing(true);
    setStatus('Initiating particle collision...');
    setAnalysis('');
    
    const res = await fetch('/api/collide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentThought: thought }),
    });
    
    const data = await res.json();
    setAnalysis(data.analysis);
    
    // NEW: Refresh the lattice to show the saved collision
    fetchHistory(); 
    
    setStatus('Collision saved to lattice.');
    setTimeout(() => setStatus(''), 3000);
    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-8 flex flex-col items-center font-mono pb-24 selection:bg-blue-500/30">
      <div className="w-full max-w-2xl space-y-8 mt-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg shadow-blue-900/20">
            <BrainCircuit className="text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-500 bg-clip-text text-transparent">
              Cognitive Engine
            </h1>
            <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1">Version 1.3 • Collider Active</p>
          </div>
        </motion.div>
        
        {/* Input Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <textarea
            className="w-full h-36 p-5 bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none resize-none transition-all duration-300 placeholder:text-neutral-700 text-lg leading-relaxed shadow-inner"
            placeholder="What's on your mind?..."
            value={thought}
            onChange={(e) => setThought(e.target.value)}
          />
          
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={() => getAnalysis('angel')}
              disabled={isProcessing}
              className="p-2 bg-blue-900/30 text-blue-400 border border-blue-900/50 hover:bg-blue-900/50 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              title="Summon Angel"
            >
              <Sparkles size={18} />
            </button>
            <button 
              onClick={() => getAnalysis('devil')}
              disabled={isProcessing}
              className="p-2 bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              title="Summon Devil"
            >
              <Flame size={18} />
            </button>
            <button 
              onClick={getCollision}
              disabled={isProcessing}
              className="p-2 bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-900/50 hover:bg-fuchsia-900/50 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              title="Trigger Collision"
            >
              <Zap size={18} />
            </button>
            <button 
              onClick={submitThought}
              disabled={isProcessing || !thought}
              className="p-2 bg-neutral-200 text-neutral-900 hover:bg-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-white/10 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 px-4 font-bold"
            >
              <span>Log</span>
              <Send size={16} />
            </button>
          </div>
        </motion.div>

        {/* Status indicator */}
        <AnimatePresence>
          {status && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-blue-400 animate-pulse flex items-center gap-2"
            >
              <Database size={14} />
              {status}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Analysis Output */}
        <AnimatePresence>
          {analysis && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 bg-gradient-to-br from-neutral-900 to-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl whitespace-pre-wrap leading-relaxed text-neutral-300"
            >
              {analysis}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent my-12" />

        {/* Memory Bank */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-neutral-500 mb-6 flex items-center gap-2">
            <Database size={18} />
            Memory Lattice
          </h2>
          
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 bg-neutral-900/30 border border-neutral-800/50 hover:border-neutral-700 rounded-2xl transition-colors group"
                >
                  <p className="text-neutral-300 group-hover:text-neutral-200 transition-colors">{item.content}</p>
                  <div className="flex gap-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Tag size={10} />
                      {item.category}
                    </span>
                    <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-full">
                      {item.sentiment}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {history.length === 0 && (
              <p className="text-neutral-600 italic text-center py-8">The lattice is currently empty.</p>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}