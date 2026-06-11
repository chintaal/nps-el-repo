'use client'

import { useMemo, useState } from 'react'
import HudPanel from '@/components/HudPanel'
import { SYSTEMS, SysNode } from '@/data/venture'

const GROUP_COLOR: Record<string, string> = {
  ingress: '#22D3EE',
  detect: '#FACC15',
  ai: '#A78BFA',
  intel: '#34D399',
}

// Deterministic layered layout — columns by pipeline stage, animated data flow.
const COLUMNS: string[][] = [
  ['ingress'],
  ['patterns', 'features'],
  ['ensemble'],
  ['deception'],
  ['efficacy', 'mitre'],
  ['reporter', 'telemetry', 'janus'],
]

export default function SystemsGraph() {
  const [hover, setHover] = useState<SysNode | null>(null)

  const W = 720
  const H = 360
  const pos = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    COLUMNS.forEach((col, ci) => {
      const x = 60 + (ci * (W - 120)) / (COLUMNS.length - 1)
      col.forEach((id, ri) => {
        const y = (H * (ri + 1)) / (col.length + 1)
        map[id] = { x, y }
      })
    })
    return map
  }, [])

  return (
    <HudPanel title="Systems Graph" subtitle="detection → deception → intel" accent="cyan" className="h-full" bodyClassName="p-0 relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#22D3EE" opacity="0.6" />
          </marker>
        </defs>
        {SYSTEMS.edges.map((e, i) => {
          const a = pos[e.from], b = pos[e.to]
          if (!a || !b) return null
          const mx = (a.x + b.x) / 2
          const d = `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#1f2937" strokeWidth={1.5} markerEnd="url(#arrow)" />
              <path d={d} fill="none" stroke="#22D3EE" strokeWidth={1.5} opacity={0.5} className="animate-dash-flow" />
              {e.label && (
                <text x={mx} y={(a.y + b.y) / 2 - 4} fill="#6b7280" fontSize="8" textAnchor="middle" className="font-mono">
                  {e.label}
                </text>
              )}
            </g>
          )
        })}
        {SYSTEMS.nodes.map((n) => {
          const p = pos[n.id]
          if (!p) return null
          const color = GROUP_COLOR[n.group] ?? '#22D3EE'
          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            >
              <circle r={hover?.id === n.id ? 9 : 6} fill={color} opacity={0.9} style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'r 0.2s' }} />
              <circle r={14} fill="none" stroke={color} strokeWidth={0.5} opacity={0.3} />
              <text y={-18} fill="#cbd5e1" fontSize="9" textAnchor="middle" className="font-mono">
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover && (
        <div className="absolute bottom-2 left-2 right-2 hud-surface rounded px-3 py-2 pointer-events-none">
          <span className="font-display text-xs tracking-widest" style={{ color: GROUP_COLOR[hover.group] }}>
            {hover.label}
          </span>
          <p className="text-[11px] text-gray-400 mt-0.5">{hover.detail}</p>
        </div>
      )}
    </HudPanel>
  )
}
