'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Brain, Sparkles, History, MessageSquare, Plus } from 'lucide-react';

export default function PieDashboard() {
  const [input, setInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle logging a new thought
  const handleLogThought = async () => {
    if (!input.trim()) return;
    setIsLogging(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      
      if (!res.ok) throw new Error('Failed to log');
      
      setInput('');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
    } finally {
      setIsLogging(false);
    }
  };

  // Handle chatting with memories
  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't access your memories right now." }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <header className="max-w-4xl mx-auto flex items-center gap-3 mb-12">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Brain size={32} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">PIE <span className="text-blue-500">Cognitive Engine</span></h1>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Thought Logger */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-blue-400 font-medium">
            <Plus size={20} />
            <h2>Log New Thought</h2>
          </div>
          
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's on your mind? I'll categorize and embed it..."
              className="w-full h-48 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-lg"
            />
            <button
              onClick={handleLogThought}
              disabled={isLogging || !input.trim()}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
            >
              {isLogging ? <Sparkles className="animate-spin" size={18} /> : <Send size={18} />}
              {isLogging ? 'Processing...' : 'Log'}
            </button>
          </div>
          
          {status === 'success' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-sm">
              ✨ Thought embedded and stored in Supabase.
            </motion.p>
          )}
        </section>

        {/* RIGHT COLUMN: AI Chat */}
        <section className="flex flex-col h-[600px] bg-[#141414] rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-[#1a1a1a]">
            <MessageSquare size={20} className="text-purple-400" />
            <h2 className="font-medium">Recall & Context</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center px-8">
                <History size={48} className="mb-4 opacity-20" />
                <p>Ask about your previous thoughts. I'll search your vector database for context.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  m.role === 'user' ? 'bg-blue-600 rounded-tr-none' : 'bg-[#2a2a2a] rounded-tl-none'
                }`}>
                  <p className="text-sm">{m.content}</p>
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-[#1a1a1a]">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask your PIE..."
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-full px-5 py-3 pr-12 outline-none focus:border-purple-500 transition-all"
              />
              <button 
                onClick={handleChat}
                className="absolute right-2 top-1.5 p-2 text-purple-400 hover:text-white transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}