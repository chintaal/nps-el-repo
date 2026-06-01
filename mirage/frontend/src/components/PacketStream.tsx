'use client'

import { useMirageStore } from '@/store/mirageStore'
import SessionCard from './SessionCard'

export default function PacketStream() {
  const sessions = useMirageStore((s) => s.sessions)
  const activeId = useMirageStore((s) => s.activeSessionId)
  const isConnected = useMirageStore((s) => s.isConnected)

  const sorted = Object.values(sessions).sort((a, b) => b.last_seen - a.last_seen)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-mirage-border flex-shrink-0">
        <span className="text-xs font-mono text-mirage-cyan tracking-widest uppercase">
          Live Session Stream
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-xs font-mono text-gray-500">
            {sorted.length} active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-mirage-border">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 font-mono text-xs">
            <div className="text-center">
              <div className="text-2xl mb-2">◉</div>
              <div>Awaiting traffic...</div>
            </div>
          </div>
        ) : (
          sorted.map((session) => (
            <SessionCard
              key={session.session_id}
              session={session}
              isActive={session.session_id === activeId}
            />
          ))
        )}
      </div>
    </div>
  )
}
