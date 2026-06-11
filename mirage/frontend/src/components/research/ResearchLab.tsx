'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getResearch, ResearchResponse } from '@/lib/api'
import RocCurve from './RocCurve'
import ConfusionMatrix from './ConfusionMatrix'
import AblationBars from './AblationBars'
import LatencyHistogram from './LatencyHistogram'
import CalibrationCurve from './CalibrationCurve'
import DeceptionQuality from './DeceptionQuality'

export default function ResearchLab() {
  const [data, setData] = useState<ResearchResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const pull = async () => {
      try {
        const r = await getResearch()
        if (!alive) return
        setData(r)
        setErr(null)
        return r.status
      } catch (e) {
        if (alive) setErr(String(e))
      }
    }
    pull()
    // Poll until the startup cache is ready, then stop.
    const t = setInterval(async () => {
      const status = await pull()
      if (status === 'ready' || status === 'error') clearInterval(t)
    }, 3000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  if (err) return <Banner tone="red" title="Backend unreachable" sub={err} />
  if (!data || data.status === 'computing') return <Computing />
  if (data.status === 'error') return <Banner tone="red" title="Benchmark failed" sub={data.error ?? ''} />
  if (data.status !== 'ready' || !data.detection || !data.latency || !data.deception)
    return <Banner tone="yellow" title="Research cache unavailable" sub="Run the backend to populate." />

  const d = data.detection
  return (
    <div className="h-full overflow-auto px-4 py-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Headline strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hud-surface hud-corners rounded-lg p-4 mb-3 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h2 className="font-display font-bold text-2xl text-mirage-cyan text-glow-cyan tracking-wide">RESEARCH LAB</h2>
            <p className="text-[11px] text-gray-500 font-mono">
              measured on {d.n_benign + d.n_malicious} labeled requests · computed in {data.compute_seconds}s
            </p>
          </div>
          <div className="flex gap-5">
            <Headline label="ROC-AUC" v={d.roc_auc.toFixed(3)} />
            <Headline label="F1" v={d.f1.toFixed(2)} />
            <Headline label="p95 LATENCY" v={`${data.latency.p95_ms}ms`} good={data.latency.p95_ms < 100} />
            <Headline label="MEAN DQI" v={`${data.deception.mean_dqi}`} />
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-3 auto-rows-min">
          <div className="col-span-12 md:col-span-4 h-[340px]"><RocCurve roc={d.roc_curve} pr={d.pr_curve} rocAuc={d.roc_auc} prAuc={d.pr_auc} /></div>
          <div className="col-span-12 md:col-span-4 h-[340px]"><ConfusionMatrix c={d.confusion} precision={d.precision} recall={d.recall} f1={d.f1} /></div>
          <div className="col-span-12 md:col-span-4 h-[340px]"><CalibrationCurve points={d.calibration} /></div>

          <div className="col-span-12 lg:col-span-7 h-[340px]"><AblationBars ablation={d.ablation} /></div>
          <div className="col-span-12 lg:col-span-5 h-[340px]"><DeceptionQuality deception={data.deception} /></div>

          <div className="col-span-12 h-[300px]"><LatencyHistogram latency={data.latency} /></div>
        </div>
      </div>
    </div>
  )
}

function Headline({ label, v, good }: { label: string; v: string; good?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-[9px] text-gray-500 font-mono tracking-widest">{label}</div>
      <div className={`font-display font-bold text-xl ${good === false ? 'text-mirage-red' : 'text-mirage-cyan'}`}>{v}</div>
    </div>
  )
}

function Computing() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-40 h-1 bg-mirage-border rounded overflow-hidden relative animate-sheen">
        <div className="absolute inset-0 bg-mirage-cyan/30" />
      </div>
      <p className="text-mirage-cyan font-display tracking-widest text-sm animate-pulse">COMPUTING BENCHMARK…</p>
      <p className="text-gray-600 text-[11px] font-mono">training ensemble · scoring corpus · profiling latency · judging deception</p>
    </div>
  )
}

function Banner({ tone, title, sub }: { tone: 'red' | 'yellow'; title: string; sub: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2">
      <p className={`font-display text-lg tracking-widest ${tone === 'red' ? 'text-mirage-red' : 'text-mirage-yellow'}`}>{title}</p>
      <p className="text-gray-600 text-xs font-mono max-w-md text-center">{sub}</p>
    </div>
  )
}
