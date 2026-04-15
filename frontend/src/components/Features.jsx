import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ── SVG icons (abstract scientific patterns) ─────────────────────── */
const IconSearch = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle
      cx="14"
      cy="14"
      r="8"
      stroke="#00F5FF"
      strokeWidth="1"
      opacity="0.6"
    />
    <line
      x1="20"
      y1="20"
      x2="28"
      y2="28"
      stroke="#00F5FF"
      strokeWidth="1.2"
      opacity="0.6"
    />
    <circle cx="14" cy="14" r="2.5" fill="#00F5FF" opacity="0.8" />
    <circle cx="14" cy="8" r="1" fill="#94FBAB" opacity="0.6" />
    <circle cx="19" cy="14" r="1" fill="#94FBAB" opacity="0.6" />
    <circle cx="14" cy="20" r="1" fill="#94FBAB" opacity="0.6" />
    <circle cx="9" cy="14" r="1" fill="#94FBAB" opacity="0.6" />
  </svg>
);

const IconRanking = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="20" width="5" height="8" fill="#00F5FF" opacity="0.4" />
    <rect x="12" y="13" width="5" height="15" fill="#00F5FF" opacity="0.6" />
    <rect x="20" y="6" width="5" height="22" fill="#00F5FF" opacity="0.9" />
    <polyline
      points="6.5,20 14.5,13 22.5,6"
      stroke="#94FBAB"
      strokeWidth="0.8"
      opacity="0.6"
      fill="none"
    />
    <circle cx="6.5" cy="20" r="1.5" fill="#94FBAB" opacity="0.8" />
    <circle cx="14.5" cy="13" r="1.5" fill="#94FBAB" opacity="0.8" />
    <circle cx="22.5" cy="6" r="1.5" fill="#94FBAB" opacity="0.8" />
  </svg>
);

const IconInsights = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle
      cx="16"
      cy="13"
      r="7"
      stroke="#00F5FF"
      strokeWidth="1"
      opacity="0.5"
    />
    <line
      x1="16"
      y1="20"
      x2="16"
      y2="24"
      stroke="#00F5FF"
      strokeWidth="1.2"
      opacity="0.5"
    />
    <line
      x1="13"
      y1="24"
      x2="19"
      y2="24"
      stroke="#00F5FF"
      strokeWidth="1.2"
      opacity="0.5"
    />
    <circle cx="16" cy="10" r="1.5" fill="#94FBAB" opacity="0.9" />
    <line
      x1="12"
      y1="13"
      x2="20"
      y2="13"
      stroke="#94FBAB"
      strokeWidth="0.8"
      opacity="0.5"
    />
    <line
      x1="11"
      y1="16"
      x2="21"
      y2="16"
      stroke="#94FBAB"
      strokeWidth="0.8"
      opacity="0.3"
    />
  </svg>
);

const IconSummary = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect
      x="5"
      y="4"
      width="22"
      height="28"
      rx="1"
      stroke="#2A2D30"
      strokeWidth="1"
    />
    <line
      x1="9"
      y1="10"
      x2="23"
      y2="10"
      stroke="#00F5FF"
      strokeWidth="1"
      opacity="0.6"
    />
    <line
      x1="9"
      y1="14"
      x2="23"
      y2="14"
      stroke="#8A9BAE"
      strokeWidth="0.8"
      opacity="0.4"
    />
    <line
      x1="9"
      y1="18"
      x2="20"
      y2="18"
      stroke="#8A9BAE"
      strokeWidth="0.8"
      opacity="0.4"
    />
    <line
      x1="9"
      y1="22"
      x2="17"
      y2="22"
      stroke="#8A9BAE"
      strokeWidth="0.8"
      opacity="0.3"
    />
    <circle
      cx="25"
      cy="8"
      r="4"
      fill="#0B0D0E"
      stroke="#94FBAB"
      strokeWidth="1"
      opacity="0.8"
    />
    <polyline
      points="23,8 24.5,9.5 27,6.5"
      stroke="#94FBAB"
      strokeWidth="1"
      fill="none"
      opacity="0.9"
    />
  </svg>
);

const IconRelevance = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="12" stroke="#2A2D30" strokeWidth="0.8" />
    <circle
      cx="16"
      cy="16"
      r="8"
      stroke="#00F5FF"
      strokeWidth="0.8"
      opacity="0.4"
    />
    <circle
      cx="16"
      cy="16"
      r="4"
      stroke="#00F5FF"
      strokeWidth="0.8"
      opacity="0.7"
    />
    <circle cx="16" cy="16" r="2" fill="#00F5FF" opacity="0.9" />
    <line
      x1="4"
      y1="16"
      x2="12"
      y2="16"
      stroke="#94FBAB"
      strokeWidth="0.6"
      opacity="0.5"
    />
    <line
      x1="20"
      y1="16"
      x2="28"
      y2="16"
      stroke="#94FBAB"
      strokeWidth="0.6"
      opacity="0.5"
    />
    <line
      x1="16"
      y1="4"
      x2="16"
      y2="12"
      stroke="#94FBAB"
      strokeWidth="0.6"
      opacity="0.5"
    />
    <line
      x1="16"
      y1="20"
      x2="16"
      y2="28"
      stroke="#94FBAB"
      strokeWidth="0.6"
      opacity="0.5"
    />
  </svg>
);

