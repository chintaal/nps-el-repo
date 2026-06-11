'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import HudPanel from '@/components/HudPanel'
import { AnimatedNumber } from '@/components/viz/primitives'
import {
  DECISIONS,
  DecisionState,
  projectOutcome,
  SCENARIOS,
  ScenarioKey,
} from '@/data/venture'

/** Interactive futures — decision toggles deterministically recompute outcomes
 *  across Conservative → Moonshot. Pure client-side math from venture.ts. */
export default function ScenarioSimulator() {
  const [decisions, setDecisions] = useState<DecisionState>({
    distribution: 'oss',
    hosting: 'saas',
    funding: 'raise',
  })
  const [scenario, setScenario] = useState<ScenarioKey>('base')

  const outcome = useMemo(() => projectOutcome(decisions, scenario), [decisions, scenario])
  const tone = SCENARIOS.find((s) => s.key === scenario)!.tone

  const set = (id: keyof DecisionState, val: string) =>
    setDecisions((d) => ({ ...d, [id]: val }))

  return (
    <HudPanel title="Scenario Simulator" subtitle="decisions → futures" accent="yellow" className="h-full" bodyClassName="p-4 flex flex-col gap-4">
      {/* Scenario selector */}
      <div className="flex gap-1.5">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            onClick={() => setScenario(s.key)}
            className={clsx(
              'flex-1 py-1.5 rounded text-[10px] font-display tracking-widest transition-all border',
              scenario === s.key ? 'text-mirage-bg font-bold' : 'text-gray-400 border-mirage-border hover:text-gray-200',
            )}
            style={scenario === s.key ? { background: s.tone, borderColor: s.tone } : {}}
          >
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Decision toggles */}
      <div className="space-y-2">
        {DECISIONS.map((dec) => (
          <div key={dec.id} className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono w-24 tracking-wider uppercase">{dec.label}</span>
            <div className="flex-1 grid grid-cols-2 gap-1">
              {[dec.left, dec.right].map((opt) => (
                <button
                  key={opt}
                  onClick={() => set(dec.id, opt)}
                  className={clsx(
                    'py-1.5 rounded text-[11px] font-mono transition-all border',
                    (decisions as any)[dec.id] === opt
                      ? 'bg-mirage-cyan/15 text-mirage-cyan border-mirage-cyan/40'
                      : 'text-gray-500 border-mirage-border hover:text-gray-300',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Outcomes */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <Metric label="Design Partners" value={outcome.partners} tone={tone} />
        <Metric label="ARR ($k)" value={outcome.arr} tone={tone} prefix="$" suffix="k" />
        <Metric label="MITRE Coverage" value={outcome.coverage} tone={tone} suffix="%" />
        <Metric label="Headcount" value={outcome.headcount} tone={tone} />
      </div>
    </HudPanel>
  )
}

function Metric({ label, value, tone, prefix = '', suffix = '' }: { label: string; value: number; tone: string; prefix?: string; suffix?: string }) {
  return (
    <div className="hud-surface rounded p-3 relative overflow-hidden animate-sheen">
      <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">{label}</div>
      <div className="font-display font-bold text-2xl mt-1" style={{ color: tone }}>
        {prefix}
        <AnimatedNumber value={value} />
        {suffix}
      </div>
    </div>
  )
}
