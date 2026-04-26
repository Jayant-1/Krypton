import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Reading Plan", href: "#reading-plan" },
  { label: "How It Works", href: "#how-it-works" },
];

export default function Navbar({
  onOpenProfile,
  profile,
  user,
  onOpenAuth,
  onLogout,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const hasProfile = profile?.interests?.length > 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 pt-5"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between px-6 py-3 rounded-lg border border-k-border transition-all duration-300 ${
            scrolled ? "py-2.5" : "py-3.5"
          }`}
          style={{
            background: "rgba(11,13,14,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 group">
            <div className="relative flex items-center">
              <span className="font-serif text-xl font-medium text-white tracking-tight">
                Krypton
              </span>
              <span
                className="absolute -right-3 top-1 w-1.5 h-1.5 rounded-full bg-k-cyan"
                style={{ boxShadow: "0 0 8px #00F5FF" }}
              />
            </div>
          </a>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="font-mono text-[11px] text-k-muted hover:text-k-cyan tracking-widest uppercase transition-colors duration-200 relative group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-k-cyan scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Profile button — only when logged in or has local profile */}
            {user && (
              <button
                onClick={onOpenProfile}
                title={
                  hasProfile
                    ? `Profile: ${profile.skill_level}`
                    : "Set up your profile"
                }
                className="flex items-center gap-2 font-mono text-[10px] px-3 py-2 border rounded-sm transition-all duration-200"
                style={{
                  borderColor: hasProfile ? "rgba(0,245,255,0.4)" : "#2A2D30",
                  color: hasProfile ? "#00F5FF" : "#8A9BAE",
                  background: hasProfile
                    ? "rgba(0,245,255,0.06)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,245,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = hasProfile
                    ? "rgba(0,245,255,0.4)"
                    : "#2A2D30";
                }}
              >
                <span>{"👤"}</span>
                <span className="hidden md:inline tracking-widest uppercase">
                  {user.username}
                </span>
              </button>
            )}

            {/* Auth button */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={onLogout}
                  className="font-mono text-[11px] px-3 py-2 border border-k-border text-k-muted hover:text-white hover:border-k-muted rounded-sm tracking-widest uppercase transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden md:block font-mono text-[11px] px-4 py-2 rounded-sm tracking-widest uppercase transition-all duration-200"
                style={{ background: "#00F5FF", color: "#0B0D0E" }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
