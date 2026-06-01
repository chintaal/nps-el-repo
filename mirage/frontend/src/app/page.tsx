'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import { useMirageStore } from '@/store/mirageStore'
import { initWebSocket } from '@/lib/wsClient'
import PacketStream from '@/components/PacketStream'
import DeceptionTranscript from '@/components/DeceptionTranscript'
import MitreHeatmap from '@/components/MitreHeatmap'
import StateMachineViz from '@/components/StateMachineViz'
import ReportPanel from '@/components/ReportPanel'

const ParticleField = lazy(() => import('@/components/ParticleField'))

function TopBar() {
  const isConnected = useMirageStore((s) => s.isConnected)
  const sessions = useMirageStore((s) => s.sessions)
  const events = useMirageStore((s) => s.events)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const activeCount = Object.values(sessions).filter(
    (s) => s.state !== 'TERMINATED'
  ).length
  const engagedCount = Object.values(sessions).filter(
    (s) => s.state === 'DECEPTION_ENGAGED'
  ).length
  const latestEvent = events[0]

  return (
    <div className="flex items-center justify-between px-4 bg-mirage-panel border-b border-mirage-border"
      style={{ height: '48px', flexShrink: 0 }}>
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mirage-cyan animate-pulse" />
          <span className="text-mirage-cyan font-mono font-bold text-sm tracking-widest">
            PROJECT MIRAGE
          </span>
        </div>
        <span className="text-gray-600 text-xs">|</span>
        <span className="text-gray-500 text-xs font-mono">THREAT DECEPTION CONSOLE v1.0</span>
      </div>

      {/* Center: Live stats ticker */}
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

      {/* Right: System time + connection status */}
      <div className="flex items-center gap-3">
        <span className="text-gray-500 font-mono text-xs">{clock}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
          <span className={`text-xs font-mono ${isConnected ? 'text-emerald-400' : 'text-red-500'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  useEffect(() => {
    initWebSocket()
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-mirage-bg flex flex-col">
      {/* Particle background */}
      <Suspense fallback={<div className="fixed inset-0 bg-mirage-bg" />}>
        <ParticleField />
      </Suspense>

      {/* Dashboard grid — above particles */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Bar */}
        <TopBar />

        {/* Main content grid */}
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
          {/* Row 1, Col 1: Packet Stream */}
          <div className="bg-mirage-bg overflow-hidden">
            <PacketStream />
          </div>

          {/* Row 1, Col 2: Deception Transcript */}
          <div className="bg-mirage-bg overflow-hidden">
            <DeceptionTranscript />
          </div>

          {/* Row 2: three-column bottom strip */}
          <div
            className="col-span-2 overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: '1px',
              background: '#1f2937',
            }}
          >
            {/* State Machine */}
            <div className="bg-mirage-bg overflow-hidden">
              <StateMachineViz />
            </div>

            {/* MITRE Heatmap */}
            <div className="bg-mirage-bg overflow-hidden">
              <MitreHeatmap />
            </div>

            {/* Report Panel */}
            <div className="bg-mirage-bg overflow-hidden">
              <ReportPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
