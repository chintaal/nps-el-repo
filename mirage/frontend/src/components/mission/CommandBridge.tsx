'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'
import { AnimatedNumber, RadialGauge } from '@/components/viz/primitives'
import { getMetrics, MetricsResponse } from '@/lib/api'
import { useMirageStore } from '@/store/mirageStore'
import { BRAND } from '@/data/venture'
import { COLORS } from '@/design/tokens'

/** The bridge: live KPI gauges (real /api/metrics) + the venture's mission +
 *  a JANUS one-line briefing derived from the actual system state. */
export default function CommandBridge() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const storeSessions = useMirageStore((s) => s.sessions)
  const events = useMirageStore((s) => s.events)

  useEffect(() => {
    let alive = true
    const pull = async () => {
      try {
        const m = await getMetrics()
        if (alive) setMetrics(m)
      } catch {
        /* offline — fall back to live store below */
      }
    }
    pull()
    const t = setInterval(pull, 4000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  // Prefer server aggregate; fall back to the live store so the bridge is never empty.
  const sessionVals = Object.values(storeSessions)
  const total = metrics?.total_sessions ?? sessionVals.length
  const engaged = metrics?.engaged ?? sessionVals.filter((s) => s.state === 'DECEPTION_ENGAGED').length
  const tactics = metrics?.mitre_tactics_covered ?? new Set(sessionVals.flatMap((s) => s.mitre_tags)).size
  const interactions = metrics?.total_interactions ?? sessionVals.reduce((a, s) => a + Math.floor(s.transcript.length / 2), 0)
  const threat = total ? engaged / total : 0

  const briefing =
    engaged > 0
      ? `${engaged} adversary${engaged > 1 ? 'ies' : ''} engaged across ${tactics} MITRE tactic${tactics === 1 ? '' : 's'}. Containment holding — recommend generating dossiers on the hottest sessions.`
      : total > 0
        ? `${total} session${total === 1 ? '' : 's'} observed, none escalated. The fabric is calm — a good window to harden personas.`
        : 'No live traffic yet. Run the attack simulation to watch the deception fabric ignite.'

  return (
    <HudPanel title="Command Bridge" subtitle="live telemetry" accent="cyan" className="h-full" bodyClassName="p-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] h-full">
        {/* Left — mission + briefing */}
        <div className="p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-mirage-border/60 relative overflow-hidden">
          <div className="absolute inset-0 hud-grid-bg opacity-40 pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] tracking-[0.3em] text-gray-500 font-mono">{BRAND.category.toUpperCase()}</div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-mirage-cyan text-glow-cyan leading-none mt-1">
              MIRAGE
            </h1>
            <p className="text-mirage-cyan/80 font-display tracking-wide mt-1">{BRAND.tagline}</p>
            <p className="text-gray-400 text-sm mt-4 max-w-md leading-relaxed">{BRAND.mission}</p>
          </div>
          <motion.div
            key={briefing}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative mt-5 border-l-2 border-mirage-violet/60 pl-3"
          >
            <div className="text-[10px] tracking-[0.25em] text-mirage-violet font-mono">JANUS BRIEFING</div>
            <p className="text-gray-300 text-xs mt-1 leading-relaxed">{briefing}</p>
          </motion.div>
        </div>

        {/* Right — gauges */}
        <div className="p-5 grid grid-cols-2 gap-2 place-items-center content-center">
          <RadialGauge value={Math.min(total / 20, 1)} label="Sessions" display={`${total}`} color={COLORS.cyan} size={108} />
          <RadialGauge value={threat} label="Threat" display={`${Math.round(threat * 100)}%`} color={COLORS.red} size={108} />
          <RadialGauge value={Math.min(tactics / 11, 1)} label="MITRE" display={`${tactics}/11`} color={COLORS.yellow} size={108} />
          <RadialGauge value={Math.min(interactions / 40, 1)} label="Intel Turns" display={`${interactions}`} color={COLORS.emerald} size={108} />
          <div className="col-span-2 w-full flex items-center justify-between text-[10px] font-mono text-gray-500 border-t border-mirage-border/60 pt-2 mt-1">
            <span>EVENTS <AnimatedNumber value={events.length} className="text-mirage-cyan font-bold" /></span>
            <span className="text-gray-600">{metrics ? 'SERVER AGGREGATE' : 'LIVE STORE'}</span>
          </div>
        </div>
      </div>
    </HudPanel>
  )
}
