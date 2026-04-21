'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Flame, Send, Database, Tag, Zap, Star, Search, Trash2, Edit2, Check, X, Calendar, Mic, Plus, AreaChart, BotMessageSquare, Clock } from 'lucide-react';

type Thought = {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  created_at: string;
};

// --- STYLING HELPERS ---
const formatDateWithTime = (dateString: string) => {
  const d = new Date(dateString);
  const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${formattedDate} • ${formattedTime}`;
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Interest': return 'text-amber-300 bg-amber-950/50 border-amber-800/60 shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]';
    case 'Collision': return 'text-fuchsia-300 bg-fuchsia-950/50 border-fuchsia-800/60 shadow-[0_0_15px_-3px_rgba(217,70,239,0.3)]';
    case 'Synthesis': return 'text-cyan-300 bg-cyan-950/50 border-cyan-800/60 shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]';
    default: return 'text-neutral-400 bg-neutral-900 border-white/5'; 
  }
};

const getSentimentIcon = (sentiment: string) => {
  if (sentiment.includes('👻')) return <Clock size={12} className="text-cyan-300" />;
  if (sentiment.includes('analytical')) return <BrainCircuit size={12} className="text-blue-300" />;
  if (sentiment.includes('intense')) return <Flame size={12} className="text-red-300" />;
  return <Tag size={12} />;
};

// --- SUB-COMPONENT: BENTO HEATMAP ---
function SpatialHeatmap({ history }: { history: Thought[] }) {
  const daysToShow = 28;
  const stats = useMemo(() => {
    const data: Record<string, { count: number; color: string }> = {};
    const now = new Date();
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayThoughts = history.filter(t => t.created_at.startsWith(dateKey));
      const count = dayThoughts.length;
      let color = 'bg-neutral-800'; 
      if (count > 0) {
        if (dayThoughts.some(t => t.category === 'Collision')) color = 'bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)]';
        else if (dayThoughts.some(t => t.sentiment.toLowerCase().includes('devil'))) color = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]';
        else if (dayThoughts.some(t => t.sentiment.toLowerCase().includes('angel'))) color = 'bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]';
        else color = 'bg-blue-500';
      }
      data[dateKey] = { count, color };
    }
    return Object.entries(data).reverse();
  }, [history]);

  return (
    <div className="bg-neutral-950/30 p-5 rounded-3xl border border-white/5 backdrop-blur-sm shadow-ao">
      <div className="flex gap-2 items-end justify-between h-10 w-full max-w-sm">
        {stats.map(([date, info]) => (
          <motion.div key={date} title={`${date}: ${info.count}`} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.05 * info.count }} className={`flex-grow rounded-sm ${info.color} ${info.count === 0 ? 'h-1 opacity-20' : 'h-full opacity-100'}`} />
        ))}
      </div>
    </div>
  );
}

// --- MAIN APPLICATION ---
export default function Home() {
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

  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'neutral' | 'angel' | 'devil' | 'zap'>('neutral');
  
  // FIX: Added the missing useRef declaration
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    const res = await fetch('/api/history');
    if (res.ok) { const data = await res.json(); setHistory(data.thoughts); }
  };

  const submitAction = async (endpoint: string, successMsg: string) => {
    if (!thought) return; setIsProcessing(true); setStatus('Neural commit initiated...');
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: thought }) });
    if (res.ok) { setStatus(successMsg); setThought(''); setActiveMode('neutral'); setIsCreationOpen(false); fetchHistory(); }
    setTimeout(() => setStatus(''), 3000); setIsProcessing(false);
  };

  const getAnalysis = async (mode: 'angel' | 'devil') => {
    if (!thought) return; setIsProcessing(true); setStatus(`Summoning the ${mode}...`); setAnalysis('');
    const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: thought, mode }) });
    const data = await res.json(); setAnalysis(data.analysis); setStatus(''); setIsProcessing(false);
  };

  const getCollision = async () => {
    setIsProcessing(true); setStatus('Generating particle collision...'); setAnalysis('');
    const res = await fetch('/api/collide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentThought: thought }) });
    const data = await res.json(); setAnalysis(data.analysis); fetchHistory(); setStatus('Sync complete.');
    setTimeout(() => setStatus(''), 3000); setIsProcessing(false);
  };

  const deleteThought = async (id: number) => {
    if (!confirm("Erase this memory permanently?")) return;
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
    if (!SpeechRecognition) { setStatus('Voice commands not supported.'); return; }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => { setIsListening(true); setStatus('Listening...'); };
    recognition.onresult = (event: any) => { setThought(Array.from(event.results).map((r: any) => r[0].transcript).join('')); };
    recognition.onend = () => { setIsListening(false); setStatus(''); };
    recognition.start();
  };

  let processedHistory = history.filter(item => {
    const searchLow = filterText.toLowerCase();
    return item.content.toLowerCase().includes(searchLow) || item.category.toLowerCase().includes(searchLow) || item.sentiment.toLowerCase().includes(searchLow) || formatDateWithTime(item.created_at).toLowerCase().includes(searchLow);
  });
  if (sortBy === 'oldest') processedHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  else if (sortBy === 'newest') processedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (sortBy === 'category') processedHistory.sort((a, b) => a.category.localeCompare(b.category));

  const FONT_TA_TRACK = "tracking-tighter font-extrabold";
  const CARD_ROUND = "rounded-3xl";
  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";
  const TEXT_PRIMARY = "text-neutral-100";
  const TEXT_SUB = "text-neutral-500 font-bold uppercase tracking-widest text-[10px]";

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <main className="min-h-screen bg-starfield text-neutral-100 p-6 lg:p-10 font-mono pb-48 selection:bg-blue-500/30 relative">
      
      {/* 1. SIDE NAVIGATION BAR */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} ${CARD_ROUND} shadow-ao z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <button className="p-3 hover:text-white hover:bg-neutral-900 rounded-xl transition-all"><Database size={20}/></button>
          <button className="p-3 hover:text-white hover:bg-neutral-900 rounded-xl transition-all"><AreaChart size={20}/></button>
          <button className="p-3 hover:text-white hover:bg-neutral-900 rounded-xl transition-all"><BotMessageSquare size={20}/></button>
          <div className="h-px w-full bg-white/5 my-2"></div>
          <button className="p-3 hover:text-white hover:bg-neutral-900 rounded-xl transition-all"><Calendar size={20}/></button>
        </div>
      </motion.nav>

      <div className="lg:ml-28 w-full max-w-7xl mx-auto space-y-12">
        
        {/* 2. THE MAIN CORTEX CANVAS */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className={`text-4xl md:text-5xl ${FONT_TA_TRACK} bg-gradient-to-r from-neutral-100 via-neutral-400 to-neutral-700 bg-clip-text text-transparent`}>The BirdsEyes Cortex</h1>
            <p className={`${TEXT_SUB} mt-2`}>Version 2.0 • Private Spatial Lattice • V3 Features Room</p>
          </motion.div>
          
          <div className="flex flex-col md:items-end md:justify-center gap-3">
            <span className={TEXT_SUB}>Central Mental Activity (28D Matrix)</span>
            <SpatialHeatmap history={history} />
          </div>
        </section>

        {/* 3. STATUS & ANALYSIS */}
        <AnimatePresence>
          {(status || analysis) && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full mb-12 relative z-40">
              {status && <p className="text-center text-sm text-blue-400 animate-pulse mb-6">{status}</p>}
              {analysis && (
                <div className={`p-8 ${GLASS_BG} rounded-3xl whitespace-pre-wrap text-neutral-200 text-lg leading-relaxed shadow-ao max-w-4xl mx-auto ${activeMode === 'angel' ? 'animate-angel-glow' : activeMode === 'devil' ? 'animate-devil-glow' : ''}`}>
                  <div className="flex gap-3 mb-5 items-center">{activeMode === 'angel' ? <Sparkles className="text-cyan-400"/> : activeMode === 'devil' ? <Flame className="text-red-400"/> : <BrainCircuit className="text-blue-400"/>} <span className={TEXT_SUB}>AI Neural Synthesis</span></div>
                  {analysis}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. THE MEMORY LATTICE */}
        <section>
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-5 px-3">
            <h2 className={`text-2xl ${FONT_TA_TRACK} text-neutral-400 flex items-center gap-2`}><Clock size={24} className="text-cyan-400" /> Active Thoughts</h2>
            <div className="flex w-full sm:w-auto gap-3">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 text-sm text-neutral-300 outline-none focus:border-blue-500/50 shadow-inner">
                <option value="newest">Sort by Newest</option><option value="oldest">Sort by Oldest</option><option value="category">Sort by Category</option>
              </select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
                <input type="text" placeholder="Search knowledge..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-neutral-300 outline-none focus:border-blue-500/50 shadow-inner" />
              </div>
            </div>
          </header>
          
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {processedHistory.map((item) => (
                <motion.div key={item.id} layout variants={cardVariants} whileHover={{ y: -8, boxShadow: '0 30px 60px -10px rgba(56, 189, 248, 0.25)' }} className={`p-8 bg-neutral-950 rounded-3xl border border-white/5 transition-all group relative shadow-ao`}>
                  
                  {editingId === item.id ? (
                    <div className="space-y-4">
                      <textarea className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl p-4 text-neutral-200 outline-none resize-none min-h-[140px] text-base" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveEdit(item.id)} className="text-xs bg-green-900/40 text-green-400 px-5 py-2.5 rounded-xl border border-green-900/60 hover:bg-green-900/60 flex gap-1.5 items-center font-bold tracking-wider uppercase"><Check size={14}/> Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs bg-neutral-800 text-neutral-400 px-5 py-2.5 rounded-xl border border-neutral-700 hover:bg-neutral-700 flex gap-1.5 items-center font-bold tracking-wider uppercase"><X size={14}/> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* CARD HIERARCHY */}
                      <div className="flex items-start gap-5 mb-6 relative">
                        <div className={`p-4 rounded-xl shadow-inner ${getCategoryColor(item.category)}`}>
                          {item.category === 'Synthesis' ? <BotMessageSquare className="text-cyan-400" size={20}/> : item.category === 'Collision' ? <Zap className="text-fuchsia-400" size={20}/> : item.category === 'Interest' ? <Star className="text-amber-400" size={20}/> : <BrainCircuit size={20}/>}
                        </div>
                        
                        {/* FIX: Removed the rogue closing bracket here */}
                        <div className="flex-grow">
                          <p className="text-neutral-200 text-base leading-relaxed pr-12">{item.content}</p>
                        </div>

                        <div className="absolute top-0 right-0 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }} className="p-2.5 text-neutral-600 hover:text-blue-400 hover:bg-blue-950/30 rounded-lg transition-all"><Edit2 size={14} /></button>
                          <button onClick={() => deleteThought(item.id)} className="p-2.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      {/* PILL TAGS */}
                      <div className="flex flex-wrap gap-2 items-center border-t border-white/5 pt-6 mt-2">
                        <span className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-full border shadow-inner ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="bg-neutral-900 text-neutral-500 border border-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-inner">
                          {getSentimentIcon(item.sentiment)} {item.sentiment}
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto text-neutral-600 group-hover:text-neutral-400 transition-colors text-[10px] font-bold tracking-wider opacity-70">
                          <Calendar size={12} /> {formatDateWithTime(item.created_at)}
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>

      {/* 5. FLOATING COMMAND DOCK */}
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50 flex flex-col items-center gap-4`}>
        
        {/* Creation Bottom Sheet */}
        <AnimatePresence>
          {isCreationOpen && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className={`w-full max-w-3xl ${GLASS_BG} p-8 rounded-3xl shadow-ao mb-2 relative z-10 space-y-5`}>
              <button onClick={() => setIsCreationOpen(false)} className="absolute top-6 right-6 p-2 text-neutral-600 hover:text-white"><X size={18}/></button>
              
              <div className="flex items-center gap-4">
                <textarea
                  ref={inputRef}
                  className={`w-full h-24 bg-neutral-950 border rounded-2xl p-5 outline-none resize-none placeholder:text-neutral-700 text-lg leading-snug transition-all ${isListening ? 'border-emerald-500 animate-pulse text-emerald-400' : 'border-neutral-800 text-neutral-200'}`}
                  placeholder={isListening ? "Listening..." : "Dictate, type, collide logic..."}
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                />
                <button onClick={startListening} disabled={isListening || isProcessing} className={`p-5 h-24 rounded-2xl transition-all ${isListening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-neutral-900 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800'}`} title="Dictate"><Mic size={24} /></button>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center justify-between border-t border-white/5 pt-5">
                <div className="flex gap-2">
                  <button onClick={() => { setActiveMode('angel'); getAnalysis('angel'); }} className="flex gap-2 items-center text-xs p-3 font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/60 rounded-xl border border-cyan-800/60 transition-all"><Sparkles size={16}/> Summon Angel</button>
                  <button onClick={() => { setActiveMode('devil'); getAnalysis('devil'); }} className="flex gap-2 items-center text-xs p-3 font-bold uppercase tracking-widest text-red-400 bg-red-950/30 hover:bg-red-950/60 rounded-xl border border-red-800/60 transition-all"><Flame size={16}/> Summon Devil</button>
                  <button onClick={() => { setActiveMode('zap'); getCollision(); }} className="flex gap-2 items-center text-xs p-3 font-bold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-950/30 hover:bg-fuchsia-950/60 rounded-xl border border-fuchsia-800/60 transition-all"><Zap size={16}/> Particle Collision</button>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => submitAction('/api/interest', 'Saved.')} className="p-3.5 bg-neutral-900 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-xl transition-all"><Star size={18} /></button>
                  <button onClick={() => submitAction('/api/log', 'Logged.')} disabled={isProcessing || !thought} className="p-3.5 px-6 bg-neutral-100 text-neutral-950 hover:bg-white rounded-xl transition-all font-bold disabled:opacity-30"><Send size={18} /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Command Dock */}
        <div className={`w-full ${GLASS_BG} rounded-full shadow-3xl shadow-neutral-950/50 p-3 px-6 flex items-center justify-between relative z-50`}>
          <div className="flex gap-2 items-center">
            <button className="p-4 hover:bg-neutral-900 rounded-full text-neutral-600 hover:text-white transition-all"><Search size={22}/></button>
            <button className="p-4 hover:bg-neutral-900 rounded-full text-neutral-600 hover:text-white transition-all"><BotMessageSquare size={22}/></button>
          </div>

          <motion.button 
            onClick={() => setIsCreationOpen(!isCreationOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-4 ${isCreationOpen ? 'bg-blue-600' : 'bg-neutral-100'} ${isCreationOpen ? 'text-white' : 'text-neutral-950'} hover:bg-white rounded-full transition-all flex gap-1.5 items-center justify-center font-bold tracking-wider ${isCreationOpen ? 'rounded-2xl' : ''}`}>
            <AnimatePresence mode="wait">
              {isCreationOpen ? (
                <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} className='flex gap-1.5 items-center justify-center'><Check size={22}/></motion.div>
              ) : (
                <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}><Plus size={22}/></motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="flex gap-2 items-center">
            <button className="p-4 hover:bg-neutral-900 rounded-full text-neutral-600 hover:text-white transition-all"><Database size={22}/></button>
            <button className="p-4 hover:bg-neutral-900 rounded-full text-neutral-600 hover:text-white transition-all"><Trash2 size={22}/></button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}