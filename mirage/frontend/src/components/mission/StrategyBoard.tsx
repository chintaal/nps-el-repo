'use client'

import { motion } from 'framer-motion'
import HudPanel from '@/components/HudPanel'
import { BRAND } from '@/data/venture'
import { ITEM, STAGGER } from '@/design/tokens'

export default function StrategyBoard() {
  return (
    <HudPanel title="Strategy" subtitle="vision · values · positioning" accent="emerald" className="h-full" bodyClassName="p-4 overflow-auto">
      <div className="space-y-4">
        <Block label="VISION" body={BRAND.vision} accent="text-mirage-cyan" />
        <Block label="POSITIONING" body={BRAND.positioning} accent="text-mirage-emerald" />
        <div>
          <div className="text-[10px] tracking-[0.25em] text-gray-500 font-mono mb-2">VALUES</div>
          <motion.div variants={STAGGER} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BRAND.values.map((v) => (
              <motion.div key={v.k} variants={ITEM} className="hud-surface rounded p-2.5 border-l-2 border-mirage-emerald/50">
                <div className="text-mirage-emerald text-xs font-display tracking-wide">{v.k}</div>
                <div className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">{v.v}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </HudPanel>
  )
}

function Block({ label, body, accent }: { label: string; body: string; accent: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] text-gray-500 font-mono mb-1">{label}</div>
      <p className={`text-sm leading-relaxed ${accent}`}>{body}</p>
    </div>
  )
}
