'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import HudPanel from '@/components/HudPanel'
import { ROADMAP } from '@/data/venture'

const STATUS = {
  shipped: { color: 'border-mirage-emerald/50 bg-mirage-emerald/5', dot: 'bg-mirage-emerald', text: 'text-mirage-emerald', tag: 'SHIPPED' },
  active: { color: 'border-mirage-cyan/60 bg-mirage-cyan/10 shadow-glowcyan', dot: 'bg-mirage-cyan animate-pulse', text: 'text-mirage-cyan', tag: 'ACTIVE' },
  locked: { color: 'border-mirage-border bg-mirage-bg/40 opacity-70', dot: 'bg-gray-600', text: 'text-gray-500', tag: 'LOCKED' },
} as const

/** Phased roadmap as a horizontal tech-tree with unlock dependencies. */
export default function RoadmapTechTree() {
  return (
    <HudPanel title="Roadmap Tech-Tree" subtitle="phase 0 → 3 · dependency unlocks" accent="cyan" className="h-full" bodyClassName="p-4 overflow-auto">
      <div className="flex gap-3 min-w-max h-full items-stretch">
        {ROADMAP.map((p, i) => {
          const s = STATUS[p.status]
          return (
            <div key={p.id} className="flex items-stretch gap-3">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={clsx('w-60 rounded-lg border p-3 flex flex-col', s.color)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={clsx('w-2 h-2 rounded-full', s.dot)} />
                    <span className={clsx('text-[10px] font-display tracking-widest', s.text)}>{s.tag}</span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">{p.horizon}</span>
                </div>
                <h4 className="font-display font-bold text-sm text-gray-200 mt-2 leading-tight">{p.name}</h4>
                <ul className="mt-2 space-y-1 flex-1">
                  {p.items.map((it) => (
                    <li key={it} className="text-[11px] text-gray-400 flex gap-1.5">
                      <span className={s.text}>▸</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              {i < ROADMAP.length - 1 && (
                <div className="flex items-center">
                  <div className="w-6 h-[1px] bg-gradient-to-r from-mirage-cyan/50 to-transparent" />
                  <span className="text-mirage-cyan/60 text-xs">▶</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </HudPanel>
  )
}
