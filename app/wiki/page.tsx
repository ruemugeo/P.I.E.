'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, BookOpen, Plus, Save } from 'lucide-react';
import Link from 'next/link';

export default function WikiPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/api/wiki').then(res => res.json()).then(data => setPages(data.pages || []));
  }, []);

  const savePage = async () => {
    if (!title || !content) return;
    const res = await fetch('/api/wiki', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({title, content})});
    const { page } = await res.json();
    setPages([page, ...pages]);
    setIsEditing(false); setTitle(''); setContent('');
  };

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-emerald-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><MessageSquare size={20}/></Link>
          <Link href="/wiki" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header className="flex justify-between items-end">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-100 to-emerald-600 bg-clip-text text-transparent">Wiki</h1>
          <button onClick={() => setIsEditing(!isEditing)} className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center gap-2"><Plus size={16}/> New Note</button>
        </header>

        {isEditing && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-3xl ${GLASS_BG} flex flex-col gap-4`}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document Title" className="bg-transparent text-2xl font-bold focus:outline-none text-white placeholder-neutral-600"/>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Markdown supported..." className="bg-transparent h-40 focus:outline-none text-neutral-300 resize-none"/>
            <button onClick={savePage} className="self-end p-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 flex items-center gap-2"><Save size={16}/> Save Document</button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map(page => (
            <motion.div key={page.id} whileHover={{ scale: 1.02 }} className={`p-6 rounded-3xl ${GLASS_BG} cursor-pointer`}>
              <h3 className="text-xl font-bold mb-2 text-white">{page.title}</h3>
              <p className="text-neutral-400 text-sm line-clamp-3">{page.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}