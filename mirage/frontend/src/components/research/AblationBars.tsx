'use client'

import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'

export default function AblationBars({
  ablation,
}: {
  ablation: { feature: string; auc_without: number; importance: number }[]
}) {
  const max = Math.max(...ablation.map((a) => Math.abs(a.importance)), 0.001)
  return (
    <HudPanel title="Feature Ablation" subtitle="AUC drop when feature removed" accent="yellow" className="h-full" bodyClassName="p-3 overflow-auto">
      <div className="space-y-1.5">
        {ablation.map((a, i) => {
          const w = (Math.abs(a.importance) / max) * 100
          const positive = a.importance >= 0
          return (
            <div key={a.feature} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-mono w-28 truncate text-right">{a.feature}</span>
              <div className="flex-1 h-4 bg-mirage-bg/60 rounded overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ delay: i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded"
                  style={{ background: positive ? 'linear-gradient(90deg,#FACC15,#22D3EE)' : '#6b7280' }}
                />
              </div>
              <span className="text-[10px] font-mono w-12 text-mirage-yellow tabular-nums">
                {a.importance >= 0 ? '+' : ''}{a.importance.toFixed(3)}
              </span>
            </div>
          )
        })}
      </div>
    </HudPanel>
  )
}
