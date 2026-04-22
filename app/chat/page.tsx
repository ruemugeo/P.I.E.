'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, BookOpen, Zap, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || data.error }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Neural link severed. Could not reach vector database." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      
      {/* DESKTOP SIDE NAVIGATION */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl shadow-2xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><MessageSquare size={20}/></Link>
          <Link href="/wiki" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 text-white flex flex-col items-center gap-1 shadow-inner"><MessageSquare size={20}/></Link>
        <Link href="/wiki" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><BookOpen size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col h-[85vh]">
        <header className="mb-6 shrink-0">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-600 bg-clip-text text-transparent">Recall Matrix</h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-2">
            <Zap size={14} className="text-purple-400"/> Semantic Vector Search Active
          </p>
        </header>

        {/* CHAT WINDOW */}
        <div className={`flex-grow flex flex-col rounded-3xl ${GLASS_BG} overflow-hidden mb-4 relative`}>
          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
            
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                <BrainCircuit size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Query your cognitive stream.</p>
                <p className="text-xs mt-2">Try: "What ideas did I have about X?"</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                key={i} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-neutral-800 text-white rounded-br-none' : 'bg-neutral-900/50 border border-white/5 text-neutral-300 rounded-bl-none'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl bg-neutral-900/50 border border-white/5 rounded-bl-none flex items-center gap-2 text-neutral-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs uppercase tracking-widest">Accessing Vectors...</span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 bg-neutral-950 border-t border-white/5">
            <form onSubmit={handleChat} className="relative w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your memory..."
                className="w-full bg-neutral-900 text-white placeholder-neutral-600 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all border border-white/5"
                disabled={isTyping}
              />
              <button 
                type="submit" 
                disabled={isTyping || !input.trim()} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 disabled:opacity-50 transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}