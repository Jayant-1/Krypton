import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeGaps } from '../api/papers';

// ── Sub-components ─────────────────────────────────────────────────────────────

function ConfidenceBar({ value }) {
  const pct   = Math.min(Math.max(value, 0), 10) * 10;
  const color  = pct >= 70 ? '#00F5FF' : pct >= 50 ? '#94FBAB' : '#8A9BAE';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[2px] bg-k-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono text-[10px] w-6 text-right" style={{ color }}>
        {value}/10
      </span>
    </div>
  );
}

function GapCard({ gap, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col gap-3 rounded-md border border-k-border p-5 transition-colors duration-300"
      style={{ background: '#16181A' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.35)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2D30'; }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base text-white leading-snug">{gap.title}</h3>
        <span
          className="flex-none font-mono text-[10px] px-2 py-0.5 rounded-sm border"
          style={{ color: '#94FBAB', borderColor: 'rgba(148,251,171,0.3)', background: 'rgba(148,251,171,0.06)' }}
        >
          {gap.paper_count} paper{gap.paper_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Confidence */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] text-k-muted tracking-widest">CONFIDENCE</span>
        <ConfidenceBar value={gap.confidence} />
      </div>

      {/* Description */}
      <p className="text-k-muted text-sm leading-relaxed">
        {expanded ? gap.description : gap.description.slice(0, 120) + (gap.description.length > 120 ? '…' : '')}
        {gap.description.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 font-mono text-[10px] text-k-cyan hover:underline"
          >
            {expanded ? 'less' : 'more'}
          </button>
        )}
      </p>
    </motion.div>
  );
}

function QuestionList({ questions }) {
  return (
    <ul className="flex flex-col gap-3">
      {questions.map((q, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.07 }}
          className="flex items-start gap-3 text-sm text-k-muted leading-relaxed"
        >
          <span className="font-mono text-k-cyan text-base mt-0.5 flex-none">?</span>
          <span>{q}</span>
        </motion.li>
      ))}
    </ul>
  );
}

function ClusterTags({ clusters }) {
  return (
    <div className="flex flex-wrap gap-3">
      {clusters.map((cluster, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className="flex flex-col gap-2 px-4 py-3 rounded-md border border-k-border"
          style={{ background: 'rgba(0,245,255,0.04)' }}
        >
          <span className="font-mono text-[10px] text-k-cyan tracking-widest">{cluster.theme.toUpperCase()}</span>
          <div className="flex flex-wrap gap-1.5">
            {cluster.gaps.map((gap, j) => (
              <span
                key={j}
                className="font-mono text-[10px] px-2 py-0.5 rounded-sm border border-k-border text-k-muted"
              >
                {gap}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4 px-6 py-5 rounded-md border border-k-border"
        style={{ background: 'rgba(0,245,255,0.04)' }}>
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-k-cyan"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm text-k-cyan">Gemini is analyzing research gaps…</span>
          <span className="font-mono text-[10px] text-k-muted">Batching {'{n}'} paper abstracts · This takes 10–30 seconds</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-md border border-k-border p-5 animate-pulse"
            style={{ background: '#16181A' }}>
            <div className="h-4 bg-k-border rounded w-3/4" />
            <div className="h-2 bg-k-border rounded w-1/3" />
            <div className="h-px bg-k-border" />
            <div className="h-3 bg-k-border rounded w-full" />
            <div className="h-3 bg-k-border rounded w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const TABS = ['GAPS', 'QUESTIONS', 'CLUSTERS'];

export default function ResearchGaps({ searchId, query, papers, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('GAPS');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyzeGaps({ searchId, query, papers })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [searchId, query]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="px-6 md:px-12 py-12 border-t border-k-border"
      style={{ background: 'rgba(0,245,255,0.02)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🧠</span>
              <h2 className="font-serif text-2xl text-white">
                Research Gaps<em className="not-italic text-k-cyan ml-2 text-lg">"{query}"</em>
              </h2>
              {data?.cached && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm border"
                  style={{ color: '#94FBAB', borderColor: 'rgba(148,251,171,0.3)', background: 'rgba(148,251,171,0.06)' }}>
                  ⚡ CACHED
                </span>
              )}
            </div>
            {data && (
              <p className="font-mono text-[11px] text-k-muted tracking-wider">
                ANALYZED {data.paper_count} PAPERS · {data.top_gaps?.length} GAPS DETECTED
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[11px] px-4 py-2 border border-k-border text-k-muted hover:text-white hover:border-k-muted rounded-sm tracking-widest uppercase transition-all duration-200"
          >
            ← Back to Results
          </button>
        </div>

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {loading && <LoadingState />}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="flex items-center gap-4 px-6 py-4 rounded-md border"
            style={{ background: 'rgba(255,60,60,0.07)', borderColor: 'rgba(255,60,60,0.3)', color: '#FF6B6B' }}>
            <span className="font-mono text-sm">⚠ {error}</span>
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        {data && !loading && (
          <>
            <div className="flex border-b border-k-border">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-5 py-3 font-mono text-[11px] tracking-widest transition-all duration-200 relative"
                  style={{
                    color:      tab === t ? '#00F5FF' : '#8A9BAE',
                    background: tab === t ? 'rgba(0,245,255,0.04)' : 'transparent',
                  }}
                >
                  {t === 'GAPS'      && `RESEARCH GAPS (${data.top_gaps?.length ?? 0})`}
                  {t === 'QUESTIONS' && `OPEN QUESTIONS (${data.open_questions?.length ?? 0})`}
                  {t === 'CLUSTERS'  && `CLUSTERS (${data.clusters?.length ?? 0})`}
                  {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-k-cyan" />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'GAPS' && (
                <motion.div
                  key="gaps"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {data.top_gaps.map((gap, i) => (
                    <GapCard key={i} gap={gap} index={i} />
                  ))}
                </motion.div>
              )}

              {tab === 'QUESTIONS' && (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-3xl"
                >
                  <QuestionList questions={data.open_questions} />
                </motion.div>
              )}

              {tab === 'CLUSTERS' && (
                <motion.div
                  key="clusters"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {data.clusters.length > 0
                    ? <ClusterTags clusters={data.clusters} />
                    : <p className="text-k-muted text-sm">No clusters identified for this search.</p>
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.section>
  );
}
