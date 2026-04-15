import { motion } from 'framer-motion';

/* Animated knowledge-graph sphere using pure SVG + Framer Motion */

const NODES = [
  { cx: 200, cy: 200, r: 9,   primary: true },
  { cx: 200, cy: 75,  r: 4.5 },
  { cx: 305, cy: 125, r: 5   },
  { cx: 325, cy: 232, r: 4   },
  { cx: 268, cy: 325, r: 5   },
  { cx: 145, cy: 332, r: 4   },
  { cx: 78,  cy: 252, r: 5   },
  { cx: 82,  cy: 148, r: 4   },
  { cx: 158, cy: 75,  r: 3.5 },
  { cx: 355, cy: 178, r: 3   },
  { cx: 348, cy: 285, r: 3   },
  { cx: 200, cy: 362, r: 3   },
  { cx: 55,  cy: 200, r: 3   },
  { cx: 118, cy: 108, r: 3   },
  { cx: 232, cy: 142, r: 3   },
  { cx: 272, cy: 202, r: 3   },
  { cx: 238, cy: 272, r: 3   },
  { cx: 158, cy: 262, r: 3   },
  { cx: 142, cy: 178, r: 3   },
];

const EDGES = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
  [1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,1],
  [1,8],[2,9],[3,10],[4,11],[6,12],[7,13],
  [0,14],[0,15],[0,16],[0,17],[0,18],
  [14,2],[15,3],[16,4],[17,5],[18,7],
  [14,15],[15,16],[16,17],[17,18],[18,14],
  [8,1],[9,2],[10,3],[11,4],[12,6],[13,7],
];

export default function KnowledgeSphere() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ y: [0, -18, 0] }}
      transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
    >
      {/* Radial ambient glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 68%)',
        }}
      />

      <svg width="420" height="420" viewBox="0 0 400 400" className="relative z-10">
        <defs>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-lg">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#0B0D0E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background sphere glow */}
        <circle cx="200" cy="200" r="168" fill="url(#bgGlow)" />

        {/* Outer dotted orbit ring */}
        <circle cx="200" cy="200" r="158" fill="none" stroke="#2A2D30" strokeWidth="0.6" strokeDasharray="4 6" />

        {/* Edges */}
        {EDGES.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={NODES[a].cx} y1={NODES[a].cy}
            x2={NODES[b].cx} y2={NODES[b].cy}
            stroke="#00F5FF"
            strokeWidth="0.6"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.22, 0.18] }}
            transition={{ duration: 1.2, delay: 0.1 + i * 0.018, ease: 'easeOut' }}
          />
        ))}

        {/* Nodes */}
        {NODES.map((n, i) => (
          <motion.g key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.055, ease: [0.4,0,0.2,1] }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          >
            {n.primary && (
              <circle cx={n.cx} cy={n.cy} r={22} fill="rgba(0,245,255,0.06)" filter="url(#glow-lg)" />
            )}
            <circle
              cx={n.cx} cy={n.cy} r={n.r}
              fill={n.primary ? '#00F5FF' : i % 3 === 0 ? '#94FBAB' : '#00F5FF'}
              opacity={n.primary ? 1 : 0.55}
              filter={n.primary ? 'url(#glow-lg)' : 'url(#glow-sm)'}
            />
          </motion.g>
        ))}

        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`p-${i}`}
            r={i === 0 ? 3 : 2}
            fill={i % 2 === 0 ? '#00F5FF' : '#94FBAB'}
            filter="url(#glow-sm)"
            opacity={0.8}
            style={{ transformOrigin: '200px 200px' }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 14 + i * 4, repeat: Infinity, ease: 'linear', delay: i * 3 }}
            cx={200 + 138}
            cy={200 + (i * 40 - 40)}
          />
        ))}
      </svg>
    </motion.div>
  );
}
