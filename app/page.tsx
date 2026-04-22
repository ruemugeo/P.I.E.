'use client';

<<<<<<< HEAD
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  BrainCircuit, Sparkles, Flame, Send, Database, Tag, Zap, Star,
  Search, Trash2, Edit2, Check, X, Calendar, Mic, Activity, Plus,
  Moon, Eye, ChevronDown, Filter, Clock
} from 'lucide-react';

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

type Thought = {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  created_at: string;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatRelative = (dateString: string) => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'Interest':
      return {
        pill: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
        glow: 'rgba(245, 158, 11, 0.12)',
        icon: <Star size={13} className="text-amber-400" />,
      };
    case 'Collision':
      return {
        pill: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/25',
        glow: 'rgba(217, 70, 239, 0.15)',
        icon: <Zap size={13} className="text-fuchsia-400" />,
      };
    case 'Synthesis':
      return {
        pill: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
        glow: 'rgba(6, 182, 212, 0.12)',
        icon: <Sparkles size={13} className="text-cyan-400" />,
      };
    default:
      return {
        pill: 'text-neutral-400 bg-white/4 border-white/8',
        glow: 'rgba(255,255,255,0.04)',
        icon: <BrainCircuit size={13} className="text-neutral-400" />,
      };
  }
};

const getCategoryCardIcon = (category: string) => {
  switch (category) {
    case 'Synthesis': return <Sparkles className="text-cyan-400" size={16} />;
    case 'Collision': return <Zap className="text-fuchsia-400" size={16} />;
    case 'Interest': return <Star className="text-amber-400" size={16} />;
    default: return <BrainCircuit className="text-blue-400" size={16} />;
  }
};

const getSentimentLabel = (sentiment: string) => {
  if (sentiment.includes('👻')) return { label: 'Ghost', icon: <Activity size={11} className="text-cyan-400" /> };
  if (sentiment.includes('analytical')) return { label: 'Analytical', icon: <BrainCircuit size={11} className="text-blue-400" /> };
  if (sentiment.includes('intense')) return { label: 'Intense', icon: <Zap size={11} className="text-purple-400" /> };
  return { label: sentiment.slice(0, 16), icon: <Tag size={11} className="text-neutral-500" /> };
};

// ─── HEATMAP ─────────────────────────────────────────────────────────────────

function MentalHeatmap({ history }: { history: Thought[] }) {
  const daysToShow = 28;
  const stats = useMemo(() => {
    const data: Array<{ key: string; count: number; type: string }> = [];
    const now = new Date();
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayThoughts = history.filter(t => t.created_at.startsWith(dateKey));
      const count = dayThoughts.length;
      let type = 'empty';
      if (count > 0) {
        if (dayThoughts.some(t => t.category === 'Collision')) type = 'collision';
        else if (dayThoughts.some(t => t.sentiment.includes('intense'))) type = 'intense';
        else type = 'active';
      }
      data.push({ key: dateKey, count, type });
    }
    return data.reverse();
  }, [history]);

  const colorMap: Record<string, string> = {
    empty: 'bg-white/4',
    active: 'bg-blue-500/60',
    intense: 'bg-red-500/70',
    collision: 'bg-fuchsia-500/80',
  };

  const heightMap: Record<string, string> = {
    empty: 'h-2',
    active: 'h-5',
    intense: 'h-7',
    collision: 'h-8',
  };

  return (
    <div className="flex gap-[3px] items-end h-10">
      {stats.map((info, i) => (
        <motion.div
          key={info.key}
          title={`${info.key}: ${info.count} thought${info.count !== 1 ? 's' : ''}`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: i * 0.015, type: 'spring', stiffness: 300, damping: 20 }}
          className={`flex-1 rounded-[2px] ${colorMap[info.type]} ${heightMap[info.type]} origin-bottom cursor-pointer hover:opacity-100 transition-opacity ${info.type === 'empty' ? 'opacity-40' : 'opacity-75 hover:opacity-100'}`}
        />
      ))}
    </div>
  );
}

// ─── STAT PILL ────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold tracking-tight ${color}`}>{value}</span>
      <span className="text-[10px] text-neutral-600 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── THOUGHT CARD ─────────────────────────────────────────────────────────────

type ThoughtCardProps = {
  item: Thought;
  index: number;
  editingId: number | null;
  editContent: string;
  onEdit: (id: number, content: string) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
  onDelete: (id: number) => void;
  onEditChange: (v: string) => void;
};

