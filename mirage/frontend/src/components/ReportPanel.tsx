'use client'

import { useState } from 'react'
import { useMirageStore } from '@/store/mirageStore'
import clsx from 'clsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function ReportPanel() {
  const sessions = useMirageStore((s) => s.sessions)
  const activeId = useMirageStore((s) => s.activeSessionId)
  const session = activeId ? sessions[activeId] : null

  const [loading, setLoading] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async () => {
    if (!activeId) return
    setLoading(true)
    setError(null)
    setReportUrl(null)
    try {
      const res = await fetch(`${API_URL}/api/sessions/${activeId}/report`, { method: 'POST' })
      const data = await res.json()
      if (data.download_url) {
        setReportUrl(`${API_URL}${data.download_url}`)
      } else {
        setError(data.error ?? 'Unknown error')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async () => {
    if (!activeId) return
    await fetch(`${API_URL}/api/sessions/${activeId}/terminate`, { method: 'POST' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-mirage-border flex-shrink-0">
        <span className="text-xs font-mono text-mirage-cyan tracking-widest uppercase">
          Report &amp; Control
        </span>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-auto">
        {!session ? (
          <div className="text-gray-600 font-mono text-xs text-center mt-6">
            No session selected
          </div>
        ) : (
          <>
            {/* Session Metadata */}
            <div className="border border-mirage-border rounded p-2 space-y-1">
              <div className="text-xs font-mono">
                <span className="text-gray-500">ID: </span>
                <span className="text-mirage-cyan">{session.session_id.slice(0, 16)}…</span>
              </div>
              <div className="text-xs font-mono">
                <span className="text-gray-500">IP: </span>
                <span className="text-gray-300">{session.source_ip_masked}</span>
              </div>
              <div className="text-xs font-mono">
                <span className="text-gray-500">State: </span>
                <span
                  className={clsx(
                    'font-bold',
                    session.state === 'DECEPTION_ENGAGED' && 'text-red-500',
                    session.state === 'SUSPECT' && 'text-yellow-400',
                    session.state === 'CLEAN' && 'text-emerald-400',
                    session.state === 'TERMINATED' && 'text-gray-500',
                  )}
                >
                  {session.state}
                </span>
              </div>
              {session.persona && (
                <div className="text-xs font-mono">
                  <span className="text-gray-500">Persona: </span>
                  <span className="text-yellow-400">{session.persona}</span>
                </div>
              )}
              <div className="text-xs font-mono">
                <span className="text-gray-500">Interactions: </span>
                <span className="text-gray-300">{Math.floor(session.transcript.length / 2)}</span>
              </div>
            </div>

            {/* MITRE Tags */}
            {session.mitre_tags.length > 0 && (
              <div>
                <div className="text-xs font-mono text-gray-500 mb-1">MITRE Tags</div>
                <div className="flex flex-wrap gap-1">
                  {session.mitre_tags.map((tag) => (
                    <span key={tag} className="text-xs font-mono bg-mirage-cyan/10 text-mirage-cyan border border-mirage-cyan/30 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Report Generation */}
            <button
              onClick={generateReport}
              disabled={loading}
              className={clsx(
                'w-full py-2 rounded font-mono text-xs tracking-widest font-bold transition-all duration-200',
                loading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-mirage-cyan/10 text-mirage-cyan border border-mirage-cyan/40 hover:bg-mirage-cyan/20 hover:border-mirage-cyan',
              )}
            >
              {loading ? '◌ GENERATING...' : '⬡ GENERATE REPORT'}
            </button>

            {reportUrl && (
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 rounded font-mono text-xs tracking-widest font-bold text-center bg-emerald-400/10 text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/20 transition-all"
              >
                ↓ DOWNLOAD PDF
              </a>
            )}

            {error && (
              <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">
                {error}
              </div>
            )}

            {/* Blackhole */}
            <button
              onClick={terminateSession}
              className="w-full py-2 rounded font-mono text-xs tracking-widest font-bold text-red-500 border border-red-500/40 bg-red-500/5 hover:bg-red-500/15 transition-all duration-200"
            >
              ✕ BLACKHOLE IP
            </button>
          </>
        )}
      </div>
    </div>
  )
}
