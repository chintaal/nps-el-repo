'use client'

import { useMirageStore, SessionState } from '@/store/mirageStore'

const NODES: Record<string, { x: number; y: number; label: string; color: string }> = {
  CLEAN: { x: 60, y: 60, label: 'CLEAN', color: '#34D399' },
  SUSPECT: { x: 220, y: 60, label: 'SUSPECT', color: '#FACC15' },
  DECEPTION_ENGAGED: { x: 140, y: 160, label: 'DECEPTION', color: '#EF4444' },
  TERMINATED: { x: 140, y: 250, label: 'TERMINATED', color: '#6B7280' },
}

const EDGES = [
  { from: 'CLEAN', to: 'SUSPECT' },
  { from: 'CLEAN', to: 'DECEPTION_ENGAGED' },
  { from: 'SUSPECT', to: 'DECEPTION_ENGAGED' },
  { from: 'DECEPTION_ENGAGED', to: 'TERMINATED' },
]

export default function StateMachineViz() {
  const sessions = useMirageStore((s) => s.sessions)
  const activeId = useMirageStore((s) => s.activeSessionId)
  const session = activeId ? sessions[activeId] : null
  const currentState = session?.state ?? 'CLEAN'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-mirage-border flex-shrink-0">
        <span className="text-xs font-mono text-mirage-cyan tracking-widest uppercase">
          Session FSM
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-2">
        <svg viewBox="0 0 300 310" className="w-full h-full max-h-64" style={{ overflow: 'visible' }}>
          {/* Edges */}
          {EDGES.map(({ from, to }) => {
            const f = NODES[from]
            const t = NODES[to]
            const isActive =
              session &&
              ((from === session.state && to === currentState) ||
                (from === 'CLEAN' && currentState !== 'CLEAN'))
            return (
              <g key={`${from}-${to}`}>
                <defs>
                  <marker id={`arrow-${from}-${to}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill={isActive ? '#22D3EE' : '#374151'} />
                  </marker>
                </defs>
                <line
                  x1={f.x}
                  y1={f.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={isActive ? '#22D3EE' : '#374151'}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? 'none' : '4 2'}
                  markerEnd={`url(#arrow-${from}-${to})`}
                  opacity={isActive ? 1 : 0.5}
                  style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
                />
              </g>
            )
          })}

          {/* Nodes */}
          {Object.entries(NODES).map(([state, node]) => {
            const isActive = state === currentState
            return (
              <g key={state}>
                {isActive && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={26}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    opacity="0.4"
                    style={{
                      animation: 'pulse-ring 1.5s ease-in-out infinite',
                    }}
                  />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={20}
                  fill={isActive ? `${node.color}22` : '#0d1117'}
                  stroke={node.color}
                  strokeWidth={isActive ? 2.5 : 1}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 8px ${node.color})` : 'none',
                    transition: 'all 0.5s',
                  }}
                />
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? node.color : '#9CA3AF'}
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {session && (
        <div className="px-3 pb-2 text-center">
          <span className="text-xs font-mono text-gray-500">Current: </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: NODES[currentState]?.color ?? '#9CA3AF' }}
          >
            {currentState}
          </span>
        </div>
      )}
    </div>
  )
}