function ThoughtCard({ item, index, editingId, editContent, onEdit, onSave, onCancel, onDelete, onEditChange }: ThoughtCardProps) {
  const cat = getCategoryStyle(item.category);
  const sent = getSentimentLabel(item.sentiment);
  const isEditing = editingId === item.id;

  // Assign varying bento sizes in a repeating pattern
  const sizeClasses = [
    'sm:col-span-2 sm:row-span-1', // wide
    'sm:col-span-1 sm:row-span-1', // normal
    'sm:col-span-1 sm:row-span-1', // normal
    'sm:col-span-1 sm:row-span-1', // normal
    'sm:col-span-1 sm:row-span-1', // normal
    'sm:col-span-2 sm:row-span-1', // wide
  ];
  const sizeClass = sizeClasses[index % sizeClasses.length];

  return (
    <motion.div
      layout
      initial={{ y: 24, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -16, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: index * 0.04 }}
      whileHover={{ y: -3, boxShadow: `0 20px 60px -10px ${cat.glow}, 0 0 0 1px rgba(255,255,255,0.07)` }}
      className={`relative group p-5 rounded-2xl border border-white/6 bg-white/[0.03] backdrop-blur-xl overflow-hidden ${sizeClass}`}
      style={{
        boxShadow: `0 8px 32px -8px ${cat.glow}, 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      {/* Ambient glow orb */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: cat.glow.replace('0.12', '1').replace('0.15', '1') }}
      />

      {isEditing ? (
        <div className="space-y-3 relative z-10">
          <textarea
            className="w-full bg-white/4 border border-white/10 rounded-xl p-4 text-neutral-200 outline-none resize-none min-h-[120px] text-sm font-light leading-relaxed focus:border-blue-500/40 transition-colors"
            value={editContent}
            onChange={e => onEditChange(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => onSave(item.id)} className="text-xs bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/20 hover:bg-green-500/20 flex gap-1.5 items-center transition-colors">
              <Check size={12} /> Save
            </button>
            <button onClick={onCancel} className="text-xs bg-white/4 text-neutral-400 px-4 py-2 rounded-lg border border-white/8 hover:bg-white/8 flex gap-1.5 items-center transition-colors">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Card Header */}
          <div className="flex items-start gap-3 mb-4 relative z-10">
            <div className="p-2 rounded-xl bg-white/5 border border-white/8 flex-shrink-0">
              {getCategoryCardIcon(item.category)}
            </div>
            <p className="flex-grow text-neutral-200 text-sm leading-relaxed font-light pr-12">
              {item.content}
            </p>
          </div>

          {/* Action buttons (show on hover) */}
          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={() => onEdit(item.id, item.content)}
              className="p-1.5 text-neutral-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Pill Tags Footer */}
          <div className="flex flex-wrap gap-1.5 items-center border-t border-white/6 pt-4 relative z-10">
            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${cat.pill}`}>
              {cat.icon} {item.category}
            </span>
            <span className="px-2.5 py-1 rounded-full border border-white/8 bg-white/4 text-[10px] text-neutral-500 flex items-center gap-1.5">
              {sent.icon} {sent.label}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-neutral-600 group-hover:text-neutral-500 transition-colors">
              <Clock size={10} /> {formatRelative(item.created_at)}
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── FLOATING DOCK ────────────────────────────────────────────────────────────

type DockProps = {
  thought: string;
  setThought: (v: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  activeMode: 'neutral' | 'angel' | 'devil' | 'zap';
  onAngel: () => void;
  onDevil: () => void;
  onZap: () => void;
  onInterest: () => void;
  onSend: () => void;
  onListen: () => void;
};

function FloatingDock(props: DockProps) {
  const { thought, setThought, isProcessing, isListening, activeMode, onAngel, onDevil, onZap, onInterest, onSend, onListen } = props;
  const [showActions, setShowActions] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const dockBorderStyle = useMemo(() => {
    if (activeMode === 'angel') return { border: '1px solid rgba(6,182,212,0.6)', boxShadow: '0 0 30px 4px rgba(6,182,212,0.15), 0 0 60px 8px rgba(6,182,212,0.06), inset 0 0 30px rgba(6,182,212,0.04)' };
    if (activeMode === 'devil') return { border: '1px solid rgba(239,68,68,0.6)', boxShadow: '0 0 30px 4px rgba(239,68,68,0.18), 0 0 60px 8px rgba(239,68,68,0.08), inset 0 0 30px rgba(239,68,68,0.04)' };
    if (activeMode === 'zap') return { border: '1px solid rgba(217,70,239,0.5)', boxShadow: '0 0 30px 4px rgba(217,70,239,0.12), 0 0 60px 8px rgba(217,70,239,0.05)' };
    return { border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' };
  }, [activeMode]);

  const actionButtons = [
    { id: 'angel', label: 'Angel', icon: <Sparkles size={14} />, color: 'text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/20', onClick: onAngel },
    { id: 'devil', label: 'Devil', icon: <Flame size={14} />, color: 'text-red-400 hover:bg-red-500/10 border-red-500/20', onClick: onDevil },
    { id: 'zap', label: 'Collide', icon: <Zap size={14} />, color: 'text-fuchsia-400 hover:bg-fuchsia-500/10 border-fuchsia-500/20', onClick: onZap },
    { id: 'star', label: 'Interest', icon: <Star size={14} />, color: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20', onClick: onInterest },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-6 px-4 pointer-events-none">
      {/* Action Tray */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto mb-2 flex gap-2 p-2 rounded-2xl bg-neutral-950/90 backdrop-blur-2xl border border-white/8"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
          >
            {actionButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => { btn.onClick(); setShowActions(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white/3 text-xs font-medium tracking-wide transition-all ${btn.color}`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dock */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 28 }}
        className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-neutral-950/85 backdrop-blur-3xl overflow-hidden transition-all duration-500"
        style={dockBorderStyle}
      >
        {/* Mode indicator strip */}
        <AnimatePresence>
          {activeMode !== 'neutral' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                activeMode === 'angel' ? 'bg-cyan-500/8 text-cyan-400 border-b border-cyan-500/15' :
                activeMode === 'devil' ? 'bg-red-500/8 text-red-400 border-b border-red-500/15' :
                'bg-fuchsia-500/8 text-fuchsia-400 border-b border-fuchsia-500/15'
              }`}
            >
              {activeMode === 'angel' && <><Sparkles size={10} /> Angel Mode Active</>}
              {activeMode === 'devil' && <><Flame size={10} /> Devil Mode Active</>}
              {activeMode === 'zap' && <><Zap size={10} /> Collider Active</>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 p-3">
          {/* Text Input */}
          <textarea
            ref={textRef}
            className={`flex-grow bg-transparent outline-none resize-none text-sm leading-relaxed pt-1 pb-1 min-h-[40px] max-h-32 placeholder:text-neutral-700 transition-colors ${
              isListening ? 'text-emerald-300' : 'text-neutral-200'
            }`}
            placeholder={isListening ? 'Listening…' : 'Transmit thought…'}
            value={thought}
            onChange={e => setThought(e.target.value)}
            rows={1}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 128) + 'px';
            }}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Mic */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onListen}
              disabled={isListening}
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/30'
                  : 'bg-white/4 text-neutral-500 hover:text-neutral-300 hover:bg-white/8 border border-white/6'
              }`}
            >
              <Mic size={15} />
            </motion.button>

            {/* Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActions(v => !v)}
              className={`p-2.5 rounded-xl border transition-all ${
                showActions
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-white/4 text-neutral-500 hover:text-neutral-300 hover:bg-white/8 border border-white/6'
              }`}
            >
              <motion.div animate={{ rotate: showActions ? 180 : 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                <ChevronDown size={15} />
              </motion.div>
            </motion.button>

            {/* Send */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onSend}
              disabled={isProcessing || !thought.trim()}
              className="p-2.5 bg-neutral-100 text-neutral-950 hover:bg-white rounded-xl font-bold disabled:opacity-25 transition-all flex items-center"
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ANALYSIS PANEL ───────────────────────────────────────────────────────────

function AnalysisPanel({ analysis, status, activeMode }: { analysis: string; status: string; activeMode: string }) {
  const borderColor = activeMode === 'angel' ? 'border-cyan-500/40' : activeMode === 'devil' ? 'border-red-500/40' : 'border-fuchsia-500/40';
  const glowStyle = activeMode === 'angel'
    ? { boxShadow: '0 0 40px rgba(6,182,212,0.12), inset 0 0 40px rgba(6,182,212,0.03)' }
    : activeMode === 'devil'
    ? { boxShadow: '0 0 40px rgba(239,68,68,0.14), inset 0 0 40px rgba(239,68,68,0.04)' }
    : { boxShadow: '0 0 40px rgba(217,70,239,0.1)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 250, damping: 24 }}
      className={`w-full max-w-7xl mx-auto mb-10 p-6 rounded-2xl bg-white/[0.025] backdrop-blur-xl border ${borderColor}`}
      style={glowStyle}
    >
      {status && (
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`w-1.5 h-1.5 rounded-full ${activeMode === 'angel' ? 'bg-cyan-400' : activeMode === 'devil' ? 'bg-red-400' : 'bg-blue-400'}`}
          />
          <span className="text-xs text-neutral-500 tracking-wide">{status}</span>
        </div>
      )}
      {analysis && (
        <>
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/6">
            {activeMode === 'angel' ? (
              <><Sparkles size={14} className="text-cyan-400" /><span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Angel Synthesis</span></>
            ) : activeMode === 'devil' ? (
              <><Flame size={14} className="text-red-400" /><span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Devil's Advocate</span></>
            ) : activeMode === 'zap' ? (
              <><Zap size={14} className="text-fuchsia-400" /><span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest">Particle Collision</span></>
            ) : (
              <><BrainCircuit size={14} className="text-blue-400" /><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Neural Synthesis</span></>
            )}
          </div>
          <p className="text-neutral-300 text-sm leading-loose whitespace-pre-wrap font-light">
            {analysis}
          </p>
        </>
      )}
    </motion.div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [thought, setThought] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [history, setHistory] = useState<Thought[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMode, setActiveMode] = useState<'neutral' | 'angel' | 'devil' | 'zap'>('neutral');

  useEffect(() => { fetchHistory(); }, []);

  // ── Existing Logic (preserved exactly) ─────────────────────────────────────

  const fetchHistory = async () => {
    const res = await fetch('/api/history');
    if (res.ok) { const data = await res.json(); setHistory(data.thoughts); }
  };

  const submitAction = async (endpoint: string, successMsg: string) => {
    if (!thought) return; setIsProcessing(true); setStatus('Locking logic...');
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: thought }) });
    if (res.ok) { setStatus(successMsg); setThought(''); setActiveMode('neutral'); fetchHistory(); }
    setTimeout(() => setStatus(''), 3000); setIsProcessing(false);
  };

  const getAnalysis = async (mode: 'angel' | 'devil') => {
    if (!thought) return; setIsProcessing(true); setStatus(`Summoning the ${mode}...`); setAnalysis('');
    const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: thought, mode }) });
    const data = await res.json(); setAnalysis(data.analysis); setStatus(''); setIsProcessing(false);
  };

  const getCollision = async () => {
    setIsProcessing(true); setStatus('Triggering collision...'); setAnalysis('');
    const res = await fetch('/api/collide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentThought: thought }) });
    const data = await res.json(); setAnalysis(data.analysis); fetchHistory(); setStatus('Sync complete.');
    setTimeout(() => setStatus(''), 3000); setIsProcessing(false);
  };

  const deleteThought = async (id: number) => {
    if (!confirm('Erase this thought from memory?')) return;
    await fetch('/api/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchHistory();
  };

  const saveEdit = async (id: number) => {
    await fetch('/api/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content: editContent }) });
    setEditingId(null); fetchHistory();
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setStatus('Voice not supported.'); return; }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => { setIsListening(true); setStatus('Listening...'); };
    recognition.onresult = (event: any) => { setThought(Array.from(event.results).map((r: any) => r[0].transcript).join('')); };
    recognition.onend = () => { setIsListening(false); setStatus(''); };
    recognition.start();
  };

  // ── Derived State ────────────────────────────────────────────────────────────

  let processedHistory = history.filter(item => {
    const searchLow = filterText.toLowerCase();
    return (
      item.content.toLowerCase().includes(searchLow) ||
      item.category.toLowerCase().includes(searchLow) ||
      item.sentiment.toLowerCase().includes(searchLow) ||
      formatDate(item.created_at).toLowerCase().includes(searchLow)
    );
  });
  if (sortBy === 'oldest') processedHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  else if (sortBy === 'newest') processedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (sortBy === 'category') processedHistory.sort((a, b) => a.category.localeCompare(b.category));

  const totalThoughts = history.length;
  const collisions = history.filter(t => t.category === 'Collision').length;
  const interests = history.filter(t => t.category === 'Interest').length;
  const syntheses = history.filter(t => t.category === 'Synthesis').length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100 selection:bg-blue-500/20 pb-40">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/4 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/4 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-cyan-600/3 blur-[100px]" />
=======
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Database, CheckCircle2, MessageSquare, BookOpen, Plus, Save, Zap, Loader2, Send } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [content, setContent] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [thoughts, setThoughts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(data => setThoughts(data.thoughts || []));
  }, []);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsLogging(true);
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setContent('');
      // Refresh history
      fetch('/api/history').then(res => res.json()).then(data => setThoughts(data.thoughts || []));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLogging(false);
    }
  };

  const GLASS_BG = "bg-neutral-950/60 backdrop-blur-xl border border-white/10";

  return (
    <main className="min-h-screen bg-[#060608] text-neutral-100 p-6 lg:p-10 font-mono relative pb-24 lg:pb-10">
      
      {/* DESKTOP SIDE NAVIGATION */}
      <motion.nav initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`fixed left-4 top-1/2 -translate-y-1/2 w-20 py-8 flex flex-col items-center gap-10 ${GLASS_BG} rounded-3xl shadow-2xl z-50 hidden lg:flex`}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="p-3 bg-neutral-900 rounded-xl border border-white/5"><BrainCircuit className="text-blue-400" size={24}/></motion.div>
        <div className="flex flex-col gap-8 text-neutral-600">
          <Link href="/" className="p-3 text-white bg-neutral-800 rounded-xl transition-all shadow-inner"><Database size={20}/></Link>
          <Link href="/tasks" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><CheckCircle2 size={20}/></Link>
          <Link href="/chat" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><MessageSquare size={20}/></Link>
          <Link href="/wiki" className="p-3 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"><BookOpen size={20}/></Link>
        </div>
      </motion.nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full p-4 bg-[#060608]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden flex justify-around items-center text-neutral-500 pb-8">
        <Link href="/" className="p-3 text-white flex flex-col items-center gap-1 shadow-inner"><Database size={20}/></Link>
        <Link href="/tasks" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><CheckCircle2 size={20}/></Link>
        <Link href="/chat" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><MessageSquare size={20}/></Link>
        <Link href="/wiki" className="p-3 hover:text-white flex flex-col items-center gap-1 transition-all"><BookOpen size={20}/></Link>
      </nav>

      <div className="lg:ml-28 w-full max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-600 bg-clip-text text-transparent">Lattice</h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-2">
            <Zap size={14} className="text-yellow-400"/> Core Online
          </p>
        </header>

        {/* INPUT BOX */}
        <form onSubmit={handleLog} className="relative w-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Log a thought, idea, or task..."
            className={`w-full h-32 p-6 pr-16 rounded-3xl ${GLASS_BG} text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none`}
            disabled={isLogging}
          />
          <button type="submit" disabled={isLogging || !content.trim()} className="absolute right-4 bottom-4 p-3 bg-neutral-100 text-black rounded-2xl hover:bg-white disabled:opacity-50 transition-all shadow-xl">
            {isLogging ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        {/* RECENT THOUGHTS */}
        <div className="flex flex-col gap-4">
          <h3 className="text-neutral-500 uppercase text-xs font-bold tracking-widest pl-2">Recent Logs</h3>
          {thoughts.map((t: any) => (
            <div key={t.id} className={`p-5 rounded-2xl ${GLASS_BG}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs px-2 py-1 bg-neutral-900 rounded border border-white/5 text-neutral-400">{t.category}</span>
                <span className="text-xs text-neutral-500">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed">{t.content}</p>
            </div>
          ))}

          <button 
          onClick={async () => {
            const newPage = (thoughts.length / 20); // assuming 20 limit
            const res = await fetch(`/api/history?page=${newPage}`);
            const data = await res.json();
            setThoughts([...thoughts, ...data.thoughts]);
          }}
          className="w-full p-4 mt-4 rounded-2xl bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white transition-all"
        >
          Load History
        </button>
        </div>
>>>>>>> 324b17d8785eb104c7d2780e0284548b35e91866
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ═══ HEADER BENTO ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
        >
          {/* Brand Cell */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.025] border border-white/6 backdrop-blur-xl flex items-center gap-5"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex-shrink-0"
            >
              <BrainCircuit className="text-blue-400" size={28} />
            </motion.div>
            <div className="flex-grow min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
                Cognitive Engine
              </h1>
              <p className="text-xs text-neutral-600 tracking-widest uppercase mt-0.5">
                Personal Intelligence Lattice · v2.0
              </p>
            </div>
            <div className="hidden sm:flex gap-6 items-center border-l border-white/6 pl-6 flex-shrink-0">
              <StatPill label="Thoughts" value={totalThoughts} color="text-neutral-300" />
              <StatPill label="Collisions" value={collisions} color="text-fuchsia-400" />
              <StatPill label="Interests" value={interests} color="text-amber-400" />
              <StatPill label="Syntheses" value={syntheses} color="text-cyan-400" />
            </div>
          </div>

          {/* Heatmap Cell */}
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/6 backdrop-blur-xl"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-neutral-500" />
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">Mental Activity</span>
              </div>
              <span className="text-[10px] text-neutral-700 font-mono">28d</span>
            </div>
            <MentalHeatmap history={history} />
            <div className="flex justify-between mt-3">
              <div className="flex items-center gap-1.5 text-[9px] text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-sm bg-blue-500/60 inline-block" />Active
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-sm bg-fuchsia-500/80 inline-block" />Collision
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-sm bg-red-500/70 inline-block" />Intense
              </div>
            </div>
          </div>
        </motion.div>

        {/* Night Shift + Dual Stream Row */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 24 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {/* Night Shift Bento */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <Moon size={13} className="text-indigo-400" />
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">Night Shift</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Autonomous synthesis runs while you rest. Dream collisions fire at 03:00.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2.5 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-[10px] text-indigo-400/70 font-mono">STANDBY</span>
            </div>
          </div>

          {/* Angel Stream */}
          <div className="p-5 rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/15 backdrop-blur-xl relative overflow-hidden"
            style={{ boxShadow: '0 0 30px rgba(6,182,212,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-cyan-400" />
              <span className="text-[10px] text-cyan-400/80 uppercase tracking-widest font-bold">Angel Stream</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">Analytical. Supportive. Synthesizes meaning and validates structure.</p>
          </div>

          {/* Devil Stream */}
          <div className="p-5 rounded-2xl bg-red-500/[0.04] border border-red-500/15 backdrop-blur-xl relative overflow-hidden"
            style={{ boxShadow: '0 0 30px rgba(239,68,68,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={13} className="text-red-400" />
              <span className="text-[10px] text-red-400/80 uppercase tracking-widest font-bold">Devil Stream</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">Critical. Challenging. Dismantles weak logic and exposes blind spots.</p>
          </div>
        </motion.div>

        {/* ═══ ANALYSIS OUTPUT ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {(status || analysis) && (
            <AnalysisPanel analysis={analysis} status={status} activeMode={activeMode} />
          )}
        </AnimatePresence>

        {/* ═══ MEMORY LATTICE ════════════════════════════════════════════════ */}
        <div className="mb-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-2.5">
              <Database size={15} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Memory Lattice</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/4 border border-white/6 text-[10px] text-neutral-600">
                {processedHistory.length}
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-white/3 border border-white/8 rounded-xl px-3 py-2 text-xs text-neutral-400 outline-none pr-7 cursor-pointer focus:border-white/16 transition-colors"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="category">Category</option>
                </select>
                <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input
                  type="text"
                  placeholder="Filter memories…"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="w-full bg-white/3 border border-white/8 rounded-xl py-2 pl-8 pr-3 text-xs text-neutral-300 placeholder:text-neutral-700 outline-none focus:border-white/16 transition-colors"
                />
              </div>
            </div>
          </motion.div>

          {/* Bento Grid */}
          {processedHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="p-5 rounded-2xl bg-white/3 border border-white/6">
                <BrainCircuit size={28} className="text-neutral-700" />
              </div>
              <p className="text-neutral-700 text-sm">No thoughts in the lattice yet.</p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min"
            >
              <AnimatePresence>
                {processedHistory.map((item, i) => (
                  <ThoughtCard
                    key={item.id}
                    item={item}
                    index={i}
                    editingId={editingId}
                    editContent={editContent}
                    onEdit={(id, content) => { setEditingId(id); setEditContent(content); }}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    onDelete={deleteThought}
                    onEditChange={setEditContent}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══ FLOATING DOCK ═════════════════════════════════════════════════ */}
      <FloatingDock
        thought={thought}
        setThought={setThought}
        isProcessing={isProcessing}
        isListening={isListening}
        activeMode={activeMode}
        onAngel={() => { setActiveMode('angel'); getAnalysis('angel'); }}
        onDevil={() => { setActiveMode('devil'); getAnalysis('devil'); }}
        onZap={() => { setActiveMode('zap'); getCollision(); }}
        onInterest={() => submitAction('/api/interest', 'Interest locked.')}
        onSend={() => submitAction('/api/log', 'Thought logged.')}
        onListen={startListening}
      />
    </main>
  );
}
