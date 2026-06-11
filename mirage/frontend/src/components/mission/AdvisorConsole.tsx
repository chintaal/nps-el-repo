'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'
import { askAdvisor } from '@/lib/api'
import { JANUS } from '@/data/venture'

interface Turn { role: 'founder' | 'janus'; text: string; label?: string; live?: boolean }

/** JANUS — role-lensed AI advisor. Posts to /api/advisor; replies are grounded
 *  in the live metrics snapshot server-side. Typewriter print on the latest. */
export default function AdvisorConsole() {
  const [role, setRole] = useState('cto')
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, loading])

  const send = async (message?: string) => {
    const msg = (message ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setTurns((t) => [...t, { role: 'founder', text: msg }])
    setLoading(true)
    try {
      const res = await askAdvisor(role, msg)
      setTurns((t) => [...t, { role: 'janus', text: res.reply, label: res.label, live: res.live }])
    } catch {
      setTurns((t) => [...t, { role: 'janus', text: 'JANUS is offline — backend unreachable.', label: 'SYSTEM', live: false }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <HudPanel
      title="JANUS"
      subtitle={JANUS.roles.find((r) => r.id === role)?.lens}
      accent="violet"
      className="h-full"
      bodyClassName="flex flex-col min-h-0"
      right={
        <div className="flex gap-1">
          {JANUS.roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={clsx(
                'px-1.5 py-0.5 rounded text-[9px] font-display tracking-wider transition-colors',
                role === r.id
                  ? 'bg-mirage-violet/20 text-mirage-violet border border-mirage-violet/50'
                  : 'text-gray-600 border border-transparent hover:text-gray-400',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto px-3 py-3 space-y-3">
        {turns.length === 0 && (
          <div className="text-center mt-4 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">{JANUS.blurb}</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {JANUS.prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[10px] text-gray-400 border border-mirage-border rounded-full px-2 py-1 hover:border-mirage-violet/50 hover:text-mirage-violet transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx('flex flex-col', t.role === 'founder' ? 'items-end' : 'items-start')}
          >
            <div className="text-[9px] font-mono tracking-widest text-gray-600 mb-0.5">
              {t.role === 'founder' ? 'FOUNDER' : `JANUS · ${t.label}`}
              {t.role === 'janus' && !t.live && <span className="text-mirage-yellow ml-1">[offline]</span>}
            </div>
            <div
              className={clsx(
                'max-w-[88%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap',
                t.role === 'founder'
                  ? 'bg-mirage-cyan/10 text-mirage-cyan border border-mirage-cyan/20'
                  : 'bg-mirage-violet/10 text-gray-200 border border-mirage-violet/20',
              )}
            >
              {i === turns.length - 1 && t.role === 'janus' ? <Typewriter text={t.text} /> : t.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-1 text-mirage-violet text-xs">
            <span className="animate-pulse">JANUS is reasoning</span>
            <span className="animate-bounce">·</span>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-mirage-border/70 p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Ask JANUS as ${JANUS.roles.find((r) => r.id === role)?.label}…`}
          className="flex-1 bg-mirage-bg/60 border border-mirage-border rounded px-3 py-2 text-xs text-gray-100 outline-none focus:border-mirage-violet/50 placeholder:text-gray-600"
        />
        <button
          onClick={() => send()}
          disabled={loading}
          className="px-3 rounded bg-mirage-violet/15 text-mirage-violet border border-mirage-violet/40 text-xs font-display tracking-widest hover:bg-mirage-violet/25 disabled:opacity-40 transition-colors"
        >
          SEND
        </button>
      </div>
    </HudPanel>
  )
}

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const id: ReturnType<typeof setInterval> = setInterval(
      () => setN((x) => (x >= text.length ? (clearInterval(id), x) : x + 2)),
      12,
    )
    return () => clearInterval(id)
  }, [text])
  return <>{text.slice(0, n)}{n < text.length && <span className="text-mirage-violet">▋</span>}</>
}
