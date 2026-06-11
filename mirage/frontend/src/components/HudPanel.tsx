'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import { ENTER } from '@/design/tokens'

interface HudPanelProps {
  title?: string
  subtitle?: string
  accent?: 'cyan' | 'red' | 'emerald' | 'yellow' | 'violet'
  className?: string
  bodyClassName?: string
  corners?: boolean
  children: React.ReactNode
  right?: React.ReactNode
}

const ACCENT: Record<string, string> = {
  cyan: 'text-mirage-cyan',
  red: 'text-mirage-red',
  emerald: 'text-mirage-emerald',
  yellow: 'text-mirage-yellow',
  violet: 'text-mirage-violet',
}

/** The canonical glass HUD surface — animated reveal, header chrome, corner
 *  brackets. Every Mission Control / Research Lab panel wraps in one. */
export default function HudPanel({
  title,
  subtitle,
  accent = 'cyan',
  className,
  bodyClassName,
  corners = true,
  children,
  right,
}: HudPanelProps) {
  return (
    <motion.section
      {...ENTER}
      className={clsx(
        'hud-surface rounded-lg overflow-hidden flex flex-col',
        corners && 'hud-corners',
        className,
      )}
    >
      {(title || right) && (
        <header className="flex items-center justify-between px-3 py-2 border-b border-mirage-border/70 flex-shrink-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', `bg-current`, ACCENT[accent])} />
            <h3 className={clsx('font-display font-bold tracking-[0.18em] uppercase text-[11px] truncate', ACCENT[accent])}>
              {title}
            </h3>
            {subtitle && <span className="text-[10px] text-gray-600 font-mono truncate">{subtitle}</span>}
          </div>
          {right}
        </header>
      )}
      <div className={clsx('flex-1 min-h-0', bodyClassName ?? 'p-3')}>{children}</div>
    </motion.section>
  )
}
