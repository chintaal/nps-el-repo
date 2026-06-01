import { create } from 'zustand'

export type SessionState = 'CLEAN' | 'SUSPECT' | 'DECEPTION_ENGAGED' | 'TERMINATED'

export type EventType =
  | 'CONNECTION'
  | 'ANOMALY_SCORE'
  | 'STATE_TRANSITION'
  | 'DECEPTION_ENGAGE'
  | 'INTERACTION'
  | 'SESSION_TERMINATED'
  | 'REPORT_READY'

export interface TelemetryEvent {
  event_type: EventType
  timestamp: string
  session_id: string
  source_ip_masked: string
  anomaly_score: number
  previous_state?: string
  new_state?: string
  persona_assigned?: string
  attacker_message?: string
  deception_reply?: string
  mitre_tags: string[]
  layer_triggered?: number
}

export interface Session {
  session_id: string
  source_ip_masked: string
  state: SessionState
  anomaly_scores: number[]
  persona?: string
  transcript: Array<{ role: string; content: string }>
  mitre_tags: string[]
  last_seen: number
}

interface MirageState {
  sessions: Record<string, Session>
  activeSessionId: string | null
  events: TelemetryEvent[]
  mitreTags: Record<string, number>
  isConnected: boolean
  handleEvent: (event: TelemetryEvent) => void
  setActiveSession: (id: string) => void
  setConnected: (v: boolean) => void
  clearAll: () => void
}

export const useMirageStore = create<MirageState>((set, get) => ({
  sessions: {},
  activeSessionId: null,
  events: [],
  mitreTags: {},
  isConnected: false,

  handleEvent: (event) => {
    set((state) => {
      const sessions = { ...state.sessions }
      const { session_id, source_ip_masked } = event

      if (!sessions[session_id]) {
        sessions[session_id] = {
          session_id,
          source_ip_masked,
          state: 'CLEAN',
          anomaly_scores: [],
          mitre_tags: [],
          transcript: [],
          last_seen: Date.now(),
        }
      }

      const session = { ...sessions[session_id] }
      session.last_seen = Date.now()

      if (event.new_state) session.state = event.new_state as SessionState
      if (event.persona_assigned) session.persona = event.persona_assigned
      if (event.anomaly_score > 0) {
        session.anomaly_scores = [...session.anomaly_scores.slice(-49), event.anomaly_score]
      }
      if (event.mitre_tags?.length) {
        const tags = new Set([...session.mitre_tags, ...event.mitre_tags])
        session.mitre_tags = Array.from(tags)
      }
      if (event.attacker_message) {
        session.transcript = [
          ...session.transcript,
          { role: 'attacker', content: event.attacker_message },
        ]
      }
      if (event.deception_reply) {
        session.transcript = [
          ...session.transcript,
          { role: 'mirage', content: event.deception_reply },
        ]
      }

      sessions[session_id] = session

      const mitreTags = { ...state.mitreTags }
      for (const tag of event.mitre_tags ?? []) {
        mitreTags[tag] = (mitreTags[tag] ?? 0) + 1
      }

      const events = [event, ...state.events].slice(0, 500)

      const activeSessionId =
        state.activeSessionId ?? (event.event_type === 'DECEPTION_ENGAGE' ? session_id : state.activeSessionId)

      return { sessions, events, mitreTags, activeSessionId }
    })
  },

  setActiveSession: (id) => set({ activeSessionId: id }),
  setConnected: (v) => set({ isConnected: v }),
  clearAll: () => set({ sessions: {}, activeSessionId: null, events: [], mitreTags: {} }),
}))
