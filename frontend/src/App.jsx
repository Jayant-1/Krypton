import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar          from './components/Navbar';
import Hero            from './components/Hero';
import MetricsStrip    from './components/MetricsStrip';
import ReadingPlan     from './components/ReadingPlan';
import Features        from './components/Features';
import HowItWorks      from './components/HowItWorks';
import FinalCTA        from './components/FinalCTA';
import SearchResults   from './components/SearchResults';
import InsightModal    from './components/InsightModal';
import ResearchGaps    from './components/ResearchGaps';
import UserProfileModal, { loadProfile, DEFAULT_PROFILE, saveProfile } from './components/UserProfileModal';
import TopicCards      from './components/TopicCards';
import AuthModal       from './components/AuthModal';

import { getHealth, searchPapers, getUserProfile, saveUserProfile } from './api/papers';

export default function App() {
  const [health,        setHealth]        = useState(null);
  const [searchResult,  setSearchResult]  = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [initialTab,    setInitialTab]    = useState('summary');
  const [showGaps,      setShowGaps]      = useState(false);
  // Personalization
  const [profile,       setProfile]       = useState(null);
  const [showProfile,   setShowProfile]   = useState(false);
  const [isOnboarding,  setIsOnboarding]  = useState(false);
  // Auth
  const [user,          setUser]          = useState(null);   // { user_id, email, username }
  const [showAuth,      setShowAuth]      = useState(false);

  // ── Health check + auth/profile load on mount ───────────────────────
  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', gemini_configured: false }));

    // Restore auth session from localStorage
    const storedUser = localStorage.getItem('krypton_user');
    const storedToken = localStorage.getItem('krypton_token');
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Load profile from server
      getUserProfile()
        .then((p) => {
          const merged = { interests: p.interests, skill_level: p.skill_level, prefer_recent: p.prefer_recent, goal: p.goal };
          setProfile(merged);
          saveProfile(merged); // keep localStorage in sync
        })
        .catch(() => {
          // Fallback to localStorage profile
          const saved = loadProfile();
          if (saved) setProfile(saved);
        });
    } else {
      // Guest: load from localStorage
      const saved = loadProfile();
      if (saved) {
        setProfile(saved);
      } else {
        setIsOnboarding(true);
        setShowProfile(true);
      }
    }
  }, []);

  // ── Search handler ──────────────────────────────────────────────────
  const handleSearch = async (params) => {
    setLoading(true);
    setError(null);
    setShowGaps(false);
    // Merge user profile into search params
    const enriched = {
      ...params,
      user_interests: profile?.interests    ?? [],
      skill_level:    profile?.skill_level  ?? 'all',
      prefer_recent:  profile?.prefer_recent ?? false,
      goal:           profile?.goal         ?? 'research',
    };
    try {
      const result = await searchPapers(enriched);
      setSearchResult(result);
      setTimeout(() => {
        document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (e) {
      setError(e.message);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setError(null);
    setShowGaps(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPaper = (paper, tab = 'summary') => {
    setSelectedPaper(paper);
    setInitialTab(tab);
  };

  // Open gap analysis panel
  const handleAnalyzeGaps = () => {
    setShowGaps(true);
    setTimeout(() => {
      document.getElementById('research-gaps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ── Auth handlers ──────────────────────────────────────────────────────
  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    setShowAuth(false);
    // Load server-side profile
    try {
      const p = await getUserProfile();
      const merged = { interests: p.interests, skill_level: p.skill_level, prefer_recent: p.prefer_recent, goal: p.goal };
      setProfile(merged);
      saveProfile(merged);
    } catch {
      // New user: show onboarding so they set their profile
      setIsOnboarding(true);
      setShowProfile(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('krypton_token');
    localStorage.removeItem('krypton_user');
    setUser(null);
  };

  // ── Profile save (syncs to server when logged in) ────────────────────
  const handleProfileSave = async (newProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);           // always save to localStorage
    if (user) {
      try { await saveUserProfile(newProfile); } catch { /* non-fatal */ }
    }
  };

  const showStaticSections = !searchResult && !loading && !error;

  return (
    <div className="min-h-screen bg-k-dark text-k-text">
      <Navbar
        onOpenProfile={() => { setIsOnboarding(false); setShowProfile(true); }}
        profile={profile}
        user={user}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
      />

      {/* ── Gemini warning banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {health && !health.gemini_configured && health.status !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-[72px] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-md border text-sm font-mono"
              style={{
                background: 'rgba(255,200,50,0.07)',
                borderColor: 'rgba(255,200,50,0.3)',
                color: '#FFCE32',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span>⚠</span>
              <span className="text-[11px] tracking-wider">
                GEMINI API KEY NOT CONFIGURED — AI FEATURES UNAVAILABLE
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Backend offline banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {health?.status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-[72px] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-md border text-sm font-mono"
              style={{
                background: 'rgba(255,80,60,0.07)',
                borderColor: 'rgba(255,80,60,0.3)',
                color: '#FF6B6B',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span>✕</span>
              <span className="text-[11px] tracking-wider">
                BACKEND OFFLINE — START UVICORN AT PORT 8000
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero always visible */}
        <Hero onSearch={handleSearch} loading={loading} />

        {/* Search results section */}
        <AnimatePresence>
          {(searchResult || loading || error) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SearchResults
                result={searchResult}
                loading={loading}
                error={error}
                onClear={handleClearSearch}
                onSelectPaper={handleSelectPaper}
                onAnalyzeGaps={handleAnalyzeGaps}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Research Gaps section — shown below results when triggered */}
        <AnimatePresence>
          {showGaps && searchResult && (
            <div id="research-gaps">
              <ResearchGaps
                searchId={searchResult.search_id ?? 0}
                query={searchResult.query}
                papers={searchResult.papers ?? []}
                onClose={() => setShowGaps(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Static marketing sections + Topic Cards */}
        <AnimatePresence>
          {showStaticSections && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <MetricsStrip />
              {/* Topic Discovery — shown when profile is set */}
              <TopicCards
                profile={profile}
                onSearch={(query) => handleSearch({ query, max_results: 20 })}
              />
              <ReadingPlan />
              <Features />
              <HowItWorks />
              <FinalCTA />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-k-border px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg text-white">Krypton</span>
          <span className="font-mono text-xs text-k-muted tracking-wider">
            © {new Date().getFullYear()} — AI RESEARCH ASSISTANT
          </span>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: health?.status === 'ok' ? '#94FBAB' : '#FF6B6B',
                boxShadow: health?.status === 'ok' ? '0 0 6px #94FBAB' : '0 0 6px #FF6B6B',
              }}
            />
            <span className="font-mono text-xs text-k-muted">
              {health?.status === 'ok' ? 'SYSTEM ONLINE' : 'BACKEND OFFLINE'}
            </span>
            {health?.version && (
              <span className="font-mono text-xs text-k-muted opacity-50">v{health.version}</span>
            )}
          </div>
        </div>
      </footer>

      {/* Profile modal (onboarding or edit) */}
      <AnimatePresence>
        {showProfile && (
          <UserProfileModal
            profile={profile ?? DEFAULT_PROFILE}
            isOnboarding={isOnboarding}
            onSave={(p) => { handleProfileSave(p); setIsOnboarding(false); setShowProfile(false); }}
            onClose={() => { setShowProfile(false); setIsOnboarding(false); }}
          />
        )}
      </AnimatePresence>

      {/* Auth modal (login / signup) */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onSuccess={handleAuthSuccess}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>

      {/* Insight modal */}
      <AnimatePresence>
        {selectedPaper && (
          <InsightModal
            paper={selectedPaper}
            initialTab={initialTab}
            onClose={() => setSelectedPaper(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
