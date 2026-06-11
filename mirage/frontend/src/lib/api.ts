// REST helpers for the Mission Control + Research Lab views.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface MetricsResponse {
  total_sessions: number
  by_state: Record<string, number>
  engaged: number
  suspect: number
  terminated: number
  personas: Record<string, number>
  mitre_tactics_covered: number
  mitre_tactics: { id: string; name: string; count: number }[]
  total_interactions: number
  anomaly: { samples: number; mean: number; max: number; p90: number }
}

export interface AdvisorResponse {
  role: string
  label: string
  reply: string
  live: boolean
}

export interface ResearchResponse {
  status: 'computing' | 'ready' | 'error' | 'unavailable'
  generated_at?: string
  compute_seconds?: number
  detection?: {
    n_benign: number
    n_malicious: number
    threshold: number
    precision: number
    recall: number
    f1: number
    roc_auc: number
    pr_auc: number
    roc_curve: [number, number][]
    pr_curve: [number, number][]
    confusion: { tn: number; fp: number; fn: number; tp: number }
    calibration: { predicted: number; empirical: number; count: number }[]
    ablation: { feature: string; auc_without: number; importance: number }[]
    feature_names: string[]
  }
  latency?: {
    n: number
    budget_ms: number
    mean_ms: number
    p50_ms: number
    p95_ms: number
    p99_ms: number
    max_ms: number
    under_budget_pct: number
    histogram: { range: string; lo: number; hi: number; count: number }[]
  }
  deception?: {
    mean_dqi: number
    judge_live: boolean
    personas: {
      persona: string
      label: string
      dqi: number
      believability: number
      consistency: number
      intel_extraction: number
      broke_character: boolean
      rationale: string
    }[]
  }
  error?: string
}

export async function getMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_URL}/api/metrics`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`metrics ${res.status}`)
  return res.json()
}

export async function getResearch(): Promise<ResearchResponse> {
  const res = await fetch(`${API_URL}/api/research`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`research ${res.status}`)
  return res.json()
}

export async function askAdvisor(role: string, message: string): Promise<AdvisorResponse> {
  const res = await fetch(`${API_URL}/api/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, message }),
  })
  if (!res.ok) throw new Error(`advisor ${res.status}`)
  return res.json()
}
