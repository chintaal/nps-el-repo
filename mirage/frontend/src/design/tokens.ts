// Mirage HUD design tokens — the single source for colour + motion language.
// Components import these so the whole OS animates and reads as one system.

export const COLORS = {
  bg: '#030712',
  panel: '#0d1117',
  border: '#1f2937',
  cyan: '#22D3EE',
  emerald: '#34D399',
  red: '#EF4444',
  yellow: '#FACC15',
  violet: '#A78BFA',
  dim: '#374151',
  grid: 'rgba(34,211,238,0.08)',
} as const

// State → colour, shared by every session-aware surface.
export const STATE_COLOR: Record<string, string> = {
  CLEAN: COLORS.emerald,
  SUSPECT: COLORS.yellow,
  DECEPTION_ENGAGED: COLORS.red,
  TERMINATED: COLORS.dim,
}

// Motion tokens — reused across framer-motion transitions for a coherent feel.
export const MOTION = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number], // expo-out
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
}

// Cinematic enter used by the route template + section reveals.
export const ENTER = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: MOTION.base, ease: MOTION.ease },
}

export const STAGGER = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const ITEM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: MOTION.fast, ease: MOTION.ease } },
}
