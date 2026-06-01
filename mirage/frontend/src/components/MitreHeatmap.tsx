'use client'

import { useMirageStore } from '@/store/mirageStore'

const TACTICS = [
  { id: 'TA0043', name: 'Reconnaissance' },
  { id: 'TA0042', name: 'Resource Dev' },
  { id: 'TA0001', name: 'Initial Access' },
  { id: 'TA0002', name: 'Execution' },
  { id: 'TA0003', name: 'Persistence' },
  { id: 'TA0004', name: 'Priv Escalation' },
  { id: 'TA0005', name: 'Defense Evasion' },
  { id: 'TA0006', name: 'Credential Access' },
  { id: 'TA0007', name: 'Discovery' },
  { id: 'TA0008', name: 'Lateral Movement' },
  { id: 'TA0009', name: 'Collection' },
]

export default function MitreHeatmap() {
  const mitreTags = useMirageStore((s) => s.mitreTags)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-mirage-border flex-shrink-0">
        <span className="text-xs font-mono text-mirage-cyan tracking-widest uppercase">
          MITRE ATT&amp;CK Heatmap
        </span>
      </div>

      <div className="flex-1 p-3 overflow-auto">
        <div className="grid grid-cols-11 gap-1 h-full min-h-0">
          {TACTICS.map((tactic) => {
            const count = mitreTags[tactic.id] ?? 0
            const opacity = count === 0 ? 0.08 : Math.min(0.3 + count * 0.15, 1.0)

            return (
              <div
                key={tactic.id}
                title={`${tactic.id}: ${tactic.name}\nHits: ${count}`}
                className="group relative flex flex-col items-center justify-center rounded border cursor-default transition-all duration-500"
                style={{
                  borderColor: `rgba(34, 211, 238, ${opacity * 0.8})`,
                  backgroundColor: `rgba(34, 211, 238, ${opacity * 0.15})`,
                  boxShadow: count > 0 ? `0 0 ${8 + count * 4}px rgba(34, 211, 238, ${opacity * 0.4})` : 'none',
                }}
              >
                <div
                  className="text-xs font-mono font-bold text-center leading-none mb-1"
                  style={{ color: `rgba(34, 211, 238, ${Math.max(opacity, 0.4)})` }}
                >
                  {tactic.id.replace('TA0', '')}
                </div>
                {count > 0 && (
                  <div className="text-xs font-mono font-bold text-white">{count}</div>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-mirage-panel border border-mirage-border rounded text-xs font-mono text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="text-mirage-cyan">{tactic.id}</div>
                  <div>{tactic.name}</div>
                  <div className="text-yellow-400">{count} hit{count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-mirage-border">
          <span className="text-xs font-mono text-gray-600">Intensity:</span>
          {[0, 1, 3, 6].map((n) => {
            const op = n === 0 ? 0.08 : Math.min(0.3 + n * 0.15, 1.0)
            return (
              <div key={n} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(34, 211, 238, ${op * 0.3})`, border: `1px solid rgba(34, 211, 238, ${op})` }}
                />
                <span className="text-xs font-mono text-gray-600">{n === 0 ? 'none' : `${n}+`}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
