'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Copy, Trash2, Edit2, 
  Clock, Paperclip, Zap, Shield, AlertTriangle, 
  Loader2, Image as ImageIcon, FileText 
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [thoughts, setThoughts] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch & Filter
  useEffect(() => {
    fetchThoughts();
  }, []);

  const fetchThoughts = async () => {
    const res = await fetch('/api/thoughts');
    const data = await res.json();
    setThoughts(data);
  };

  const filteredThoughts = thoughts.filter(t => 
    (t.content.toLowerCase().includes(search.toLowerCase())) &&
    (filter === 'all' || t.category === filter)
  );

  // 2. Actions
  const handleSave = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    
    // Check if it's an interest (starts with #)
    const isInterest = input.startsWith('#');
    const category = isInterest ? 'interest' : 'thought';
    const cleanInput = isInterest ? input.slice(1).trim() : input;

    const res = await fetch('/api/thoughts', {
      method: 'POST',
      body: JSON.stringify({ content: cleanInput, category })
    });

    if (res.ok) {
      toast.success(isInterest ? 'Interest Profile Updated' : 'Thought Embedded');
      setInput('');
      fetchThoughts();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/thoughts?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setThoughts(thoughts.filter(t => t.id !== id));
      toast.error('Data Purged');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied to Neural Buffer');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    toast.promise(async () => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      fetchThoughts();
    }, {
      loading: 'Analyzing Document...',
      success: 'Knowledge Base Updated',
      error: 'Upload Failed'
    });
  };

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-4 lg:p-10 font-mono">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* Search & Filter Header */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH NEURAL RECORDS..." 
              className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <select 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest outline-none"
          >
            <option value="all">All Records</option>
            <option value="thought">Thoughts</option>
            <option value="task">Tasks</option>
            <option value="research">Research</option>
          </select>
        </div>

        {/* Input Terminal */}
        <form onSubmit={handleSave} className="relative group">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="LOG A THOUGHT (USE # FOR INTERESTS)..."
            className="w-full bg-neutral-950 border border-white/10 rounded-[2rem] p-6 pr-20 min-h-[120px] text-lg outline-none focus:border-blue-500/30 transition-all resize-none shadow-2xl"
          />
          <div className="absolute right-4 bottom-4 flex gap-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-neutral-900 rounded-xl border border-white/5 text-neutral-400 hover:text-white"
            >
              <Paperclip size={20} />
            </button>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
            <button 
              disabled={loading}
              className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </form>

        {/* Thoughts Feed */}
        <div className="space-y-4">
          <AnimatePresence mode='popLayout'>
            {filteredThoughts.filter(t => t.category !== 'interest').map((thought) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={thought.id}
                className="group p-6 rounded-[2rem] bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(thought.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {thought.file_url && <span className="text-blue-500 flex items-center gap-1"><FileText size={10}/> Attached</span>}
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500">
                    <button onClick={() => copyToClipboard(thought.content)}><Copy size={16} /></button>
                    <button onClick={() => handleDelete(thought.id)} className="hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>

                <p className="text-neutral-200 leading-relaxed">{thought.content}</p>

                {/* Lenses */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                  <LensButton icon={<Shield size={12}/>} label="ANGEL" color="text-emerald-500" />
                  <LensButton icon={<AlertTriangle size={12}/>} label="DEVIL" color="text-rose-500" />
                  <LensButton icon={<Zap size={12}/>} label="ZAP" color="text-yellow-500" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function LensButton({ icon, label, color }) {
  return (
    <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black tracking-tighter hover:bg-white/10 transition-all ${color}`}>
      {icon} {label}
    </button>
  );
}