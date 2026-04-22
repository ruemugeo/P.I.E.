'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, Send, Loader2, BotMessageSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';

type ChatMessage = { role: 'user' | 'pie'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'pie', content: 'Connection established. I have full context of your recent thoughts and active matrix. What do we need to figure out?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) });
      const data = await res.json();
      if (data.reply) setMessages(prev => [...prev, { role: 'pie', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'pie', content: 'System error. Could not query the lattice.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-purple-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><MessageSquare size={20}/></Link>
          <Link href="/wiki" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
        <Link href="/wiki" className="p-3 text-white flex flex-col items-center gap-1 transition-all"><BookOpen size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
        <header className="mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-neutral-100 to-neutral-600 bg-clip-text text-transparent">Cortex Chat</h1>
        </header>

        <div className={`flex-grow flex flex-col gap-4 overflow-y-auto p-6 rounded-3xl ${GLASS_BG} mb-6 custom-scrollbar`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-neutral-800 text-white rounded-br-none border border-white/10' : 'bg-transparent border border-white/5 text-neutral-300 rounded-bl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-purple-400 p-4 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Querying lattice...</div>}
        </div>

        <form onSubmit={sendMessage} className="relative w-full">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask PIE..." className={`w-full p-6 pr-16 rounded-3xl ${GLASS_BG} text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50`} disabled={isTyping} />
          <button type="submit" disabled={isTyping || !input.trim()} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-neutral-100 text-black rounded-2xl hover:bg-white disabled:opacity-50"><Send size={18} /></button>
        </form>
      </div>
    </main>
  );
}