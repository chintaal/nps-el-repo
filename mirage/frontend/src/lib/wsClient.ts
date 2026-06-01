'use client'

import { useMirageStore } from '@/store/mirageStore'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws'
const MAX_RETRIES = 5

let ws: WebSocket | null = null
let retries = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    retries = 0
    useMirageStore.getState().setConnected(true)
    console.log('[Mirage WS] Connected')
  }

  ws.onmessage = (evt) => {
    try {
      const event = JSON.parse(evt.data)
      useMirageStore.getState().handleEvent(event)
    } catch (e) {
      console.warn('[Mirage WS] Parse error', e)
    }
  }

  ws.onclose = () => {
    useMirageStore.getState().setConnected(false)
    ws = null
    if (retries < MAX_RETRIES) {
      const delay = Math.min(1000 * 2 ** retries, 30000)
      retries++
      console.log(`[Mirage WS] Reconnecting in ${delay}ms (attempt ${retries})`)
      retryTimer = setTimeout(connect, delay)
    } else {
      console.error('[Mirage WS] Max retries reached')
    }
  }

  ws.onerror = () => {
    ws?.close()
  }
}

export function initWebSocket() {
  if (typeof window === 'undefined') return
  connect()
}

export function closeWebSocket() {
  if (retryTimer) clearTimeout(retryTimer)
  ws?.close()
  ws = null
}
