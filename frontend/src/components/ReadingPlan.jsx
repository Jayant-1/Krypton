import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const PAPERS = [
  {
    id: 1,
    title: 'Attention Is All You Need',
    authors: 'Vaswani, A. · Shazeer, N. · Parmar, N. et al.',
    year: '2017',
    venue: 'NeurIPS',
    citations: '104,291',
    relevance: '98.4',
    summary:
      'Introduces the Transformer architecture, a model based entirely on self-attention mechanisms that eliminates recurrence and convolutions. Demonstrates state-of-the-art results on machine translation tasks with significantly improved parallelisation. Forms the foundation of virtually every modern large language model.',
    contribution: 'Self-attention replaces recurrence for sequence modelling.',
    method: 'Multi-head scaled dot-product attention across encoder–decoder stacks.',
    impact: 'Catalysed the LLM era; cited over 100K times.',
    accentColor: '#00F5FF',
  },
  {
    id: 2,
    title: 'An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale',
    authors: 'Dosovitskiy, A. · Beyer, L. · Kolesnikov, A. et al.',
    year: '2020',
    venue: 'ICLR 2021',
    citations: '38,742',
    relevance: '94.7',
    summary:
      'Applies Transformers directly to sequences of image patches, bypassing convolutional neural networks entirely. When pre-trained on large datasets, Vision Transformers (ViT) match or exceed CNN performance on multiple benchmarks. Demonstrates that attention-based architectures transfer effectively to computer vision.',
    contribution: 'Patch-based tokenisation brings Transformers to image classification.',
    method: 'Linear projection of fixed-size image patches as input tokens.',
    impact: 'Sparked the ViT era; widely adopted in vision-language models.',
    accentColor: '#94FBAB',
  },
  {
    id: 3,
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: 'Devlin, J. · Chang, M.-W. · Lee, K. · Toutanova, K.',
    year: '2018',
    venue: 'NAACL 2019',
    citations: '82,154',
    relevance: '91.2',
    summary:
      'Proposes masked language modelling and next-sentence prediction for unsupervised pre-training of deep bidirectional representations. Fine-tuning BERT achieves new state-of-the-art results on eleven NLP tasks. Introduced the pre-train-then-fine-tune paradigm now standard across NLP.',
    contribution: 'Bidirectional pre-training enables universal NLP representations.',
    method: 'Masked token prediction + next-sentence prediction on large corpora.',
    impact: 'Pre-train-then-fine-tune became the dominant NLP paradigm.',
    accentColor: '#00F5FF',
  },
];

function PaperCard({ paper, index }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex flex-col rounded-md border border-k-border overflow-hidden transition-all duration-300 cursor-pointer"
      style={{ background: '#16181A' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = paper.accentColor;
        e.currentTarget.style.boxShadow = `0 0 28px rgba(0,245,255,0.08)`;
        e.currentTarget.style.background = '#181B1D';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2A2D30';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = '#16181A';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top accent line */}
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${paper.accentColor}60, transparent)` }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-normal text-white leading-snug mb-2">
            {paper.title}
          </h3>
          <p className="font-mono text-[10px] text-k-muted tracking-wider">
            {paper.authors} · {paper.year}
          </p>
        </div>

        {/* Relevance badge */}
        <div
          className="flex-none flex flex-col items-end gap-0.5"
        >
          <span className="font-mono text-[10px] text-k-muted tracking-wider">RELEVANCE</span>
          <span
            className="font-mono text-xl font-medium"
            style={{ color: paper.accentColor, textShadow: `0 0 12px ${paper.accentColor}60` }}
          >
            {paper.relevance}%
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-k-border" />

      {/* Summary */}
      <div className="px-6 py-4 flex-1">
        <p className="text-k-muted text-sm leading-relaxed">{paper.summary}</p>
      </div>

      {/* Tags */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Contribution', value: paper.contribution },
          { label: 'Method',       value: paper.method       },
          { label: 'Impact',       value: paper.impact       },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 px-3 py-2 rounded-sm border border-k-border"
            style={{ background: 'rgba(11,13,14,0.6)' }}
          >
            <span className="font-mono text-[9px] tracking-widest text-k-muted uppercase">{label}</span>
            <span className="font-sans text-[11px] text-k-text leading-tight">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-k-border">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-k-muted">
            <span className="text-white">{paper.citations}</span> citations
          </span>
          <div className="w-px h-3 bg-k-border" />
          <span className="font-mono text-[10px] text-k-muted">{paper.venue}</span>
        </div>
        <span
          className="font-mono text-[10px] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: paper.accentColor }}
        >
          VIEW PAPER →
        </span>
      </div>
    </motion.article>
  );
}

export default function ReadingPlan() {
  const headRef  = useRef(null);
  const headView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="reading-plan" className="px-6 md:px-12 py-24">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div ref={headRef} className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.4,0,0.2,1] }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-5 h-px bg-k-cyan" />
            <span className="font-mono text-[11px] text-k-cyan tracking-[0.2em] uppercase">Reading Plan</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.4,0,0.2,1] }}
            className="font-serif text-4xl md:text-5xl text-white font-light max-w-2xl leading-tight"
          >
            A Reading Plan,<br />Not Just Search Results.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.4,0,0.2,1] }}
            className="text-k-muted text-base leading-relaxed mt-4 max-w-xl"
          >
            Krypton ranks papers by relevance, recency, and citation weight — then
            surfaces exactly what you need to read and why.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PAPERS.map((paper, i) => (
            <PaperCard key={paper.id} paper={paper} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
