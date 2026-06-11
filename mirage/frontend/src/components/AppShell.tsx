'use client'

import { Suspense, lazy, useEffect, useState } from 'react'
import { initWebSocket } from '@/lib/wsClient'
import AppNav from '@/components/AppNav'
import CommandPalette from '@/components/CommandPalette'

const ParticleField = lazy(() => import('@/components/ParticleField'))

/**
 * Persistent client shell wrapping every route. Owns the single WebSocket
 * connection + the telemetry-reactive fabric + global command palette, so the
 * live store stays warm across Live Ops / Mission Control / Research Lab.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    initWebSocket()
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-mirage-bg flex flex-col">
      <Suspense fallback={<div className="fixed inset-0 bg-mirage-bg" />}>
        <ParticleField />
      </Suspense>

      <AppNav onOpenPalette={() => setPaletteOpen(true)} />

      <main className="relative z-10 flex-1 min-h-0">{children}</main>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  )
}
