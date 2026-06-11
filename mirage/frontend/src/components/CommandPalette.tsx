'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
}

/** ⌘K command palette — jump between views + quick actions. The "real OS" detail. */
export default function CommandPalette({ open, setOpen }: Props) {
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const go = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-[560px] max-w-[92vw] hud-surface hud-corners rounded-lg overflow-hidden shadow-hud"
          >
            <Command className="font-mono">
              <div className="flex items-center gap-2 px-3 border-b border-mirage-border">
                <span className="text-mirage-cyan text-sm">⌗</span>
                <Command.Input
                  autoFocus
                  placeholder="Search Mirage OS…"
                  className="w-full bg-transparent py-3 text-sm text-gray-100 outline-none placeholder:text-gray-600"
                />
              </div>
              <Command.List className="max-h-[320px] overflow-auto p-2">
                <Command.Empty className="px-3 py-4 text-xs text-gray-600">No matches.</Command.Empty>
                <Command.Group heading="Navigate" className="text-[10px] text-gray-600 uppercase tracking-widest px-2 py-1">
                  <PaletteItem onSelect={() => go('/')} label="Live Ops Console" hint="OPS" />
                  <PaletteItem onSelect={() => go('/mission-control')} label="Mission Control" hint="MC" />
                  <PaletteItem onSelect={() => go('/research')} label="Research Lab" hint="RL" />
                </Command.Group>
                <Command.Group heading="Ask JANUS" className="text-[10px] text-gray-600 uppercase tracking-widest px-2 py-1">
                  <PaletteItem onSelect={() => go('/mission-control#janus')} label="Open JANUS advisor" hint="AI" />
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PaletteItem({ onSelect, label, hint }: { onSelect: () => void; label: string; hint: string }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center justify-between px-3 py-2 rounded text-sm text-gray-300 cursor-pointer data-[selected=true]:bg-mirage-cyan/10 data-[selected=true]:text-mirage-cyan"
    >
      <span>{label}</span>
      <span className="text-[10px] text-gray-600 border border-mirage-border rounded px-1.5 py-0.5">{hint}</span>
    </Command.Item>
  )
}
