'use client'

import { useState } from 'react'
import HudPanel from '@/components/HudPanel'
import { RISKS_OPPS } from '@/data/venture'

// 2×2 map: x = likelihood, y = impact. Risks red, opportunities emerald.
export default function RiskOpportunityGrid() {
  const [hover, setHover] = useState<number | null>(null)
  const W = 360, H = 300, pad = 30
  const sx = (v: number) => pad + v * (W - 2 * pad)
  const sy = (v: number) => H - pad - v * (H - 2 * pad)

  return (
    <HudPanel title="Risk / Opportunity" subtitle="impact × likelihood" accent="red" className="h-full" bodyClassName="p-3 relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="#1f2937" strokeDasharray="3 4" />
        <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#1f2937" strokeDasharray="3 4" />
        <text x={W - pad} y={H - 8} fill="#6b7280" fontSize="9" textAnchor="end" className="font-mono">LIKELIHOOD →</text>
        <text x={12} y={pad + 4} fill="#6b7280" fontSize="9" className="font-mono">IMPACT ↑</text>
        {RISKS_OPPS.map((r, i) => {
          const color = r.kind === 'risk' ? '#EF4444' : '#34D399'
          return (
            <g key={r.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
              <circle cx={sx(r.likelihood)} cy={sy(r.impact)} r={hover === i ? 8 : 5.5} fill={color} opacity={0.85} style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'r 0.2s' }} />
            </g>
          )
        })}
      </svg>
      <div className="absolute top-3 right-3 flex gap-2 text-[9px] font-mono">
        <span className="text-mirage-red">● risk</span>
        <span className="text-mirage-emerald">● opp</span>
      </div>
      {hover !== null && (
        <div className="absolute bottom-2 left-2 right-2 hud-surface rounded px-3 py-1.5 text-[11px] pointer-events-none">
          <span style={{ color: RISKS_OPPS[hover].kind === 'risk' ? '#EF4444' : '#34D399' }} className="font-display">
            {RISKS_OPPS[hover].label}
          </span>
          <span className="text-gray-400"> · {RISKS_OPPS[hover].note}</span>
        </div>
      )}
    </HudPanel>
  )
}
