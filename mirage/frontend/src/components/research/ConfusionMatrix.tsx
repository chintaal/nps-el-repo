'use client'

import HudPanel from '@/components/HudPanel'

export default function ConfusionMatrix({
  c,
  precision,
  recall,
  f1,
}: {
  c: { tn: number; fp: number; fn: number; tp: number }
  precision: number
  recall: number
  f1: number
}) {
  const max = Math.max(c.tn, c.fp, c.fn, c.tp, 1)
  const cell = (v: number, good: boolean, label: string) => (
    <div
      className="relative rounded flex flex-col items-center justify-center aspect-square"
      style={{
        background: good
          ? `rgba(52,211,153,${0.1 + 0.5 * (v / max)})`
          : `rgba(239,68,68,${0.1 + 0.5 * (v / max)})`,
        border: '1px solid rgba(31,41,55,0.8)',
      }}
    >
      <span className="font-display font-bold text-2xl text-gray-100">{v}</span>
      <span className="text-[9px] text-gray-400 font-mono tracking-wider">{label}</span>
    </div>
  )

  return (
    <HudPanel title="Confusion Matrix" subtitle="@ engage threshold" accent="emerald" className="h-full" bodyClassName="p-3 flex flex-col">
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {cell(c.tp, true, 'TP · caught')}
        {cell(c.fn, false, 'FN · missed')}
        {cell(c.fp, false, 'FP · false')}
        {cell(c.tn, true, 'TN · clean')}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Mini label="Precision" v={precision} />
        <Mini label="Recall" v={recall} />
        <Mini label="F1" v={f1} />
      </div>
    </HudPanel>
  )
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="hud-surface rounded p-2 text-center">
      <div className="text-[9px] text-gray-500 font-mono tracking-widest">{label}</div>
      <div className="font-display font-bold text-mirage-emerald text-lg">{v.toFixed(2)}</div>
    </div>
  )
}
