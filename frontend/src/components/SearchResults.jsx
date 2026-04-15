import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SCORE_BARS = [
  { key: 'relevance_score', label: 'REL', color: '#00F5FF' },
  { key: 'recency_score',   label: 'REC', color: '#94FBAB' },
  { key: 'citation_score',  label: 'CIT', color: '#8A9BAE' },
];

function SkeletonCard() {
  return (
    <div className="rounded-md border border-k-border p-6 flex flex-col gap-4 animate-pulse" style={{ background: '#16181A' }}>
      <div className="flex justify-between">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-k-border rounded w-3/4" />
          <div className="h-3 bg-k-border rounded w-1/2" />
        </div>
        <div className="h-8 w-14 bg-k-border rounded" />
      </div>
      <div className="h-px bg-k-border" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 bg-k-border rounded w-full" />
        <div className="h-3 bg-k-border rounded w-5/6" />
        <div className="h-3 bg-k-border rounded w-4/5" />
      </div>
      <div className="h-8 bg-k-border rounded" />
    </div>
  );
}

function PaperCard({ paper, rank, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const ABSTRACT_LIMIT = 220;
  const shortAbstract = paper.abstract.slice(0, ABSTRACT_LIMIT);
  const isLong = paper.abstract.length > ABSTRACT_LIMIT;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex flex-col rounded-md border border-k-border overflow-hidden transition-colors duration-300"
      style={{ background: '#16181A' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2D30'; }}
    >
      {/* Rank + top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <span className="font-mono text-[10px] text-k-muted tracking-widest">#{String(rank).padStart(2,'0')}</span>
        {paper.combined_score && (
          <span
            className="font-mono text-sm font-medium"
            style={{ color: '#00F5FF', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}
          >
            {(paper.combined_score * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Title + meta */}
        <div>
          <h3 className="font-serif text-base text-white leading-snug mb-1 group-hover:text-k-cyan transition-colors duration-200">
            {paper.title}
          </h3>
          <p className="font-mono text-[10px] text-k-muted tracking-wider leading-relaxed">
            {Array.isArray(paper.authors)
              ? paper.authors.slice(0, 3).join(' · ') + (paper.authors.length > 3 ? ' et al.' : '')
              : paper.authors}
            {paper.year && <span className="ml-2 text-white">· {paper.year}</span>}
          </p>
        </div>

        {/* Abstract */}
        <div className="text-k-muted text-sm leading-relaxed">
          {expanded ? paper.abstract : shortAbstract}
          {isLong && !expanded && '…'}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-2 font-mono text-[10px] text-k-cyan hover:underline tracking-wider"
            >
              {expanded ? 'LESS' : 'MORE'}
            </button>
          )}
        </div>

        {/* Score breakdown */}
        <div className="flex flex-col gap-1.5 py-1">
          {SCORE_BARS.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-k-muted w-6">{label}</span>
              <div className="flex-1 h-[2px] bg-k-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(paper[key] ?? 0) * 100}%`, background: color }}
                />
              </div>
              <span className="font-mono text-[9px] w-8 text-right" style={{ color }}>
                {((paper[key] ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 border-t border-k-border pt-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-k-muted">
            <span className="text-white">{paper.citation_count?.toLocaleString()}</span> citations
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm border border-k-border text-k-muted capitalize">
            {paper.source?.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={paper.link}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] px-3 py-1.5 rounded-sm border border-k-border text-k-muted hover:text-white hover:border-k-muted transition-all duration-200"
          >
            OPEN ↗
          </a>
          <button
            onClick={() => onSelect(paper, 'summary')}
            className="font-mono text-[10px] px-3 py-1.5 rounded-sm border transition-all duration-200"
            style={{ borderColor: 'rgba(0,245,255,0.3)', color: '#00F5FF', background: 'rgba(0,245,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,245,255,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,245,255,0.06)'; }}
          >
            SUMMARY
          </button>
          <button
            onClick={() => onSelect(paper, 'insights')}
            className="font-mono text-[10px] px-3 py-1.5 rounded-sm border transition-all duration-200"
            style={{ borderColor: 'rgba(148,251,171,0.3)', color: '#94FBAB', background: 'rgba(148,251,171,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148,251,171,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(148,251,171,0.06)'; }}
          >
            INSIGHTS
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function SearchResults({ result, loading, error, onClear, onSelectPaper, onAnalyzeGaps }) {
  return (
    <section id="search-results" className="px-6 md:px-12 py-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            {result && (
              <>
                <h2 className="font-serif text-2xl text-white">
                  {result.total} papers for{' '}
                  <em className="not-italic text-k-cyan">"{result.query}"</em>
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono text-[10px] text-k-muted tracking-wider">
                    SOURCES: {result.sources_used?.join(' · ').toUpperCase()}
                  </span>
                  {result.cached && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm border border-k-border" style={{ color: '#94FBAB', borderColor: 'rgba(148,251,171,0.3)' }}>
                      ⚡ SERVED FROM CACHE
                    </span>
                  )}
                </div>
              </>
            )}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full border border-k-cyan border-t-transparent animate-spin" />
                <span className="font-mono text-sm text-k-muted">Searching across databases…</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Research Gaps button — only when results are ready */}
            {result && result.papers.length > 0 && !loading && (
              <button
                onClick={onAnalyzeGaps}
                className="font-mono text-[11px] px-4 py-2 border rounded-sm tracking-widest uppercase transition-all duration-200 flex items-center gap-2"
                style={{
                  borderColor: 'rgba(148,251,171,0.35)',
                  color: '#94FBAB',
                  background: 'rgba(148,251,171,0.06)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148,251,171,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(148,251,171,0.06)'; }}
              >
                <span>🧠</span> Research Gaps
              </button>
            )}
            <button
              onClick={onClear}
              className="font-mono text-[11px] px-4 py-2 border border-k-border text-k-muted hover:text-white hover:border-k-muted rounded-sm tracking-widest uppercase transition-all duration-200"
            >
              ← Back to Explore
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-md border"
            style={{ background: 'rgba(255,60,60,0.07)', borderColor: 'rgba(255,60,60,0.3)', color: '#FF6B6B' }}
          >
            <span className="font-mono text-sm">⚠ {error}</span>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Results grid */}
        {result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {result.papers.map((paper, i) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  rank={i + 1}
                  onSelect={onSelectPaper}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {result && result.papers.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span className="font-mono text-4xl opacity-20">∅</span>
            <h3 className="font-serif text-xl text-white">No papers found</h3>
            <p className="text-k-muted text-sm max-w-sm">
              Try broader search terms, a different domain filter, or a wider year range.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
