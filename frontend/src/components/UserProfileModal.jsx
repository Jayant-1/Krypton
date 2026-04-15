import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTERESTS = [
  'AI', 'ML', 'NLP', 'Computer Vision', 'Robotics',
  'Security', 'Healthcare', 'Data Science', 'Quantum Computing',
  'Reinforcement Learning', 'Generative AI', 'LLMs', 'Bioinformatics',
];

const SKILL_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'New to research, want simple explanations' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Familiar with the domain, want methodology focus' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Expert researcher, want full technical depth' },
];

const GOALS = [
  { id: 'learning',  label: '📚 Learning',  desc: 'Build foundational knowledge step by step' },
  { id: 'research',  label: '🔬 Research',  desc: 'Conduct academic research and find gaps' },
  { id: 'startup',   label: '🚀 Startup',   desc: 'Find market opportunities and project ideas' },
];

export const DEFAULT_PROFILE = {
  interests:    [],
  skill_level:  'intermediate',
  prefer_recent: false,
  goal:         'research',
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem('krypton_profile');
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : null;
  } catch { return null; }
}

export function saveProfile(profile) {
  localStorage.setItem('krypton_profile', JSON.stringify(profile));
}

export default function UserProfileModal({ profile, onSave, onClose, isOnboarding = false }) {
  const [interests,    setInterests]    = useState(profile?.interests    ?? []);
  const [skill_level,  setSkillLevel]   = useState(profile?.skill_level  ?? 'intermediate');
  const [prefer_recent, setPreferRecent] = useState(profile?.prefer_recent ?? false);
  const [goal,         setGoal]         = useState(profile?.goal         ?? 'research');
  const [step,         setStep]         = useState(isOnboarding ? 0 : 2); // 0=interests, 1=skill, 2=goal

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    const newProfile = { interests, skill_level, prefer_recent, goal };
    saveProfile(newProfile);
    onSave(newProfile);
    onClose();
  };

  const steps = isOnboarding ? ['INTERESTS', 'SKILL LEVEL', 'GOAL'] : null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-2xl flex flex-col rounded-lg border border-k-border overflow-hidden"
        style={{ background: '#0F1113', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-k-border">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-lg text-white">
              {isOnboarding ? '👋 Welcome to Krypton' : 'Edit Your Research Profile'}
            </h2>
            <p className="font-mono text-[10px] text-k-muted tracking-wider">
              {isOnboarding
                ? 'TELL US ABOUT YOURSELF — PERSONALISES YOUR EXPERIENCE'
                : 'CHANGES APPLY TO SEARCH RANKING, SUMMARIES, AND TOPIC SUGGESTIONS'}
            </p>
          </div>
          {!isOnboarding && (
            <button onClick={onClose}
              className="font-mono text-[11px] text-k-muted hover:text-white px-3 py-1.5 border border-k-border rounded-sm transition-all">
              ✕ CLOSE
            </button>
          )}
        </div>

        {/* Step tabs (onboarding only) */}
        {steps && (
          <div className="flex border-b border-k-border">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="flex-1 py-2.5 font-mono text-[10px] tracking-widest transition-all relative"
                style={{ color: step === i ? '#00F5FF' : '#8A9BAE', background: step === i ? 'rgba(0,245,255,0.04)' : 'transparent' }}>
                {i + 1}. {s}
                {step === i && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-k-cyan" />}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* ── Interests ──────────────────────────────────────────────── */}
          {(!isOnboarding || step === 0) && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-mono text-xs text-white tracking-widest">RESEARCH INTERESTS</h3>
                <p className="font-mono text-[10px] text-k-muted">Select topics that match your work — used to boost relevant papers</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((item) => {
                  const active = interests.includes(item);
                  return (
                    <button key={item} onClick={() => toggleInterest(item)}
                      className="font-mono text-[11px] px-3 py-1.5 rounded-sm border transition-all duration-150"
                      style={{
                        borderColor: active ? 'rgba(0,245,255,0.5)' : '#2A2D30',
                        color:       active ? '#00F5FF'              : '#8A9BAE',
                        background:  active ? 'rgba(0,245,255,0.08)' : 'transparent',
                      }}>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Skill Level ────────────────────────────────────────────── */}
          {(!isOnboarding || step === 1) && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-mono text-xs text-white tracking-widest">SKILL LEVEL</h3>
                <p className="font-mono text-[10px] text-k-muted">Adjusts summary depth and topic difficulty</p>
              </div>
              <div className="flex flex-col gap-2">
                {SKILL_LEVELS.map(({ id, label, desc }) => {
                  const active = skill_level === id;
                  return (
                    <button key={id} onClick={() => setSkillLevel(id)}
                      className="flex items-center gap-4 px-4 py-3 rounded-md border text-left transition-all duration-150"
                      style={{
                        borderColor: active ? 'rgba(0,245,255,0.4)' : '#2A2D30',
                        background:  active ? 'rgba(0,245,255,0.06)' : 'transparent',
                      }}>
                      <div className="w-3 h-3 rounded-full border-2 flex-none transition-all"
                        style={{ borderColor: active ? '#00F5FF' : '#2A2D30', background: active ? '#00F5FF' : 'transparent' }} />
                      <div>
                        <p className="font-mono text-sm text-white">{label}</p>
                        <p className="font-mono text-[10px] text-k-muted">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Prefer recent toggle */}
              <button onClick={() => setPreferRecent(!prefer_recent)}
                className="flex items-center gap-3 px-4 py-3 rounded-md border transition-all duration-150 text-left"
                style={{
                  borderColor: prefer_recent ? 'rgba(148,251,171,0.4)' : '#2A2D30',
                  background:  prefer_recent ? 'rgba(148,251,171,0.06)' : 'transparent',
                }}>
                <div className="w-8 h-4 rounded-full border flex items-center transition-all relative"
                  style={{ borderColor: prefer_recent ? '#94FBAB' : '#2A2D30', background: prefer_recent ? 'rgba(148,251,171,0.2)' : 'transparent' }}>
                  <div className="w-3 h-3 rounded-full transition-all absolute"
                    style={{ background: prefer_recent ? '#94FBAB' : '#2A2D30', left: prefer_recent ? '14px' : '1px' }} />
                </div>
                <div>
                  <p className="font-mono text-sm text-white">Prefer Recent Papers</p>
                  <p className="font-mono text-[10px] text-k-muted">Boosts recency weight — better for fast-moving fields like LLMs</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Goal ───────────────────────────────────────────────────── */}
          {(!isOnboarding || step === 2) && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-mono text-xs text-white tracking-widest">PRIMARY GOAL</h3>
                <p className="font-mono text-[10px] text-k-muted">Shapes topic suggestions and market gap analysis</p>
              </div>
              <div className="flex flex-col gap-2">
                {GOALS.map(({ id, label, desc }) => {
                  const active = goal === id;
                  return (
                    <button key={id} onClick={() => setGoal(id)}
                      className="flex items-center gap-4 px-4 py-3 rounded-md border text-left transition-all duration-150"
                      style={{
                        borderColor: active ? 'rgba(148,251,171,0.4)' : '#2A2D30',
                        background:  active ? 'rgba(148,251,171,0.06)' : 'transparent',
                      }}>
                      <div className="w-3 h-3 rounded-full border-2 flex-none transition-all"
                        style={{ borderColor: active ? '#94FBAB' : '#2A2D30', background: active ? '#94FBAB' : 'transparent' }} />
                      <div>
                        <p className="font-mono text-sm text-white">{label}</p>
                        <p className="font-mono text-[10px] text-k-muted">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-k-border gap-4">
          {isOnboarding && (
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)}
                  className="font-mono text-[11px] px-4 py-2 border border-k-border text-k-muted hover:text-white rounded-sm tracking-widest transition-all">
                  ← BACK
                </button>
              )}
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            {isOnboarding && step < 2 ? (
              <button onClick={() => setStep(step + 1)}
                className="font-mono text-[11px] px-6 py-2 rounded-sm tracking-widest transition-all"
                style={{ background: '#00F5FF', color: '#0B0D0E' }}>
                NEXT →
              </button>
            ) : (
              <button onClick={handleSave}
                className="font-mono text-[11px] px-6 py-2 rounded-sm tracking-widest transition-all"
                style={{ background: '#00F5FF', color: '#0B0D0E' }}>
                {isOnboarding ? '🚀 START EXPLORING' : 'SAVE PROFILE'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
