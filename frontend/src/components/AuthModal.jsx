import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signup as apiSignup, login as apiLogin } from '../api/papers';

export default function AuthModal({ onSuccess, onClose }) {
  const [mode,     setMode]     = useState('login');   // 'login' | 'signup'
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await apiLogin({ email, password });
      } else {
        res = await apiSignup({ email, username, password });
      }
      // Persist token and user info
      localStorage.setItem('krypton_token', res.access_token);
      localStorage.setItem('krypton_user', JSON.stringify({
        user_id:  res.user_id,
        email:    res.email,
        username: res.username,
      }));
      onSuccess({
        user_id:  res.user_id,
        email:    res.email,
        username: res.username,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md flex flex-col rounded-lg border border-k-border overflow-hidden"
        style={{ background: '#0F1113' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-k-border">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-xl text-white">
              {isLogin ? 'Sign in to Krypton' : 'Create your account'}
            </h2>
            <p className="font-mono text-[10px] text-k-muted tracking-wider">
              {isLogin ? 'YOUR PROFILE SYNCS ACROSS ALL SESSIONS' : 'FREE — NO CREDIT CARD REQUIRED'}
            </p>
          </div>
          <button onClick={onClose}
            className="font-mono text-[11px] text-k-muted hover:text-white px-3 py-1.5 border border-k-border rounded-sm transition-all">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-k-border">
          {['login', 'signup'].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(null); }}
              className="flex-1 py-3 font-mono text-[11px] tracking-widest uppercase transition-all relative"
              style={{ color: mode === m ? '#00F5FF' : '#8A9BAE', background: mode === m ? 'rgba(0,245,255,0.04)' : 'transparent' }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
              {mode === m && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-k-cyan" />}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-6">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-k-muted tracking-widest">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-sm border border-k-border bg-transparent text-white font-mono text-sm placeholder-k-muted outline-none transition-all"
              style={{ caretColor: '#00F5FF' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.5)'; }}
              onBlur={(e) =>  { e.currentTarget.style.borderColor = '#2A2D30'; }}
            />
          </div>

          {/* Username (signup only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-1.5 overflow-hidden"
              >
                <label className="font-mono text-[10px] text-k-muted tracking-widest">USERNAME</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_handle"
                  minLength={2}
                  className="w-full px-4 py-3 rounded-sm border border-k-border bg-transparent text-white font-mono text-sm placeholder-k-muted outline-none transition-all"
                  style={{ caretColor: '#00F5FF' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.5)'; }}
                  onBlur={(e) =>  { e.currentTarget.style.borderColor = '#2A2D30'; }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-k-muted tracking-widest">PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
              minLength={6}
              className="w-full px-4 py-3 rounded-sm border border-k-border bg-transparent text-white font-mono text-sm placeholder-k-muted outline-none transition-all"
              style={{ caretColor: '#00F5FF' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.5)'; }}
              onBlur={(e) =>  { e.currentTarget.style.borderColor = '#2A2D30'; }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm font-mono"
              style={{ background: 'rgba(255,60,60,0.07)', borderColor: 'rgba(255,60,60,0.3)', color: '#FF6B6B' }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-sm font-mono text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50"
            style={{ background: '#00F5FF', color: '#0B0D0E' }}
          >
            {loading ? '⟳ Please wait…' : isLogin ? 'Sign In →' : 'Create Account →'}
          </button>

          <p className="text-center font-mono text-[10px] text-k-muted">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(null); }}
              className="text-k-cyan hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
