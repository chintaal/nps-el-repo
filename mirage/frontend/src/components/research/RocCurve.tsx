'use client'

import HudPanel from '@/components/HudPanel'
import { polyline } from '@/components/viz/primitives'

export default function RocCurve({
  roc,
  pr,
  rocAuc,
  prAuc,
}: {
  roc: [number, number][]
  pr: [number, number][]
  rocAuc: number
  prAuc: number
}) {
  const W = 300, H = 260, pad = 28
  const sx = (v: number) => pad + v * (W - 2 * pad)
  const sy = (v: number) => H - pad - v * (H - 2 * pad)
  const rocPath = roc.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ')
  const prPath = pr.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ')

  return (
    <HudPanel title="ROC / PR" subtitle="detector discrimination" accent="cyan" className="h-full" bodyClassName="p-3">
      <div className="flex items-center justify-between mb-2">
        <Stat label="ROC-AUC" v={rocAuc} color="#22D3EE" />
        <Stat label="PR-AUC" v={prAuc} color="#A78BFA" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full hud-grid-bg rounded">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={pad} stroke="#374151" strokeDasharray="3 4" strokeWidth={0.8} />
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#1f2937" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#1f2937" />
        <path d={prPath} fill="none" stroke="#A78BFA" strokeWidth={1.5} opacity={0.7} />
        <path d={rocPath} fill="none" stroke="#22D3EE" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 4px #22D3EE)' }} />
        <text x={W / 2} y={H - 6} fill="#6b7280" fontSize="8" textAnchor="middle" className="font-mono">FPR / RECALL →</text>
      </svg>
      <div className="flex gap-3 mt-1 text-[9px] font-mono">
        <span className="text-mirage-cyan">— ROC</span>
        <span className="text-mirage-violet">— PR</span>
      </div>
    </HudPanel>
  )
}

function Stat({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div>
      <span className="text-[9px] text-gray-500 font-mono tracking-widest">{label}</span>
      <div className="font-display font-bold text-xl" style={{ color }}>{v.toFixed(3)}</div>
    </div>
  )
}
