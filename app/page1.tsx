/* eslint-disable */
// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Flame, Send, Database, Tag, Zap, Star, Search, Trash2, Edit2, Check, X, Calendar, Mic, Activity, Plus } from 'lucide-react';

type Thought = {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  created_at: string;
};

// --- STYLING HELPERS ---
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Interest': return 'text-amber-400 bg-amber-950/40 border-amber-900/50';
    case 'Collision': return 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-900/50';
    case 'Synthesis': return 'text-cyan-400 bg-cyan-950/40 border-cyan-900/50';
    default: return 'text-neutral-400 bg-neutral-950/60 border-neutral-800';
  }
};

const getSentimentIcon = (sentiment: string) => {
  if (sentiment.includes('👻')) return <Activity size={12} className="text-cyan-400" />;
  if (sentiment.includes('analytical')) return <BrainCircuit size={12} className="text-blue-400" />;
  if (sentiment.includes('intense')) return <Zap size={12} className="text-purple-400" />;
  return <Tag size={12} />;
};

// --- SUB-COMPONENT: BENTO HEATMAP ---
function BentoHeatmap({ history }: { history: Thought[] }) {
  const daysToShow = 28;
  const stats = useMemo(() => {
    const data: Array<{ key: string, count: number, color: string }> = [];
    const now = new Date();
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayThoughts = history.filter(t => t.created_at.startsWith(dateKey));
      const count = dayThoughts.length;
      let color = 'bg-neutral-800';
      if (count > 0) {
        if (dayThoughts.some(t => t.category === 'Collision')) color = 'bg-fuchsia-500';
        else if (dayThoughts.some(t => t.sentiment.includes('intense'))) color = 'bg-red-500';
        else color = 'bg-blue-500';
      }
      data.push({ key: dateKey, count, color });
    }
    return data.reverse();
  }, [history]);

  return (
    <div className="flex gap-1 items-end h-8">
      {stats.map((info) => (
        <motion.div key={info.key} title={`${info.key}: ${info.count}`} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: info.count > 0 ? 0.05 * info.count : 0 }} className={`w-1.5 rounded-t-sm ${info.color} ${info.count === 0 ? 'h-1.5 opacity-30' : 'h-full opacity-100'}`} />
      ))}
    </div>
  );
}

