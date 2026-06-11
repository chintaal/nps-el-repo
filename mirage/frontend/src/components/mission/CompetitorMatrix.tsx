'use client'

import { useState } from 'react'
import HudPanel from '@/components/HudPanel'
import { COMPETITORS } from '@/data/venture'

// Scatter: x = intel yield, y = attacker engagement, dot size = latency budget.
export default function CompetitorMatrix() {
  const [hover, setHover] = useState<number | null>(null)
  const W = 360, H = 300, pad = 34

  const sx = (v: number) => pad + (v / 100) * (W - 2 * pad)
  const sy = (v: number) => H - pad - (v / 100) * (H - 2 * pad)

  return (
    <HudPanel title="Competitive Field" subtitle="intel × engagement" accent="violet" className="h-full" bodyClassName="p-3 relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full hud-grid-bg rounded">
        {/* axes */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#1f2937" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#1f2937" />
        <text x={W / 2} y={H - 6} fill="#6b7280" fontSize="9" textAnchor="middle" className="font-mono">INTEL YIELD →</text>
        <text x={12} y={H / 2} fill="#6b7280" fontSize="9" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} className="font-mono">ENGAGEMENT →</text>
        {COMPETITORS.map((c, i) => {
          const color = c.us ? '#22D3EE' : '#6b7280'
          const rad = 4 + (c.latency / 100) * 8
          return (
            <g key={c.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
              {c.us && <circle cx={sx(c.intel)} cy={sy(c.engagement)} r={rad + 6} fill="none" stroke="#22D3EE" strokeWidth={0.5} opacity={0.4} className="animate-pulse" />}
              <circle cx={sx(c.intel)} cy={sy(c.engagement)} r={rad} fill={color} opacity={c.us ? 0.95 : 0.6} style={c.us ? { filter: 'drop-shadow(0 0 8px #22D3EE)' } : {}} />
              <text x={sx(c.intel)} y={sy(c.engagement) - rad - 4} fill={c.us ? '#22D3EE' : '#9ca3af'} fontSize="9" textAnchor="middle" className="font-display">
                {c.name}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="absolute bottom-2 left-2 right-2 hud-surface rounded px-3 py-1.5 text-[11px] text-gray-400 pointer-events-none">
          <span className="text-mirage-violet font-display">{COMPETITORS[hover].name}</span> · {COMPETITORS[hover].note}
        </div>
      )}
    </HudPanel>
  )
}
