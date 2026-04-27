'use client';

import { useState } from 'react';
import { Zap, Plus, Paperclip, Search, Clock, Trash2, Copy } from 'lucide-react';

type Thought = {
  id: string;
  content: string;
  created_at: string;
};

export default function HomePage() {
  const [thoughts] = useState<Thought[]>([]);
  const [input, setInput] = useState('');

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white mb-2">Neural Records</h1>
        <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold uppercase tracking-widest">
          <Zap size={14} fill="currentColor" /> Synaptic Link Online
        </div>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
        <input
          placeholder="SEARCH NEURAL RECORDS..."
          className="w-full bg-[#0a0a0c] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-white/20 transition-all"
        />
      </div>

      <section className="bg-[#0a0a0c] border border-white/5 rounded-[2rem] p-6 mb-12">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Log a thought (Use # for interests)..."
          className="w-full bg-transparent text-neutral-300 placeholder-neutral-700 outline-none resize-none min-h-[80px] mb-4"
        />
        <div className="flex justify-end gap-3">
          <button className="p-3 bg-neutral-900 rounded-xl text-neutral-500 hover:text-white transition-all">
            <Paperclip size={20} />
          </button>
          <button className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all">
            <Plus size={20} />
          </button>
        </div>
      </section>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-4">
          Pending Insights
        </h3>

        {thoughts.length === 0 && (
          <div className="border border-dashed border-white/5 rounded-[2rem] p-12 flex items-center justify-center text-neutral-700 text-sm italic">
            Neural buffer is empty.
          </div>
        )}

        {thoughts.map((thought) => (
          <div key={thought.id} className="group bg-[#0a0a0c] border border-white/5 rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="flex items-center gap-2 text-[10px] text-neutral-600 font-bold">
                <Clock size={10} /> {new Date(thought.created_at).toLocaleTimeString()}
              </span>
              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                <Copy size={14} className="text-neutral-600 hover:text-white cursor-pointer" />
                <Trash2 size={14} className="text-neutral-600 hover:text-red-500 cursor-pointer" />
              </div>
            </div>
            <p className="text-neutral-300 leading-relaxed">{thought.content}</p>
            <div className="flex gap-4 mt-6 pt-4 border-t border-white/5">
              <button className="text-[10px] font-black text-emerald-500 hover:opacity-70">ANGEL</button>
              <button className="text-[10px] font-black text-rose-500 hover:opacity-70">DEVIL</button>
              <button className="text-[10px] font-black text-yellow-500 hover:opacity-70">ZAP</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
