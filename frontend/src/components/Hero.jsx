import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KnowledgeSphere from './KnowledgeSphere';

const DOMAINS = ['all', 'AI', 'ML', 'NLP', 'CV', 'Healthcare', 'Robotics', 'Data Science', 'Security'];
const SOURCES = [
  { value: 'both',             label: 'All Sources' },
  { value: 'arxiv',            label: 'arXiv Only'  },
  { value: 'semantic_scholar', label: 'OpenAlex Only'},
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 22 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.65, delay, ease: [0.4, 0, 0.2, 1] },
});

export default function Hero({ onSearch, loading }) {
  const [query,     setQuery]     = useState('');
  const [focused,   setFocused]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [domain,   setDomain]   = useState('all');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo,   setYearTo]   = useState('');
  const [sources,  setSources]  = useState('both');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSearch({
      query:      query.trim(),
      domain,
      year_from:  yearFrom ? parseInt(yearFrom, 10) : null,
      year_to:    yearTo   ? parseInt(yearTo, 10)   : null,
      sources,
      max_results: 20,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center pt-28 pb-20 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">
          {/* ── LEFT ────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Eyebrow */}
            <motion.div {...fadeUp(0.1)} className="flex items-center gap-3">
              <div className="w-6 h-px bg-k-cyan" />
              <span className="font-mono text-[11px] text-k-cyan tracking-[0.2em] uppercase">
                AI Research Assistant
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.2)}
              className="font-serif text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.08] font-light text-white"
            >
              See What's Next
              <br />
              <em className="not-italic text-k-text">in Research.</em>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              {...fadeUp(0.3)}
              className="text-k-muted text-lg leading-relaxed font-light max-w-xl"
            >
              Krypton finds, ranks, and explains academic papers so researchers
              and students can move from topic to insight faster.
            </motion.p>

            {/* ── Search form ─────────────────────────────────────── */}
            <motion.div {...fadeUp(0.4)}>
              <form onSubmit={handleSubmit}>
                {/* Main search bar */}
                <div
                  className="rounded-t-md border transition-all duration-300"
                  style={{
                    background: "#16181A",
                    borderColor: focused ? "#00F5FF" : "#2A2D30",
                    boxShadow: focused
                      ? "0 0 0 1px #00F5FF, 0 0 24px rgba(0,245,255,0.13)"
                      : "none",
                    borderBottomColor: showFilters
                      ? "#2A2D30"
                      : focused
                        ? "#00F5FF"
                        : "#2A2D30",
                    borderRadius: showFilters ? "6px 6px 0 0" : "6px",
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-4">
                    <span className="font-mono text-k-cyan text-sm select-none">
                      ›
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder-transparent"
                        placeholder="Search research topics..."
                        aria-label="Research topic search"
                        disabled={loading}
                      />
                      {!query && (
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                          <span className="font-mono text-sm text-k-muted">
                            {focused
                              ? ""
                              : "Transformers in medical image segmentation"}
                          </span>
                          {!focused && <span className="cursor-blink" />}
                        </div>
                      )}
                    </div>

                    {/* Filter toggle */}
                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className="font-mono text-[10px] px-2 py-1 rounded-sm border transition-all duration-200 tracking-wider"
                      style={{
                        borderColor: showFilters
                          ? "rgba(148,251,171,0.4)"
                          : "#2A2D30",
                        color: showFilters ? "#94FBAB" : "#8A9BAE",
                        background: showFilters
                          ? "rgba(148,251,171,0.06)"
                          : "transparent",
                      }}
                    >
                      FILTERS
                    </button>

                    {/* Search button */}
                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="font-mono text-[11px] px-4 py-1.5 rounded-sm tracking-widest uppercase transition-all duration-200 flex items-center gap-2"
                      style={{
                        background: loading
                          ? "rgba(0,245,255,0.06)"
                          : "rgba(0,245,255,0.12)",
                        color: "#00F5FF",
                        border: "1px solid rgba(0,245,255,0.3)",
                        opacity: !query.trim() ? 0.5 : 1,
                      }}
                    >
                      {loading ? (
                        <>
                          <div className="w-3 h-3 rounded-full border border-k-cyan border-t-transparent animate-spin" />
                          <span>SEARCHING</span>
                        </>
                      ) : (
                        "SEARCH"
                      )}
                    </button>
                  </div>

                  {/* Source pills */}
                  <div className="flex items-center gap-4 px-4 py-2 border-t border-k-border">
                    {["arXiv", "OpenAlex"].map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[10px] text-k-muted tracking-wider"
                      >
                        {s}
                      </span>
                    ))}
                    <span className="ml-auto font-mono text-[10px] text-k-muted">
                      2.4M+ PAPERS
                    </span>
                  </div>
                </div>

                {/* ── Filter panel ──────────────────────────────────── */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="border border-t-0 border-k-border rounded-b-md px-4 py-4 flex flex-wrap gap-4"
                        style={{ background: "rgba(11,13,14,0.6)" }}
                      >
                        {/* Domain */}
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-k-muted tracking-widest">
                            DOMAIN
                          </span>
                          <select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="font-mono text-[11px] px-3 py-1.5 rounded-sm border border-k-border text-k-text outline-none"
                            style={{ background: "#16181A" }}
                          >
                            {DOMAINS.map((d) => (
                              <option key={d} value={d}>
                                {d === "all" ? "All Domains" : d}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Year range */}
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-k-muted tracking-widest">
                            YEAR FROM
                          </span>
                          <input
                            type="number"
                            min="1990"
                            max="2026"
                            value={yearFrom}
                            onChange={(e) => setYearFrom(e.target.value)}
                            placeholder="e.g. 2020"
                            className="font-mono text-[11px] w-24 px-3 py-1.5 rounded-sm border border-k-border text-k-text bg-k-surface outline-none placeholder-k-border"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-k-muted tracking-widest">
                            YEAR TO
                          </span>
                          <input
                            type="number"
                            min="1990"
                            max="2026"
                            value={yearTo}
                            onChange={(e) => setYearTo(e.target.value)}
                            placeholder="e.g. 2024"
                            className="font-mono text-[11px] w-24 px-3 py-1.5 rounded-sm border border-k-border text-k-text bg-k-surface outline-none placeholder-k-border"
                          />
                        </div>

                        {/* Sources */}
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-k-muted tracking-widest">
                            SOURCES
                          </span>
                          <div className="flex items-center gap-2">
                            {SOURCES.map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setSources(value)}
                                className="font-mono text-[10px] px-3 py-1.5 rounded-sm border transition-all duration-150"
                                style={{
                                  borderColor:
                                    sources === value
                                      ? "rgba(0,245,255,0.5)"
                                      : "#2A2D30",
                                  color:
                                    sources === value ? "#00F5FF" : "#8A9BAE",
                                  background:
                                    sources === value
                                      ? "rgba(0,245,255,0.08)"
                                      : "transparent",
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

            {/* CTAs */}
            <motion.div {...fadeUp(0.5)} className="flex flex-wrap gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !query.trim()}
                className="font-mono text-[11px] px-6 py-3 rounded-sm tracking-widest uppercase transition-all duration-200"
                style={{
                  background: "#00F5FF",
                  color: "#0B0D0E",
                  fontWeight: 500,
                  opacity: !query.trim() ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (query.trim())
                    e.currentTarget.style.boxShadow =
                      "0 0 24px rgba(0,245,255,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Search Papers →
              </button>
              <button
                onClick={() => {
                  setQuery("transformer attention mechanism");
                  setTimeout(
                    () =>
                      onSearch({
                        query: "transformer attention mechanism",
                        domain: "AI",
                        year_from: 2020,
                        year_to: null,
                        sources: "both",
                        max_results: 10,
                      }),
                    50,
                  );
                }}
                className="font-mono text-[11px] px-6 py-3 rounded-sm border border-k-border text-k-muted tracking-widest uppercase hover:border-k-cyan hover:text-k-cyan transition-all duration-200"
              >
                View Demo Reading Plan
              </button>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              {...fadeUp(0.6)}
              className="flex items-center gap-6 pt-2"
            >
              {[
                { dot: "#94FBAB", text: "FREE TO USE" },
                null,
                { dot: null, text: "2.4M+ PAPERS" },
                null,
                { dot: null, text: "Krypton-POWERED" },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} className="w-px h-3 bg-k-border" />
                ) : (
                  <div key={i} className="flex items-center gap-2">
                    {item.dot && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: item.dot,
                          boxShadow: `0 0 6px ${item.dot}`,
                        }}
                      />
                    )}
                    <span className="font-mono text-[10px] text-k-muted tracking-wider">
                      {item.text}
                    </span>
                  </div>
                ),
              )}
            </motion.div>
          </div>

          {/* ── RIGHT ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="lg:col-span-2 flex items-center justify-center relative"
          >
            <KnowledgeSphere />

            {/* Floating chips */}
            <motion.div
              className="absolute top-8 -left-4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-md border border-k-border"
              style={{
                background: "rgba(22,24,26,0.9)",
                backdropFilter: "blur(12px)",
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-mint" />
              <span className="font-mono text-[10px] text-k-muted">
                RELEVANCE
              </span>
              <span className="font-mono text-[11px] text-k-mint font-medium">
                98.4%
              </span>
            </motion.div>

            <motion.div
              className="absolute bottom-12 -right-4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-md border border-k-border"
              style={{
                background: "rgba(22,24,26,0.9)",
                backdropFilter: "blur(12px)",
              }}
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-cyan" />
              <span className="font-mono text-[10px] text-k-muted">
                PAPERS FOUND
              </span>
              <span className="font-mono text-[11px] text-k-cyan font-medium">
                2,847
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
