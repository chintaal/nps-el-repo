'use client'

import { motion } from 'framer-motion'
import { MOTION } from '@/design/tokens'

/** App Router template re-mounts on navigation — gives each view a cinematic
 *  boot/zoom entrance without an AnimatePresence exit dependency. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: MOTION.base, ease: MOTION.ease }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
