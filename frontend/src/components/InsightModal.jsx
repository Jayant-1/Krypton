import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSummary, getInsights } from '../api/papers';

function LoadingDots() {
  return (
    <div className="flex items-center gap-2 py-8 justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-k-cyan"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <span className="font-mono text-xs text-k-muted ml-2">Gemini is thinking…</span>
    </div>
  );
}

function SummaryTab({ paperId, title, abstract }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSummary(paperId, title, abstract)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [paperId]);

  if (loading) return <LoadingDots />;

  if (error) return (
    <div className="py-6 font-mono text-sm text-red-400 text-center">
      ⚠ {error}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {data.cached && (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded-sm border w-fit"
          style={{ color: '#94FBAB', borderColor: 'rgba(148,251,171,0.3)', background: 'rgba(148,251,171,0.05)' }}>
          ⚡ CACHED
        </span>
      )}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-k-muted tracking-widest uppercase">Summary</span>
        <p className="text-k-text text-sm leading-[1.75]">{data.summary}</p>
      </div>
      <div
        className="flex flex-col gap-2 px-5 py-4 rounded-md border border-k-border"
        style={{ background: 'rgba(0,245,255,0.04)' }}
      >
        <span className="font-mono text-[10px] text-k-cyan tracking-widest uppercase">Key Contribution</span>
        <p className="text-white text-sm leading-relaxed font-light">{data.key_contribution}</p>
      </div>
    </motion.div>
  );
}

function InsightsTab({ paperId, title, abstract }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getInsights(paperId, title, abstract)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [paperId]);

  if (loading) return <LoadingDots />;

  if (error) return (
    <div className="py-6 font-mono text-sm text-red-400 text-center">
      ⚠ {error}
    </div>
  );

  const FIELDS = [
    { key: 'problem',     label: 'Problem',     color: '#00F5FF' },
    { key: 'method',      label: 'Method',      color: '#94FBAB' },
    { key: 'result',      label: 'Result',      color: '#00F5FF' },
    { key: 'limitation',  label: 'Limitation',  color: '#8A9BAE' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      {data.cached && (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded-sm border w-fit"
          style={{ color: '#94FBAB', borderColor: 'rgba(148,251,171,0.3)', background: 'rgba(148,251,171,0.05)' }}>
          ⚡ CACHED
        </span>
      )}
      {FIELDS.map(({ key, label, color }) => (
        <div
          key={key}
          className="flex flex-col gap-1.5 px-5 py-4 rounded-md border border-k-border"
          style={{ background: `rgba(${key === 'limitation' ? '138,155,174' : '0,245,255'},0.03)` }}
        >
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color }}>
            {label}
          </span>
          <p className="text-k-text text-sm leading-relaxed">{data[key]}</p>
        </div>
      ))}
    </motion.div>
  );
}

const TABS = [
  { id: 'summary',  label: 'SUMMARY'  },
  { id: 'insights', label: 'INSIGHTS' },
];

export default function InsightModal({ paper, initialTab = 'summary', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-lg border border-k-border overflow-hidden"
          style={{ background: '#16181A' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-k-border flex-none">
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="font-serif text-lg text-white leading-snug">{paper.title}</h2>
              <p className="font-mono text-[10px] text-k-muted tracking-wider">
                {Array.isArray(paper.authors)
                  ? paper.authors.slice(0, 3).join(' · ') + (paper.authors.length > 3 ? ' et al.' : '')
                  : paper.authors}
                {paper.year && ` · ${paper.year}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="font-mono text-k-muted hover:text-white transition-colors flex-none text-lg leading-none mt-0.5"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-k-border flex-none">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 py-3 font-mono text-[11px] tracking-widest transition-all duration-200 relative"
                style={{
                  color: activeTab === id ? '#00F5FF' : '#8A9BAE',
                  background: activeTab === id ? 'rgba(0,245,255,0.04)' : 'transparent',
                }}
              >
                {label}
                {activeTab === id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-k-cyan" />
                )}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'summary' && (
              <SummaryTab
                paperId={paper.id}
                title={paper.title}
                abstract={paper.abstract}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsTab
                paperId={paper.id}
                title={paper.title}
                abstract={paper.abstract}
              />
            )}
          </div>

          {/* Footer with link */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-k-border flex-none">
            <span className="font-mono text-[10px] text-k-muted">
              ID: <span className="text-white">{paper.id}</span>
            </span>
            <a
              href={paper.link}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] text-k-cyan hover:underline tracking-wider"
            >
              OPEN PAPER ↗
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
