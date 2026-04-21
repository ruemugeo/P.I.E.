'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Database, AreaChart, BotMessageSquare, Calendar, CheckCircle2, Circle, Trash2, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  thoughts?: { content: string };
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) });
  };

  const deleteTask = async (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  };

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";
  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-950/30 border-red-900/50';
      case 'medium': return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
      default: return 'text-blue-400 bg-blue-950/30 border-blue-900/50';
    }
  };

  return (
    <main className="min-h-screen bg-starfield text-neutral-100 p-6 lg:p-10 font-mono relative selection:bg-blue-500/30">
      
      {/* SIDE NAVIGATION */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl shadow-ao z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-emerald-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 hover:text-white hover:bg-neutral-900 rounded-xl transition-all"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><CheckCircle2 size={20}/></Link>
          <Link href="/wiki" className="p-3 hover:text-white hover:bg-neutral-900 rounded-xl transition-all"><BotMessageSquare size={20}/></Link>
        </div>
      </motion.nav>

      <div className="lg:ml-28 w-full max-w-6xl mx-auto space-y-12">
        {/* HEADER */}
        <section className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl tracking-tighter font-extrabold bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-600 bg-clip-text text-transparent">Action Matrix</h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><Zap size={14} className="text-emerald-400"/> AI-Extracted Task Queue</p>
          </motion.div>
        </section>

        {/* KANBAN/FLEX LIST */}
        <section className="flex flex-wrap gap-6">
          <AnimatePresence>
            {loading ? (
              <p className="text-neutral-500 animate-pulse">Syncing matrix...</p>
            ) : tasks.length === 0 ? (
              <div className="w-full p-12 border border-white/5 border-dashed rounded-3xl text-center text-neutral-600">No active tasks in the lattice. Log a thought to generate one.</div>
            ) : (
              tasks.map((task) => (
                <motion.div 
                  key={task.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }} 
                  className={`w-full lg:w-[calc(50%-0.75rem)] p-6 bg-neutral-950/80 rounded-3xl border ${task.status === 'completed' ? 'border-neutral-800 opacity-50' : 'border-white/5'} transition-all group flex flex-col justify-between gap-4`}
                >
                  <div className="flex items-start gap-4">
                    <button onClick={() => toggleStatus(task.id, task.status)} className="mt-1 text-neutral-500 hover:text-emerald-400 transition-colors">
                      {task.status === 'completed' ? <CheckCircle2 className="text-emerald-500" size={24}/> : <Circle size={24}/>}
                    </button>
                    <div className="flex-grow">
                      <h3 className={`text-lg font-medium leading-tight ${task.status === 'completed' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>{task.title}</h3>
                      {task.thoughts?.content && (
                        <p className="text-xs text-neutral-600 mt-2 line-clamp-2 italic border-l-2 border-neutral-800 pl-3">"{task.thoughts.content}"</p>
                      )}
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 size={16}/></button>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full border ${priorityColor(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    <span className="text-[10px] text-neutral-600 flex items-center gap-1 font-bold tracking-widest uppercase"><Clock size={12}/> {new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}