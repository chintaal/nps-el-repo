'use client'

import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'
import { ResearchResponse } from '@/lib/api'

export default function DeceptionQuality({ deception }: { deception: NonNullable<ResearchResponse['deception']> }) {
  return (
    <HudPanel
      title="Deception Quality Index"
      subtitle={`mean DQI ${deception.mean_dqi} · ${deception.judge_live ? 'LLM judge' : 'heuristic'}`}
      accent="emerald"
      className="h-full"
      bodyClassName="p-3 overflow-auto"
    >
      <div className="space-y-2.5">
        {deception.personas.map((p, i) => (
          <motion.div
            key={p.persona}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="hud-surface rounded p-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-display text-gray-200 tracking-wide truncate">{p.label}</span>
              <span className="font-display font-bold text-lg" style={{ color: dqiColor(p.dqi) }}>
                {p.dqi}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <SubBar label="Believe" v={p.believability} color="#22D3EE" />
              <SubBar label="Consist" v={p.consistency} color="#A78BFA" />
              <SubBar label="Intel" v={p.intel_extraction} color="#34D399" />
            </div>
            {p.broke_character && (
              <div className="text-[9px] text-mirage-red font-mono mt-1">⚠ broke character</div>
            )}
          </motion.div>
        ))}
      </div>
    </HudPanel>
  )
}

function SubBar({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[8px] font-mono text-gray-500">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="h-1.5 bg-mirage-bg/60 rounded overflow-hidden mt-0.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.6 }} className="h-full rounded" style={{ background: color }} />
      </div>
    </div>
  )
}

function dqiColor(v: number): string {
  if (v >= 75) return '#34D399'
  if (v >= 50) return '#FACC15'
  return '#EF4444'
}