const IconHistory = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle
      cx="16"
      cy="16"
      r="12"
      stroke="#00F5FF"
      strokeWidth="0.9"
      opacity="0.4"
    />
    <path
      d="M16 10 L16 17 L21 20"
      stroke="#94FBAB"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="16"
      y1="8"
      x2="16"
      y2="10"
      stroke="#94FBAB"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <circle cx="16" cy="16" r="1.5" fill="#94FBAB" opacity="0.9" />
    <circle cx="10" cy="10" r="1.5" fill="#94FBAB" opacity="0.65" />
    <circle cx="22" cy="22" r="1.5" fill="#94FBAB" opacity="0.65" />
  </svg>
);

const IconClarity = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M4 16 Q16 4 28 16 Q16 28 4 16Z"
      stroke="#00F5FF"
      strokeWidth="0.9"
      opacity="0.5"
      fill="none"
    />
    <circle cx="16" cy="16" r="3.5" fill="#00F5FF" opacity="0.8" />
    <line
      x1="4"
      y1="8"
      x2="8"
      y2="12"
      stroke="#94FBAB"
      strokeWidth="0.7"
      opacity="0.4"
    />
    <line
      x1="28"
      y1="8"
      x2="24"
      y2="12"
      stroke="#94FBAB"
      strokeWidth="0.7"
      opacity="0.4"
    />
    <line
      x1="4"
      y1="24"
      x2="8"
      y2="20"
      stroke="#94FBAB"
      strokeWidth="0.7"
      opacity="0.4"
    />
    <line
      x1="28"
      y1="24"
      x2="24"
      y2="20"
      stroke="#94FBAB"
      strokeWidth="0.7"
      opacity="0.4"
    />
  </svg>
);

const FEATURES = [
  {
    icon: <IconSearch />,
    title: "AI Paper Search",
    desc: "Query arXiv and OpenAlex simultaneously. Natural language or precise boolean — Krypton finds relevant papers across millions of indexed works in seconds.",
    span: "lg:col-span-2",
    accent: "#00F5FF",
  },
  {
    icon: <IconRanking />,
    title: "Smart Ranking",
    desc: "TF-IDF relevance · recency decay · log-normalised citation weight. Every paper scored and sorted transparently.",
    span: "lg:col-span-1",
    accent: "#94FBAB",
  },
  {
    icon: <IconInsights />,
    title: "Key Insights",
    desc: "Structured extraction of problem, method, result, and limitation from each paper — automatically, using Gemini AI.",
    span: "lg:col-span-1",
    accent: "#00F5FF",
  },
  {
    icon: <IconSummary />,
    title: "Fast Summaries",
    desc: "Concise 3–5 sentence plain-English summaries with a single-sentence key contribution — ready in seconds.",
    span: "lg:col-span-1",
    accent: "#94FBAB",
  },
  {
    icon: <IconRelevance />,
    title: "Explainable Relevance",
    desc: "Every score is decomposed: relevance, recency, and citation influence shown separately. No black-box rankings.",
    span: "lg:col-span-1",
    accent: "#00F5FF",
  },
  {
    icon: <IconClarity />,
    title: "Research Clarity",
    desc: "Full search history stored locally. Re-fetch, compare, and track your reading progress across sessions.",
    span: "lg:col-span-1",
    accent: "#94FBAB",
  },
  {
    icon: <IconHistory />,
    title: "Saved Search History",
    desc: "Capture and revisit past queries instantly so you can compare results, refine prompts, and continue research without losing context.",
    span: "lg:col-span-2",
    accent: "#94FBAB",
  },
];

function FeatureTile({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={`group relative p-7 rounded-[4px] border border-k-border flex flex-col gap-5 transition-all duration-300 cursor-default ${feature.span}`}
      style={{ background: "#16181A" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = feature.accent;
        e.currentTarget.style.background = "#181B1D";
        e.currentTarget.style.boxShadow = `0 0 24px rgba(0,245,255,0.06)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2A2D30";
        e.currentTarget.style.background = "#16181A";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Icon with glow on hover */}
      <div
        className="w-12 h-12 flex items-center justify-center rounded-sm border border-k-border transition-all duration-300 group-hover:border-opacity-60"
        style={{ background: "rgba(11,13,14,0.8)" }}
      >
        {feature.icon}
      </div>

      <div>
        <h3 className="font-serif text-xl text-white mb-2 font-normal">
          {feature.title}
        </h3>
        <p className="text-k-muted text-sm leading-relaxed">{feature.desc}</p>
      </div>

      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at top right, ${feature.accent}20, transparent)`,
          borderRadius: "0 4px 0 0",
        }}
      />
    </motion.div>
  );
}

export default function Features() {
  const headRef = useRef(null);
  const headView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section id="features" className="px-6 md:px-12 py-24">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div ref={headRef} className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-5 h-px bg-k-cyan" />
            <span className="font-mono text-[11px] text-k-cyan tracking-[0.2em] uppercase">
              Capabilities
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
            className="font-serif text-4xl md:text-5xl text-white font-light max-w-xl leading-tight"
          >
            Built for How Researchers Actually Work.
          </motion.h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureTile key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
