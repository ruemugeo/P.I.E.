'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, BookOpen, Plus, Save } from 'lucide-react';
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
          <Link href="/wiki" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
        <Link href="/wiki" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-600">Action Matrix</h1>
        </header>

        <div className="flex gap-4 mb-4">
          <input id="newTaskInput" type="text" placeholder="Manual task entry..." className={`flex-grow p-4 rounded-xl ${GLASS_BG} text-white focus:outline-none`} onKeyDown={async (e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              const res = await fetch('/api/tasks', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ title: e.currentTarget.value, priority: 'medium' }) });
              const { task } = await res.json();
              setTasks([task, ...tasks]);
              e.currentTarget.value = '';
            }
          }}/>
        </div>

        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <motion.div layout key={task.id} className={`group flex items-center gap-4 p-4 rounded-xl ${GLASS_BG} ${task.status === 'done' ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleTask(task.id, task.status)} className="text-neutral-400 hover:text-white transition-colors">
                {task.status === 'done' ? <CheckCircle2 size={24} className="text-green-500" /> : <div className="w-6 h-6 rounded-full border-2 border-neutral-600"></div>}
              </button>
              <span className={`text-sm flex-grow ${task.status === 'done' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>{task.title}</span>
              <button onClick={async () => {
                await fetch('/api/tasks', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: task.id }) });
                setTasks(tasks.filter(t => t.id !== task.id));
              }} className="text-red-500/0 group-hover:text-red-500/50 hover:!text-red-400 transition-colors text-xs">DELETE</button>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}