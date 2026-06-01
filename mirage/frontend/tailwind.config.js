/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      colors: {
        mirage: {
          bg: '#030712',
          panel: '#0d1117',
          border: '#1f2937',
          cyan: '#22D3EE',
          emerald: '#34D399',
          red: '#EF4444',
          yellow: '#FACC15',
          dim: '#374151',
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 200ms ease-out',
        'typewriter': 'typewriter 0.05s steps(1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px #22D3EE)' },
          '50%': { filter: 'drop-shadow(0 0 12px #22D3EE)' },
        },
      },
    },
  },
  plugins: [],
}
