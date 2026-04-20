'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Flame, Send, Database, Tag, Zap, Star, Search } from 'lucide-react';

type Thought = {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  created_at: string;
};

export default function Home() {
  const [thought, setThought] = useState('');
  const [filterText, setFilterText] = useState('');
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
      fetchHistory();
    }
    setTimeout(() => setStatus(''), 3000);
    setIsProcessing(false);
  };

  const submitInterest = async () => {
    if (!thought) return;
    setIsProcessing(true);
    setStatus('Locking in core interest...');
    
    const res = await fetch('/api/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: thought }),
    });
    
    if (res.ok) {
      setStatus('Interest added to matrix.');
      setThought('');
      fetchHistory();
    }
    setTimeout(() => setStatus(''), 3000);
    setIsProcessing(false);
  };

  const getAnalysis = async (mode: 'angel' | 'devil') => {
    if (!thought) return;
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
    if (!thought) return;
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
    fetchHistory();
    setStatus('Collision saved.');
    setTimeout(() => setStatus(''), 3000);
    setIsProcessing(false);
  };

  // Filter logic: checks content, category, and sentiment
  const filteredHistory = history.filter(item => 
    item.content.toLowerCase().includes(filterText.toLowerCase()) ||
    item.category.toLowerCase().includes(filterText.toLowerCase()) ||
    item.sentiment.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-8 flex flex-col items-center font-mono pb-24 selection:bg-blue-500/30">
      <div className="w-full max-w-2xl space-y-8 mt-12">
        
        <motion.div className="flex items-center gap-3">
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 shadow-lg shadow-blue-900/20">
            <BrainCircuit className="text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-500 bg-clip-text text-transparent">
              Cognitive Engine
            </h1>
            <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1">Version 1.4 • Filter & Interests</p>
          </div>
        </motion.div>
        
        <motion.div className="relative group">
          <textarea
            className="w-full h-36 p-5 bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all duration-300 placeholder:text-neutral-700 text-lg leading-relaxed shadow-inner"
            placeholder="Type a thought, or declare a new Interest..."
            value={thought}
            onChange={(e) => setThought(e.target.value)}
          />
          
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button onClick={() => getAnalysis('angel')} disabled={isProcessing} className="p-2 bg-blue-900/30 text-blue-400 border border-blue-900/50 hover:bg-blue-900/50 rounded-xl transition-all" title="Summon Angel"><Sparkles size={18} /></button>
            <button onClick={() => getAnalysis('devil')} disabled={isProcessing} className="p-2 bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 rounded-xl transition-all" title="Summon Devil"><Flame size={18} /></button>
            <button onClick={getCollision} disabled={isProcessing} className="p-2 bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-900/50 hover:bg-fuchsia-900/50 rounded-xl transition-all" title="Trigger Collision"><Zap size={18} /></button>
            
            {/* NEW: Log Interest Button */}
            <button onClick={submitInterest} disabled={isProcessing || !thought} className="p-2 bg-amber-900/30 text-amber-400 border border-amber-900/50 hover:bg-amber-900/50 rounded-xl transition-all flex items-center gap-2 px-3" title="Save as Interest">
              <Star size={16} />
              <span className="text-xs font-bold uppercase hidden sm:block">Interest</span>
            </button>

            <button onClick={submitThought} disabled={isProcessing || !thought} className="p-2 bg-neutral-200 text-neutral-900 hover:bg-white rounded-xl transition-all flex items-center gap-2 px-4 font-bold">
              <span>Log</span>
              <Send size={16} />
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {status && (
            <motion.p className="text-sm text-blue-400 animate-pulse flex items-center gap-2">
              <Database size={14} />{status}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {analysis && (
            <motion.div className="p-6 bg-gradient-to-br from-neutral-900 to-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl whitespace-pre-wrap leading-relaxed text-neutral-300">
              {analysis}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent my-12" />

        {/* Memory Bank with Filter */}
        <motion.div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-neutral-500 flex items-center gap-2">
              <Database size={18} />
              Memory Lattice
            </h2>
            
            {/* NEW: Filter Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input 
                type="text" 
                placeholder="Filter by keyword or tag..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-full py-2 pl-9 pr-4 text-sm text-neutral-300 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {filteredHistory.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-5 border rounded-2xl transition-colors group ${
                    item.category === 'Interest' ? 'bg-amber-900/10 border-amber-900/30' : 
                    item.category === 'Collision' ? 'bg-fuchsia-900/10 border-fuchsia-900/30' :
                    'bg-neutral-900/30 border-neutral-800/50'
                  }`}
                >
                  <p className="text-neutral-300">{item.content}</p>
                  <div className="flex gap-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      {item.category === 'Interest' ? <Star size={10} className="text-amber-500" /> : <Tag size={10} />}
                      {item.category}
                    </span>
                    <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-full">
                      {item.sentiment}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredHistory.length === 0 && (
              <p className="text-neutral-600 italic text-center py-8">No memories match your filter.</p>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}