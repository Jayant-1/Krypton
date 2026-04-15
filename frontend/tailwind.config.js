/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        'k-dark':    '#0B0D0E',
        'k-surface': '#16181A',
        'k-border':  '#2A2D30',
        'k-cyan':    '#00F5FF',
        'k-mint':    '#94FBAB',
        'k-text':    '#E8EAF0',
        'k-muted':   '#8A9BAE',
      },
      animation: {
        'float':      'float 8s ease-in-out infinite',
        'blink':      'blink 1s step-end infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'scan':       'scan 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 1px #00F5FF, 0 0 15px rgba(0,245,255,0.12)' },
          '50%':      { boxShadow: '0 0 0 1px #00F5FF, 0 0 30px rgba(0,245,255,0.28)' },
        },
        scan: {
          '0%':       { transform: 'translateY(0%)' },
          '50%':      { transform: 'translateY(100%)' },
          '100%':     { transform: 'translateY(0%)' },
        },
      },
    },
  },
  plugins: [],
}
