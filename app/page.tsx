'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Flame, Send, Database, Tag, Zap, Star, Search, Trash2, Edit2, Check, X, Calendar, Mic } from 'lucide-react';

type Thought = {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  created_at: string;
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const day = d.getDate();
  const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
  const month = d.toLocaleString('default', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
};

export default function Home() {
  const [thought, setThought] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [history, setHistory] = useState<Thought[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false); // NEW: Voice State
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

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

  const submitAction = async (endpoint: string, successMsg: string) => {
    if (!thought) return;
    setIsProcessing(true);
    setStatus('Processing...');
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: thought }),
    });
    
    if (res.ok) {
      setStatus(successMsg);
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
    setStatus('Collision complete.');
    setTimeout(() => setStatus(''), 3000);
    setIsProcessing(false);
  };

  const deleteThought = async (id: number) => {
    if (!confirm("Delete this thought from the lattice?")) return;
    await fetch('/api/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchHistory();
  };

  const saveEdit = async (id: number) => {
    await fetch('/api/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editContent }),
    });
    setEditingId(null);
    fetchHistory();
  };

  // NEW: Voice to Text Function
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Voice input not supported in this browser.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    
    // @ts-ignore - necessary because TypeScript doesn't natively know about webkitSpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening... speak now.');
    };
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setThought(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setStatus('Microphone error or permission denied.');
      setTimeout(() => setStatus(''), 3000);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setStatus('');
    };
    
    recognition.start();
  };

  let processedHistory = history.filter(item => {
    const formattedDate = formatDate(item.created_at).toLowerCase();
    const searchLow = filterText.toLowerCase();
    return (
      item.content.toLowerCase().includes(searchLow) ||
      item.category.toLowerCase().includes(searchLow) ||
      item.sentiment.toLowerCase().includes(searchLow) ||
      formattedDate.includes(searchLow)
    );
  });

  if (sortBy === 'oldest') {
    processedHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortBy === 'newest') {
    processedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy === 'category') {
    processedHistory.sort((a, b) => a.category.localeCompare(b.category));
  }

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
            <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1">Version 1.6 • Voice Active</p>
          </div>
        </motion.div>
        
        <motion.div className="relative group">
          <textarea
            className={`w-full h-36 p-5 bg-neutral-900/50 backdrop-blur-md border rounded-2xl outline-none resize-none transition-all duration-300 placeholder:text-neutral-700 text-lg leading-relaxed shadow-inner ${isListening ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-neutral-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'}`}
            placeholder="Type a thought, tap the mic to speak, or leave blank to Zap..."
            value={thought}
            onChange={(e) => setThought(e.target.value)}
          />
          
          <div className="absolute bottom-4 right-4 flex gap-2">
            {/* NEW: Voice Button */}
            <button 
              onClick={startListening} 
              disabled={isListening || isProcessing} 
              className={`p-2 rounded-xl transition-all ${isListening ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500 animate-pulse' : 'bg-emerald-900/20 text-emerald-500 border border-emerald-900/50 hover:bg-emerald-900/40'}`} 
              title="Dictate Thought"
            >
              <Mic size={18} />
            </button>

            <div className="w-px h-8 bg-neutral-800 mx-1 my-auto hidden sm:block"></div>

            <button onClick={() => getAnalysis('angel')} disabled={isProcessing || !thought} className="p-2 bg-blue-900/30 text-blue-400 border border-blue-900/50 hover:bg-blue-900/50 rounded-xl transition-all disabled:opacity-30" title="Summon Angel"><Sparkles size={18} /></button>
            <button onClick={() => getAnalysis('devil')} disabled={isProcessing || !thought} className="p-2 bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 rounded-xl transition-all disabled:opacity-30" title="Summon Devil"><Flame size={18} /></button>
            <button onClick={getCollision} disabled={isProcessing} className="p-2 bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-900/50 hover:bg-fuchsia-900/50 rounded-xl transition-all" title="Trigger Collision"><Zap size={18} /></button>
            <button onClick={() => submitAction('/api/interest', 'Interest Locked.')} disabled={isProcessing || !thought} className="p-2 bg-amber-900/30 text-amber-400 border border-amber-900/50 hover:bg-amber-900/50 rounded-xl transition-all disabled:opacity-30" title="Save as Interest"><Star size={18} /></button>
            <button onClick={() => submitAction('/api/log', 'Thought Logged.')} disabled={isProcessing || !thought} className="p-2 bg-neutral-200 text-neutral-900 hover:bg-white rounded-xl transition-all font-bold disabled:opacity-30"><Send size={18} /></button>
          </div>
        </motion.div>

        <AnimatePresence>
          {status && <motion.p className="text-sm text-blue-400 animate-pulse">{status}</motion.p>}
          {analysis && <motion.div className="p-6 bg-gradient-to-br from-neutral-900 to-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl whitespace-pre-wrap text-neutral-300">{analysis}</motion.div>}
        </AnimatePresence>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent my-12" />

        <motion.div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-neutral-500 flex items-center gap-2">
              <Database size={18} /> Lattice
            </h2>
            
            <div className="flex w-full sm:w-auto gap-3">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-900/50 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 outline-none focus:border-blue-500/50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="category">By Category</option>
              </select>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter year, tag, keyword..." 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-sm text-neutral-300 outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {processedHistory.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-5 border rounded-2xl transition-colors group relative ${
                    item.category === 'Interest' ? 'bg-amber-900/10 border-amber-900/30' : 
                    item.category === 'Collision' ? 'bg-fuchsia-900/10 border-fuchsia-900/30' :
                    'bg-neutral-900/30 border-neutral-800/50'
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <textarea 
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-neutral-200 outline-none resize-none min-h-[100px]"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item.id)} className="flex items-center gap-1 text-xs bg-green-900/30 text-green-400 px-3 py-1.5 rounded-lg border border-green-900/50 hover:bg-green-900/50"><Check size={14}/> Save</button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs bg-neutral-800 text-neutral-400 px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-700"><X size={14}/> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-neutral-300 pr-12">{item.content}</p>
                      
                      <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }} className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-md"><Edit2 size={16} /></button>
                        <button onClick={() => deleteThought(item.id)} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded-md"><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 items-center">
                    <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      {item.category === 'Interest' ? <Star size={10} className="text-amber-500" /> : <Tag size={10} />}
                      {item.category}
                    </span>
                    <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-full">{item.sentiment}</span>
                    <span className="flex items-center gap-1.5 ml-auto opacity-70">
                      <Calendar size={10} /> {formatDate(item.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}