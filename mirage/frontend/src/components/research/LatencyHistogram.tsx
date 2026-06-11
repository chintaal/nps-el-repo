'use client'

import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'
import { ResearchResponse } from '@/lib/api'

export default function LatencyHistogram({ latency }: { latency: NonNullable<ResearchResponse['latency']> }) {
  const max = Math.max(...latency.histogram.map((h) => h.count), 1)
  const budgetIdx = latency.histogram.findIndex((h) => h.hi >= latency.budget_ms)

  return (
    <HudPanel
      title="Latency Profile"
      subtitle={`p95 ${latency.p95_ms}ms · budget ${latency.budget_ms}ms`}
      accent={latency.p95_ms < latency.budget_ms ? 'emerald' : 'red'}
      className="h-full"
      bodyClassName="p-3 flex flex-col"
    >
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat label="p50" v={latency.p50_ms} />
        <Stat label="p95" v={latency.p95_ms} />
        <Stat label="p99" v={latency.p99_ms} />
        <Stat label="max" v={latency.max_ms} />
      </div>
      <div className="flex-1 flex items-end gap-1 relative">
        {budgetIdx >= 0 && (
          <div
            className="absolute top-0 bottom-5 border-l border-dashed border-mirage-red/70 z-10"
            style={{ left: `${(budgetIdx / latency.histogram.length) * 100}%` }}
          >
            <span className="absolute -top-1 left-1 text-[8px] text-mirage-red font-mono">100ms</span>
          </div>
        )}
        {latency.histogram.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(h.count / max) * 100}%` }}
              transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t"
              style={{ background: h.hi <= latency.budget_ms ? 'linear-gradient(180deg,#34D399,#22D3EE)' : '#EF4444', minHeight: h.count ? 2 : 0 }}
              title={`${h.range}: ${h.count}`}
            />
            <span className="text-[7px] text-gray-600 font-mono mt-1 rotate-0 truncate w-full text-center">{h.lo}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-[10px] text-mirage-emerald font-mono mt-2">
        {latency.under_budget_pct}% of requests under {latency.budget_ms}ms
      </div>
    </HudPanel>
  )
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="hud-surface rounded p-1.5 text-center">
      <div className="text-[9px] text-gray-500 font-mono">{label}</div>
      <div className="font-display font-bold text-mirage-cyan text-sm">{v.toFixed(1)}<span className="text-[8px] text-gray-500">ms</span></div>
    </div>
  )
}
