'use client'

import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'
import { GROWTH_LOOP } from '@/data/venture'

/** The compounding loop rendered as a ring — each engagement sharpens the next. */
export default function GrowthEngine() {
  const n = GROWTH_LOOP.length
  const R = 92
  const cx = 130, cy = 130

  return (
    <HudPanel title="Growth Engine" subtitle="the deception flywheel" accent="cyan" className="h-full" bodyClassName="p-3 flex items-center justify-center">
      <svg viewBox="0 0 260 260" className="w-full max-w-[260px]">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1f2937" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#22D3EE" strokeWidth={1.5} strokeDasharray="4 10" className="animate-dash-flow" opacity={0.6} />
        {GROWTH_LOOP.map((g, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          const x = cx + R * Math.cos(angle)
          const y = cy + R * Math.sin(angle)
          return (
            <motion.g key={g.step} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 }}>
              <circle cx={x} cy={y} r={16} className="hud-surface" fill="#0d1117" stroke="#22D3EE" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.4))' }} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fill="#22D3EE">{g.icon}</text>
            </motion.g>
          )
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#22D3EE" className="font-display tracking-widest">FLYWHEEL</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#6b7280" className="font-mono">compounding intel</text>
      </svg>
      <div className="ml-2 space-y-1.5 flex-shrink-0">
        {GROWTH_LOOP.map((g, i) => (
          <div key={g.step} className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="text-mirage-cyan">{g.icon}</span>
            <span>{g.step}</span>
          </div>
        ))}
      </div>
    </HudPanel>
  )
}
