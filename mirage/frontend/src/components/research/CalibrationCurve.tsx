'use client'

import HudPanel from '@/components/HudPanel'

export default function CalibrationCurve({
  points,
}: {
  points: { predicted: number; empirical: number; count: number }[]
}) {
  const W = 280, H = 240, pad = 30
  const sx = (v: number) => pad + v * (W - 2 * pad)
  const sy = (v: number) => H - pad - v * (H - 2 * pad)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.predicted)} ${sy(p.empirical)}`).join(' ')

  return (
    <HudPanel title="Calibration" subtitle="predicted vs empirical P(malicious)" accent="violet" className="h-full" bodyClassName="p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full hud-grid-bg rounded">
        {/* perfect calibration diagonal */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={pad} stroke="#374151" strokeDasharray="3 4" strokeWidth={0.8} />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#1f2937" />
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#1f2937" />
        <path d={path} fill="none" stroke="#A78BFA" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 4px #A78BFA)' }} />
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.predicted)} cy={sy(p.empirical)} r={3 + Math.min(p.count / 60, 4)} fill="#A78BFA" opacity={0.8} />
        ))}
        <text x={W / 2} y={H - 6} fill="#6b7280" fontSize="8" textAnchor="middle" className="font-mono">PREDICTED →</text>
        <text x={10} y={H / 2} fill="#6b7280" fontSize="8" textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`} className="font-mono">EMPIRICAL →</text>
      </svg>
      <p className="text-[10px] text-gray-500 mt-1 text-center font-mono">closer to the diagonal = better-calibrated probabilities</p>
    </HudPanel>
  )
}
