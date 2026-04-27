'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, BookOpen, Zap, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Task = {
  id: string;
  status: string;
  title: string;
};

type TasksResponse = {
  tasks?: Task[];
  task?: Task;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data: TasksResponse) => setTasks(data.tasks || []));
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
      
      {/* DESKTOP SIDE NAVIGATION */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl shadow-2xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><MessageSquare size={20}/></Link>
          <Link href="/wiki" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 text-white flex flex-col items-center gap-1 shadow-inner"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
        <Link href="/wiki" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><BookOpen size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-600 bg-clip-text text-transparent">Action Matrix</h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-2">
            <Zap size={14} className="text-yellow-400"/> Task Engine Online
          </p>
        </header>

        {/* INPUT BOX */}
        <div className="relative w-full">
          <input 
            id="newTaskInput" 
            type="text" 
            placeholder="Manual task entry (Press Enter to save)..." 
            className={`w-full p-6 pr-16 rounded-3xl ${GLASS_BG} text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all`} 
            disabled={isAdding}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                setIsAdding(true);
                const title = e.currentTarget.value;
                e.currentTarget.value = ''; // clear immediately for UX
                
                try {
                  const res = await fetch('/api/tasks', { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({ title, priority: 'medium' }) 
                  });
                  const { task } = (await res.json()) as TasksResponse;
                  if (task) {
                    setTasks((prev) => [task, ...prev]);
                  }
                } finally {
                  setIsAdding(false);
                }
              }
            }}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-500">
            {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          </div>
        </div>

        {/* TASK LIST */}
        <div className="flex flex-col gap-3 mt-4">
          <h3 className="text-neutral-500 uppercase text-xs font-bold tracking-widest pl-2 mb-2">Pending Protocol</h3>
          {tasks.map((task) => (
            <motion.div layout key={task.id} className={`group flex items-center gap-4 p-5 rounded-2xl ${GLASS_BG} ${task.status === 'done' ? 'opacity-40' : 'hover:border-blue-500/30 transition-all'}`}>
              <button onClick={() => toggleTask(task.id, task.status)} className="text-neutral-500 hover:text-white transition-colors flex-shrink-0">
                {task.status === 'done' ? <CheckCircle2 size={24} className="text-blue-500" /> : <div className="w-6 h-6 rounded-full border-2 border-neutral-600 group-hover:border-blue-400 transition-colors"></div>}
              </button>
              
              <span className={`text-sm flex-grow ${task.status === 'done' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                {task.title}
              </span>
              
              <button 
                onClick={async () => {
                  setTasks(tasks.filter(t => t.id !== task.id));
                  await fetch('/api/tasks', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: task.id }) });
                }} 
                className="text-red-500/0 group-hover:text-red-500/80 transition-colors text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded bg-red-500/10 opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <div className="p-8 text-center text-neutral-600 text-sm border border-dashed border-white/10 rounded-2xl">
              Matrix is empty. All protocols complete.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
