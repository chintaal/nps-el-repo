'use client'

import { useEffect, useState } from 'react'
import { useMirageStore } from '@/store/mirageStore'
import PacketStream from '@/components/PacketStream'
import DeceptionTranscript from '@/components/DeceptionTranscript'
import MitreHeatmap from '@/components/MitreHeatmap'
import StateMachineViz from '@/components/StateMachineViz'
import ReportPanel from '@/components/ReportPanel'

function StatsTicker() {
  const sessions = useMirageStore((s) => s.sessions)
  const events = useMirageStore((s) => s.events)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const activeCount = Object.values(sessions).filter((s) => s.state !== 'TERMINATED').length
  const engagedCount = Object.values(sessions).filter((s) => s.state === 'DECEPTION_ENGAGED').length
  const latestEvent = events[0]

  return (
    <div
      className="flex items-center justify-between px-4 bg-mirage-panel/60 border-b border-mirage-border"
      style={{ height: '40px', flexShrink: 0 }}
    >
      <span className="text-gray-500 text-xs font-mono tracking-widest">THREAT DECEPTION CONSOLE</span>
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">SESSIONS</span>
          <span className="text-mirage-cyan font-bold">{activeCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">ENGAGED</span>
          <span className="text-red-500 font-bold">{engagedCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">EVENTS</span>
          <span className="text-yellow-400 font-bold">{events.length}</span>
        </div>
        {latestEvent && (
          <div className="text-gray-600 truncate max-w-64">
            ↳ {latestEvent.event_type} · {latestEvent.source_ip_masked}
          </div>
        )}
      </div>
      <span className="text-gray-500 font-mono text-xs">{clock}</span>
    </div>
  )
}

export default function LiveOpsDashboard() {
  return (
    <div className="relative z-10 flex flex-col h-full">
      <StatsTicker />
      <div
        className="flex-1 min-h-0"
        style={{
          display: 'grid',
          gridTemplateRows: '60vh 1fr',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
          background: '#1f2937',
        }}
      >
        <div className="bg-mirage-bg overflow-hidden">
          <PacketStream />
        </div>
        <div className="bg-mirage-bg overflow-hidden">
          <DeceptionTranscript />
        </div>
        <div
          className="col-span-2 overflow-hidden"
          style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1px', background: '#1f2937' }}
        >
          <div className="bg-mirage-bg overflow-hidden">
            <StateMachineViz />
          </div>
          <div className="bg-mirage-bg overflow-hidden">
            <MitreHeatmap />
          </div>
          <div className="bg-mirage-bg overflow-hidden">
            <ReportPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
