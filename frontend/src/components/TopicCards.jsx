import { motion } from "framer-motion";
import { useState } from "react";
import { suggestTopics } from "../api/papers";

const DIFFICULTY_COLORS = {
  Beginner: {
    color: "#94FBAB",
    bg: "rgba(148,251,171,0.08)",
    border: "rgba(148,251,171,0.3)",
  },
  Intermediate: {
    color: "#00F5FF",
    bg: "rgba(0,245,255,0.08)",
    border: "rgba(0,245,255,0.3)",
  },
  Advanced: {
    color: "#FF6B6B",
    bg: "rgba(255,107,107,0.08)",
    border: "rgba(255,107,107,0.3)",
  },
};

function HotBar({ score }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[9px] text-k-muted">HOT</span>
      <div className="flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-3 rounded-[1px] transition-all"
            style={{ background: i < score ? "#FF6B35" : "#2A2D30" }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px]" style={{ color: "#FF6B35" }}>
        {score}/10
      </span>
    </div>
  );
}

function TopicCard({ topic, index, onSearch }) {
  const diff =
    DIFFICULTY_COLORS[topic.difficulty] ?? DIFFICULTY_COLORS.Intermediate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="flex flex-col gap-4 rounded-md border border-k-border p-6 cursor-pointer transition-all duration-300 group"
      style={{ background: "#16181A" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,245,255,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2A2D30";
      }}
      onClick={() => onSearch(topic.suggested_query)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base text-white leading-snug group-hover:text-k-cyan transition-colors duration-200">
          {topic.name}
        </h3>
        <span
          className="flex-none font-mono text-[10px] px-2 py-0.5 rounded-sm border"
          style={{
            color: diff.color,
            background: diff.bg,
            borderColor: diff.border,
          }}
        >
          {topic.difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="text-k-muted text-sm leading-relaxed">
        {topic.description}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-10 justify-between pt-1">
        <HotBar score={topic.hot_score} className="w-1/3" />
        <span className="font-mono text-[10px] w-2/3 text-k-cyan group-hover:underline">
          Search → {topic.suggested_query.slice(0, 30)}
          {topic.suggested_query.length > 30 ? "…" : ""}
        </span>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-md border border-k-border p-6 animate-pulse"
          style={{ background: "#16181A" }}
        >
          <div className="h-4 bg-k-border rounded w-3/4" />
          <div className="h-3 bg-k-border rounded w-full" />
          <div className="h-3 bg-k-border rounded w-5/6" />
          <div className="h-2 bg-k-border rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function TopicCards({ profile, onSearch }) {
  const [topics, setTopics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState("");
  const [loaded, setLoaded] = useState(false);

  const fetchTopics = async (force = false) => {
    if (!force && loaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await suggestTopics({
        interests: profile?.interests ?? [],
        skill_level: profile?.skill_level ?? "intermediate",
        goal: profile?.goal ?? "research",
      });
      setTopics(res.topics);
      setSummary(res.profile_summary);
      setLoaded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when profile is set
  if (profile && !loaded && !loading && !error) {
    fetchTopics();
  }

  if (!profile) return null;

  return (
    <section className="px-6 md:px-12 py-12 border-k-border">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔭</span>
              <h2 className="font-serif text-2xl text-white">
                Suggested Topics
              </h2>
            </div>
            {summary && (
              <p className="font-mono text-[11px] text-k-muted tracking-wider">
                {summary.toUpperCase()}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchTopics(true)}
            disabled={loading}
            className="font-mono text-[11px] px-4 py-2 border border-k-border text-k-muted hover:text-white hover:border-k-muted rounded-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-40"
          >
            {loading ? "⟳ Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-md border text-sm font-mono"
            style={{
              background: "rgba(255,60,60,0.07)",
              borderColor: "rgba(255,60,60,0.3)",
              color: "#FF6B6B",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingState />}

        {/* Topic grid */}
        {topics && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.slice(0, 6).map((topic, i) => (
              <TopicCard key={i} topic={topic} index={i} onSearch={onSearch} />
            ))}
          </div>
        )}

        <p className="font-mono text-[10px] text-k-muted text-center">
          Click any topic to search · Personalised for your profile · Powered by
          Gemini
        </p>
      </div>
    </section>
  );
}
