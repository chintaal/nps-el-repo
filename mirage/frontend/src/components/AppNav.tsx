'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useMirageStore } from '@/store/mirageStore'

const TABS = [
  { href: '/', label: 'LIVE OPS', code: 'OPS' },
  { href: '/mission-control', label: 'MISSION CONTROL', code: 'MC' },
  { href: '/research', label: 'RESEARCH LAB', code: 'RL' },
]

export default function AppNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname()
  const isConnected = useMirageStore((s) => s.isConnected)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(11, 19))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <nav className="relative z-30 flex items-center justify-between px-4 h-11 hud-surface border-b border-mirage-border flex-shrink-0">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative w-4 h-4">
          <span className="absolute inset-0 rounded-full border border-mirage-cyan/60 animate-radar"
            style={{ background: 'conic-gradient(from 0deg, rgba(34,211,238,0.5), transparent 60%)' }} />
          <span className="absolute inset-[5px] rounded-full bg-mirage-cyan animate-flicker" />
        </div>
        <span className="font-display font-bold text-mirage-cyan tracking-[0.25em] text-sm text-glow-cyan">
          MIRAGE
        </span>
        <span className="hidden md:inline text-[10px] text-gray-600 font-mono tracking-widest">
          DECEPTION OS
        </span>
      </Link>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} className="relative px-3 py-1.5">
              <span
                className={clsx(
                  'font-display tracking-[0.18em] text-[11px] font-semibold transition-colors',
                  active ? 'text-mirage-cyan' : 'text-gray-500 hover:text-gray-300',
                )}
              >
                {tab.label}
              </span>
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-2 right-2 -bottom-[1px] h-[2px] bg-mirage-cyan shadow-glowcyan"
                />
              )}
            </Link>
          )
        })}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenPalette}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-mirage-border hover:border-mirage-cyan/50 text-[10px] font-mono text-gray-500 hover:text-mirage-cyan transition-colors"
        >
          <span className="text-mirage-cyan">⌘</span>K
        </button>
        <span className="text-gray-500 font-mono text-xs tabular-nums">{clock}</span>
        <div className="flex items-center gap-1.5">
          <div className={clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-red-500 animate-pulse')} />
          <span className={clsx('text-[10px] font-mono', isConnected ? 'text-emerald-400' : 'text-red-500')}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </nav>
  )
}
