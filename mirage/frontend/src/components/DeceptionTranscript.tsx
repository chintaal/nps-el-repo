'use client'

import { useEffect, useRef, useState } from 'react'
import { useMirageStore } from '@/store/mirageStore'
import clsx from 'clsx'

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    const tick = () => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1))
        idx.current++
        timerRef.current = setTimeout(tick, speed)
      }
    }
    timerRef.current = setTimeout(tick, speed)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, speed])

  return <span>{displayed}<span className="animate-pulse">▋</span></span>
}

export default function DeceptionTranscript() {
  const sessions = useMirageStore((s) => s.sessions)
  const activeId = useMirageStore((s) => s.activeSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)

  const session = activeId ? sessions[activeId] : null
  const transcript = session?.transcript ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript.length])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-mirage-border flex-shrink-0">
        <span className="text-xs font-mono text-mirage-cyan tracking-widest uppercase">
          Deception Transcript
        </span>
        {session && (
          <span className="text-xs font-mono text-gray-500">
            {session.session_id.slice(0, 8).toUpperCase()} · {session.persona ?? 'unassigned'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!session ? (
          <div className="flex items-center justify-center h-full text-gray-600 font-mono text-xs">
            <div className="text-center">
              <div className="text-2xl mb-2">⚠</div>
              <div>Select a session to view transcript</div>
            </div>
          </div>
        ) : transcript.length === 0 ? (
          <div className="text-gray-600 font-mono text-xs text-center mt-8">
            No interactions yet
          </div>
        ) : (
          transcript.map((entry, i) => {
            const isAttacker = entry.role === 'attacker'
            return (
              <div
                key={i}
                className={clsx('flex', isAttacker ? 'justify-start' : 'justify-end')}
              >
                <div
                  className={clsx(
                    'max-w-[85%] rounded p-2.5 font-mono text-xs leading-relaxed',
                    isAttacker
                      ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                      : 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-300',
                  )}
                >
                  <div className={clsx('text-xs mb-1', isAttacker ? 'text-red-500/60' : 'text-emerald-400/60')}>
                    {isAttacker ? '▶ ATTACKER' : '◀ MIRAGE'}
                  </div>
                  {i === transcript.length - 1 && !isAttacker ? (
                    <TypewriterText text={entry.content} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{entry.content}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
