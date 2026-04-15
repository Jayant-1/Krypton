import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const METRICS = [
  { value: '2.4M+',    label: 'Papers Ranked',              unit: 'INDEXED' },
  { value: '847K+',    label: 'Key Insights Extracted',     unit: 'AI GENERATED' },
  { value: '94.7%',    label: 'Avg. Relevance Confidence',  unit: 'ACCURACY' },
  { value: '~3.2hrs',  label: 'Research Time Saved',        unit: 'PER SESSION' },
];

export default function MetricsStrip() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="px-6 md:px-12 py-0">
      <div className="max-w-7xl mx-auto">
        <div
          className="border border-k-border rounded-md overflow-hidden"
          style={{ background: '#16181A' }}
        >
          {/* Scan line animation */}
          <div className="relative h-px overflow-hidden">
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, transparent)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-k-border divide-y md:divide-y-0">
            {METRICS.map(({ value, label, unit }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.1, ease: [0.4,0,0.2,1] }}
                className="flex flex-col gap-1 px-8 py-6 relative group"
              >
                {/* Hover accent */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'rgba(0,245,255,0.03)' }}
                />

                {/* Live indicator */}
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1 h-1 rounded-full bg-k-cyan animate-pulse" />
                  <span className="font-mono text-[9px] text-k-muted tracking-[0.18em]">{unit}</span>
                </div>

                {/* Value */}
                <span className="font-mono text-3xl font-medium text-white tracking-tight">
                  {value}
                </span>

                {/* Label */}
                <span className="font-mono text-[10px] text-k-muted tracking-wider leading-tight">
                  {label.toUpperCase()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
