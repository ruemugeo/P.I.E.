'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, Circle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tasks').then(res => res.json()).then(data => setTasks(data.tasks || []));
  }, []);

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'todo' ? 'done' : 'todo';
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
  };

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><MessageSquare size={20}/></Link>
        </div>
      </motion.nav>

      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-600">Action Matrix</h1>
        </header>

        <div className="flex flex-col gap-3">
          {tasks.length === 0 && <p className="text-neutral-500">No active tasks found in the lattice.</p>}
          {tasks.map(task => (
            <div key={task.id} className={`flex items-center gap-4 p-4 rounded-xl ${GLASS_BG} ${task.status === 'done' ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleTask(task.id, task.status)} className="text-neutral-400 hover:text-white transition-colors">
                {task.status === 'done' ? <CheckCircle size={24} className="text-green-500" /> : <Circle size={24} />}
              </button>
              <span className={`text-sm ${task.status === 'done' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>{task.title}</span>
              <span className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-1 rounded ${task.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neutral-800 text-neutral-400'}`}>{task.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}