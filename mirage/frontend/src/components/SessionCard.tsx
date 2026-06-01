'use client'

import { Session } from '@/store/mirageStore'
import { useMirageStore } from '@/store/mirageStore'
import clsx from 'clsx'

const STATE_COLORS: Record<string, string> = {
  CLEAN: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/5',
  SUSPECT: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/5',
  DECEPTION_ENGAGED: 'text-red-500 border-red-500/40 bg-red-500/5 animate-pulse-ring',
  TERMINATED: 'text-gray-500 border-gray-500/40 bg-gray-500/5',
}

const SCORE_BAR_COLORS = (score: number) => {
  if (score < 0.4) return 'bg-emerald-400'
  if (score < 0.6) return 'bg-yellow-400'
  return 'bg-red-500'
}

interface Props {
  session: Session
  isActive: boolean
}

export default function SessionCard({ session, isActive }: Props) {
  const setActive = useMirageStore((s) => s.setActiveSession)
  const latestScore = session.anomaly_scores.at(-1) ?? 0

  return (
    <div
      onClick={() => setActive(session.session_id)}
      className={clsx(
        'border rounded p-3 cursor-pointer transition-all duration-200 animate-slide-in mb-2',
        isActive
          ? 'border-mirage-cyan/60 bg-mirage-cyan/5'
          : 'border-mirage-border bg-mirage-panel hover:border-mirage-dim',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-mirage-cyan tracking-widest">
          {session.session_id.slice(0, 8).toUpperCase()}
        </span>
        <span
          className={clsx(
            'text-xs font-mono px-2 py-0.5 rounded border',
            STATE_COLORS[session.state] ?? STATE_COLORS.CLEAN,
          )}
        >
          {session.state.replace('_', ' ')}
        </span>
      </div>

      <div className="text-xs text-gray-400 font-mono mb-2">{session.source_ip_masked}</div>

      {session.persona && (
        <div className="text-xs text-yellow-400/80 font-mono mb-2 truncate">
          ⚡ {session.persona}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 font-mono">
          <span>ANOMALY</span>
          <span>{(latestScore * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-mirage-border rounded-full h-1.5 overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', SCORE_BAR_COLORS(latestScore))}
            style={{ width: `${Math.min(latestScore * 100, 100)}%` }}
          />
        </div>
      </div>

      {session.mitre_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {session.mitre_tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs font-mono bg-mirage-border text-gray-400 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
