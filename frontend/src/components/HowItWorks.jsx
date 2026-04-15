import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function StepCard({ step, index }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.14, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-10 flex flex-col gap-5"
    >
      {/* Icon + number row */}
      <div className="flex items-center gap-4">
        <div
          className="w-[104px] h-[104px] flex-none flex items-center justify-center rounded-md border border-k-border"
          style={{ background: '#16181A' }}
        >
          {step.icon}
        </div>
        <span
          className="font-mono text-6xl font-light"
          style={{ color: 'rgba(0,245,255,0.12)', letterSpacing: '-0.03em' }}
        >
          {step.number}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-xl text-white font-normal leading-snug">{step.title}</h3>
        <p className="text-k-muted text-sm leading-relaxed">{step.desc}</p>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-k-border w-fit"
          style={{ background: 'rgba(0,245,255,0.04)' }}
        >
          <span className="w-1 h-1 rounded-full bg-k-cyan" />
          <span className="font-mono text-[10px] text-k-muted tracking-wider">{step.detail}</span>
        </div>
      </div>
    </motion.div>
  );
}

const STEPS = [
  {
    number: '01',
    title: 'Ask a Research Question',
    desc: 'Type any topic — a concept, a problem, a domain. Krypton parses your intent and queries multiple academic databases simultaneously.',
    detail: 'arXiv · OpenAlex ',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="32" height="26" rx="2" stroke="#2A2D30" strokeWidth="1" />
        <circle cx="8" cy="18" r="1.5" fill="#00F5FF" opacity="0.8" />
        <line x1="12" y1="18" x2="28" y2="18" stroke="#00F5FF" strokeWidth="0.8" opacity="0.5" />
        <circle cx="8" cy="24" r="1.5" fill="#94FBAB" opacity="0.6" />
        <line x1="12" y1="24" x2="22" y2="24" stroke="#8A9BAE" strokeWidth="0.8" opacity="0.4" />
        <circle cx="32" cy="32" r="6" fill="#0B0D0E" stroke="#00F5FF" strokeWidth="1" />
        <line x1="30" y1="32" x2="34" y2="32" stroke="#00F5FF" strokeWidth="1" />
        <line x1="32" y1="30" x2="32" y2="34" stroke="#00F5FF" strokeWidth="1" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Krypton Finds & Ranks the Literature',
    desc: 'Papers are fetched, deduplicated, enriched with real citation counts, and scored using a transparent three-factor ranking algorithm.',
    detail: '0.4 × Relevance + 0.3 × Recency + 0.3 × Citations',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" stroke="#2A2D30" strokeWidth="0.8" />
        <circle cx="20" cy="20" r="9" stroke="#00F5FF" strokeWidth="0.8" opacity="0.4" />
        <circle cx="20" cy="20" r="4" stroke="#00F5FF" strokeWidth="0.8" opacity="0.7" />
        <line x1="6"  y1="20" x2="11" y2="20" stroke="#94FBAB" strokeWidth="0.7" opacity="0.6" />
        <line x1="29" y1="20" x2="34" y2="20" stroke="#94FBAB" strokeWidth="0.7" opacity="0.6" />
        <line x1="20" y1="6"  x2="20" y2="11" stroke="#94FBAB" strokeWidth="0.7" opacity="0.6" />
        <line x1="20" y1="29" x2="20" y2="34" stroke="#94FBAB" strokeWidth="0.7" opacity="0.6" />
        <circle cx="20" cy="20" r="2" fill="#00F5FF" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Understand What Matters Fast',
    desc: 'For any paper, get a structured breakdown — contribution, method, result, limitation — and a plain-English summary, powered by Gemini AI.',
    detail: 'Summaries · Key Insights · Reading Priority',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6"  y="5"  width="28" height="34" rx="1.5" stroke="#2A2D30" strokeWidth="0.9" />
        <line x1="11" y1="13" x2="29" y2="13" stroke="#00F5FF" strokeWidth="1"   opacity="0.7" />
        <line x1="11" y1="18" x2="29" y2="18" stroke="#8A9BAE" strokeWidth="0.7" opacity="0.4" />
        <line x1="11" y1="22" x2="24" y2="22" stroke="#8A9BAE" strokeWidth="0.7" opacity="0.4" />
        <line x1="11" y1="26" x2="20" y2="26" stroke="#8A9BAE" strokeWidth="0.7" opacity="0.3" />
        <circle cx="30" cy="9"  r="5" fill="#0B0D0E" stroke="#94FBAB" strokeWidth="1" />
        <polyline points="28,9 29.5,10.5 32,7.5" stroke="#94FBAB" strokeWidth="1" fill="none" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const headRef  = useRef(null);
  const headView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="px-6 md:px-12 py-24">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div ref={headRef} className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.4,0,0.2,1] }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-5 h-px bg-k-cyan" />
            <span className="font-mono text-[11px] text-k-cyan tracking-[0.2em] uppercase">Workflow</span>
            <div className="w-5 h-px bg-k-cyan" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.4,0,0.2,1] }}
            className="font-serif text-4xl md:text-5xl text-white font-light leading-tight"
          >
            Three Steps.<br />Complete Clarity.
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connector lines (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[33.3%] right-[33.3%] h-px border-t border-dashed border-k-border z-0" />
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
