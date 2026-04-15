import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function FinalCTA() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="px-6 md:px-12 py-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="relative rounded-md border border-k-border overflow-hidden"
          style={{ background: '#16181A' }}
        >
          {/* Top gradient bar */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF60, transparent)' }} />

          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,245,255,0.05) 0%, transparent 100%)',
            }}
          />

          {/* Grid pattern inside CTA */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-8 py-20 gap-8">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.4,0,0.2,1] }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-px bg-k-cyan opacity-60" />
              <span className="font-mono text-[11px] text-k-cyan tracking-[0.2em] uppercase">Get Started</span>
              <div className="w-8 h-px bg-k-cyan opacity-60" />
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.18, ease: [0.4,0,0.2,1] }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-light max-w-3xl leading-[1.1]"
            >
              Turn Research Overload<br />into Clear Direction.
            </motion.h2>

            {/* Supporting copy */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.26, ease: [0.4,0,0.2,1] }}
              className="text-k-muted text-base md:text-lg leading-relaxed max-w-xl font-light"
            >
              Stop spending hours triaging Google Scholar results.
              Krypton delivers a ranked, summarised reading plan in seconds —
              so you can focus on understanding, not searching.
            </motion.p>

            {/* CTA button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.55, delay: 0.34, ease: [0.4,0,0.2,1] }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                className="font-mono text-[11px] px-8 py-3.5 rounded-sm tracking-widest uppercase transition-all duration-200"
                style={{ background: '#00F5FF', color: '#0B0D0E', fontWeight: 500 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(0,245,255,0.45)';
                  e.currentTarget.style.transform  = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform  = 'none';
                }}
              >
                Start Your First Search →
              </button>
              <span className="font-mono text-[10px] text-k-muted tracking-wider">
                Free · No signup · Instant results
              </span>
            </motion.div>

            {/* Bottom stat chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.44, ease: [0.4,0,0.2,1] }}
              className="flex flex-wrap items-center justify-center gap-6 mt-4"
            >
              {[
                { label: 'Papers Indexed',   value: '2.4M+' },
                { label: 'Avg. Confidence',  value: '94.7%' },
                { label: 'Time to Insight',  value: '< 30s' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">{value}</span>
                  <span className="font-mono text-[10px] text-k-muted tracking-wider">{label.toUpperCase()}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom gradient bar */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #2A2D30, transparent)' }} />
        </motion.div>
      </div>
    </section>
  );
}