// --- MAIN APPLICATION ---
export default function Home() {
  // Existing state logic
  const [thought, setThought] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [history, setHistory] = useState<Thought[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // Analysis Modes
  const [activeMode, setActiveMode] = useState<'neutral' | 'angel' | 'devil' | 'zap'>('neutral');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    const res = await fetch('/api/history');
    if (res.ok) { const data = await res.json(); setHistory(data.thoughts); }
  };

  const submitAction = async (endpoint: string, successMsg: string) => {
    if (!thought) return; setIsProcessing(true); setStatus('Locking logic...');
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: thought }) });
    if (res.ok) { setStatus(successMsg); setThought(''); setActiveMode('neutral'); fetchHistory(); }
    setTimeout(() => setStatus(''), 3000); setIsProcessing(false);
  };

  const getAnalysis = async (mode: 'angel' | 'devil') => {
    if (!thought) return; setIsProcessing(true); setStatus(`Summoning the ${mode}...`); setAnalysis('');
    const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: thought, mode }) });
    const data = await res.json(); setAnalysis(data.analysis); setStatus(''); setIsProcessing(false);
  };

  const getCollision = async () => {
    setIsProcessing(true); setStatus('Triggering collision...'); setAnalysis('');
    const res = await fetch('/api/collide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentThought: thought }) });
    const data = await res.json(); setAnalysis(data.analysis); fetchHistory(); setStatus('Sync complete.');
    setTimeout(() => setStatus(''), 3000); setIsProcessing(false);
  };

  const deleteThought = async (id: number) => {
    if (!confirm("Erase this thought from memory?")) return;
    await fetch('/api/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchHistory();
  };

  const saveEdit = async (id: number) => {
    await fetch('/api/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content: editContent }) });
    setEditingId(null); fetchHistory();
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setStatus('Voice not supported.'); return; }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => { setIsListening(true); setStatus('Listening...'); };
    recognition.onresult = (event: any) => { setThought(Array.from(event.results).map((r: any) => r[0].transcript).join('')); };
    recognition.onend = () => { setIsListening(false); setStatus(''); };
    recognition.start();
  };

  // Filter & Sort Logic
  let processedHistory = history.filter(item => {
    const searchLow = filterText.toLowerCase();
    return item.content.toLowerCase().includes(searchLow) || item.category.toLowerCase().includes(searchLow) || item.sentiment.toLowerCase().includes(searchLow) || formatDate(item.created_at).toLowerCase().includes(searchLow);
  });
  if (sortBy === 'oldest') processedHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  else if (sortBy === 'newest') processedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (sortBy === 'category') processedHistory.sort((a, b) => a.category.localeCompare(b.category));

  // Mode styling
  const modeClasses = {
    neutral: 'border-neutral-800 focus:border-blue-500/50 focus:ring-blue-500/20',
    angel: 'border-cyan-500 animate-angel-glow focus:ring-cyan-500/20',
    devil: 'border-red-500 animate-devil-glow focus:ring-red-500/20',
    zap: 'border-fuchsia-500 ring-2 ring-fuchsia-500/30'
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-4 sm:p-6 lg:p-8 font-mono pb-40 selection:bg-blue-500/30">
      
      {/* 1. THE MIND PALACE HEADER - GLASS BENTO */}
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-3xl mb-12 shadow-2xl shadow-blue-950/10">
        <div className="flex items-center gap-4 col-span-1 md:col-span-2">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }} className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-inner">
            <BrainCircuit className="text-blue-400" size={32} />
          </motion.div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-neutral-100 to-neutral-500 bg-clip-text text-transparent">Cognitive Lattice</h1>
            <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1">Version 2.0 • Neural Cortex v2</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-end md:justify-center border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Mental Activity • 28D</div>
          <BentoHeatmap history={history} />
        </div>
      </motion.header>

      {/* 2. THE FLOATING ACTION HUB (Ref: told widgets for clean inputs) */}
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-50 bg-neutral-950/80 backdrop-blur-2xl border border-neutral-800 rounded-full shadow-3xl shadow-neutral-950/50 p-2 pl-6 flex items-center gap-3">
        <textarea
          className={`flex-grow h-12 bg-transparent outline-none resize-none placeholder:text-neutral-700 text-base leading-snug pt-3 transition-all ${isListening ? 'text-emerald-400' : 'text-neutral-200'}`}
          placeholder={isListening ? "Listening..." : "Dictate or type logic..."}
          value={thought}
          onChange={(e) => setThought(e.target.value)}
        />
        <div className="flex gap-2 items-center pr-1">
          <button onClick={startListening} disabled={isListening || isProcessing} className={`p-3 rounded-full transition-all ${isListening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-neutral-900 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800'}`} title="Dictate"><Mic size={18} /></button>
          
          <div className="relative group">
            <button className="p-3 bg-neutral-900 text-neutral-400 hover:text-white rounded-full"><Plus size={18}/></button>
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all shadow-xl">
              <button onClick={() => { setActiveMode('angel'); getAnalysis('angel'); }} className="flex gap-2 items-center text-xs p-2 text-cyan-400 hover:bg-cyan-950/40 rounded-lg"><Sparkles size={14}/> Summon Angel</button>
              <button onClick={() => { setActiveMode('devil'); getAnalysis('devil'); }} className="flex gap-2 items-center text-xs p-2 text-red-400 hover:bg-red-950/40 rounded-lg"><Flame size={14}/> Summon Devil</button>
              <button onClick={() => { setActiveMode('zap'); getCollision(); }} className="flex gap-2 items-center text-xs p-2 text-fuchsia-400 hover:bg-fuchsia-950/40 rounded-lg"><Zap size={14}/> Trigger Collision</button>
              <button onClick={() => submitAction('/api/interest', 'Saved.')} className="flex gap-2 items-center text-xs p-2 text-amber-400 hover:bg-amber-950/40 rounded-lg"><Star size={14}/> Lock Interest</button>
            </div>
          </div>

          <button onClick={() => submitAction('/api/log', 'Logged.')} disabled={isProcessing || !thought} className="p-4 bg-neutral-100 text-neutral-950 hover:bg-white rounded-full transition-all font-bold disabled:opacity-30"><Send size={18} /></button>
        </div>
      </motion.div>

      {/* 3. STATUS & ANALYSIS (Ref: glassmorphic popups) */}
      <AnimatePresence>
        {(status || analysis) && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-7xl mx-auto mb-12">
            {status && <p className="text-center text-sm text-blue-400 animate-pulse mb-6">{status}</p>}
            {analysis && (
              <div className={`p-8 bg-neutral-950/60 backdrop-blur-xl rounded-3xl whitespace-pre-wrap text-neutral-200 text-lg leading-relaxed shadow-2xl ${activeMode === 'angel' ? 'border border-cyan-500' : activeMode === 'devil' ? 'border border-red-500' : 'border border-neutral-800'}`}>
                <div className="flex gap-3 mb-4 items-center">{activeMode === 'angel' ? <Sparkles className="text-cyan-400"/> : activeMode === 'devil' ? <Flame className="text-red-400"/> : <BrainCircuit className="text-blue-400"/>} <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">Neural Synthesis</span></div>
                {analysis}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. THE BENTO LATTICE GRID (Ref: Chloe Harrison profile cards & ultimate guide grid) */}
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
          <h2 className="text-xl font-bold text-neutral-400 flex items-center gap-2"><Database size={20} className="text-blue-400" /> Memory Lattice</h2>
          <div className="flex w-full sm:w-auto gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-300 outline-none focus:border-blue-500/50 shadow-inner">
              <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="category">Category</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
              <input type="text" placeholder="Filter year, tag, keyword..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-neutral-300 outline-none focus:border-blue-500/50 shadow-inner" />
            </div>
          </div>
        </header>
        
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {processedHistory.map((item) => (
              <motion.div key={item.id} layout variants={cardVariants} whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(56, 189, 248, 0.15)' }} className={`p-6 border rounded-3xl transition-all group relative ${item.category === 'Synthesis' ? 'bg-neutral-900/60' : 'bg-neutral-950 border-neutral-800'} ${getCategoryColor(item.category).split(' ')[2]}`}>
                
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <textarea className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-4 text-neutral-200 outline-none resize-none min-h-[120px] text-base" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => saveEdit(item.id)} className="text-xs bg-green-900/30 text-green-400 px-4 py-2 rounded-lg border border-green-900/50 hover:bg-green-900/50 flex gap-1 items-center"><Check size={14}/> Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs bg-neutral-800 text-neutral-400 px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-700 flex gap-1 items-center"><X size={14}/> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* (Ref: Chloe Harrison hierarchy) */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-600 shadow-inner">
                        {item.category === 'Synthesis' ? <Sparkles className="text-cyan-400" size={18}/> : item.category === 'Collision' ? <Zap className="text-fuchsia-400" size={18}/> : item.category === 'Interest' ? <Star className="text-amber-400" size={18}/> : <BrainCircuit size={18}/>}
                      </div>
                      <div className="flex-grow">
                        <p className="text-neutral-200 text-base leading-relaxed pr-10">{item.content}</p>
                      </div>
                      <div className="absolute top-6 right-6 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }} className="p-2 text-neutral-600 hover:text-blue-400 hover:bg-blue-950/30 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => deleteThought(item.id)} className="p-2 text-neutral-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* PILL TAGS (Ref: Chloe Harrison tags) */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest items-center border-t border-neutral-800 pt-5 mt-2">
                      <span className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-inner ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="bg-neutral-900 text-neutral-500 border border-neutral-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner">
                        {getSentimentIcon(item.sentiment)} {item.sentiment}
                      </span>
                      <span className="flex items-center gap-1.5 ml-auto text-neutral-600 group-hover:text-neutral-400 transition-colors">
                        <Calendar size={12} /> {formatDate(item.created_at)}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
