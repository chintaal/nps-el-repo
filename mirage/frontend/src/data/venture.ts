// ──────────────────────────────────────────────────────────────────────────
// Mirage — the venture, as data. Single source of truth for every strategy
// surface in Mission Control. Edit here, the whole OS updates.
// ──────────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Mirage',
  category: 'Autonomous Cyber Deception & Threat Triage',
  tagline: 'Deception at machine speed.',
  taglineAlts: ['The honeypot that thinks.', 'Trap. Triage. Trace.'],
  mission:
    'Turn every intrusion attempt into intelligence — trap adversaries in synthetic environments and return forensic, MITRE-mapped truth in under 100 ms.',
  vision: 'A web where attacking any system means attacking a mirage.',
  values: [
    { k: 'Deceive ethically', v: 'Containment-first. Fabricate everything, expose nothing real.' },
    { k: 'Sub-100 ms or it didn’t happen', v: 'Latency is a feature; the LLM never blocks the request path.' },
    { k: 'Evidence over alarms', v: 'Ship adversary dossiers, not noisy alerts.' },
    { k: 'Containment by design', v: 'Every persona is guard-railed against breaking character.' },
  ],
  positioning:
    'Not a WAF, not a SIEM — an active deception fabric that converts attacks into adversary dossiers.',
}

export const JANUS = {
  name: 'JANUS',
  blurb:
    'Two-faced god of thresholds and deception — the AI co-founder. Calm, strategic, faintly wry. Reasons over the live system state.',
  roles: [
    { id: 'ceo', label: 'CEO', lens: 'Vision · narrative · highest-leverage move' },
    { id: 'cto', label: 'CTO', lens: 'Detection accuracy · latency · scale' },
    { id: 'product', label: 'Product', lens: 'Operator workflow · scope · activation' },
    { id: 'investor', label: 'Investor', lens: 'Moat · unit economics · risk' },
    { id: 'mentor', label: 'Mentor', lens: 'Focus · judgement · truth' },
  ],
  prompts: [
    'What is our single highest-leverage move right now?',
    'Where is the biggest technical risk in the detection pipeline?',
    'Why would an attacker NOT be fooled by our personas?',
    'What milestone de-risks a seed round?',
  ],
}

// ── Architecture / systems graph ─────────────────────────────────────────────
export interface SysNode { id: string; label: string; group: string; detail: string }
export interface SysEdge { from: string; to: string; label?: string }

export const SYSTEMS: { nodes: SysNode[]; edges: SysEdge[] } = {
  nodes: [
    { id: 'ingress', label: 'Async Proxy :8080', group: 'ingress', detail: 'Raw HTTP interception, per-session ledger, sub-ms routing.' },
    { id: 'patterns', label: 'Layer I — Regex', group: 'detect', detail: 'Deterministic signatures: SQLi, traversal, XSS, cmdi, scanners.' },
    { id: 'features', label: 'Feature Pipeline', group: 'detect', detail: '10-dim vector: entropy, n-grams, obfuscation, header & timing anomaly.' },
    { id: 'ensemble', label: 'Layer II — Ensemble', group: 'detect', detail: 'IsolationForest + One-Class SVM, Platt-calibrated probability.' },
    { id: 'deception', label: 'Deception Engine', group: 'ai', detail: '4 Claude personas, async/non-blocking, character guardrails.' },
    { id: 'efficacy', label: 'Efficacy Judge', group: 'ai', detail: 'LLM-as-judge → Deception Quality Index per persona.' },
    { id: 'mitre', label: 'MITRE Mapper', group: 'intel', detail: 'Deterministic technique map + LLM-refined confidence.' },
    { id: 'reporter', label: 'Forensic Reporter', group: 'intel', detail: 'PDF adversary dossier, tactics → techniques → countermeasures.' },
    { id: 'telemetry', label: 'Telemetry Bus', group: 'ingress', detail: 'Fire-and-forget WebSocket broadcast to the console.' },
    { id: 'janus', label: 'JANUS Advisor', group: 'ai', detail: 'Role-lensed strategy grounded in live metrics.' },
  ],
  edges: [
    { from: 'ingress', to: 'patterns' },
    { from: 'patterns', to: 'features' },
    { from: 'features', to: 'ensemble' },
    { from: 'ensemble', to: 'deception', label: 'engage' },
    { from: 'patterns', to: 'deception', label: 'known-bad' },
    { from: 'deception', to: 'efficacy' },
    { from: 'deception', to: 'mitre' },
    { from: 'mitre', to: 'reporter' },
    { from: 'ingress', to: 'telemetry' },
    { from: 'deception', to: 'telemetry' },
    { from: 'telemetry', to: 'janus' },
  ],
}

// ── Roadmap tech-tree ────────────────────────────────────────────────────────
export interface Phase {
  id: string
  name: string
  status: 'shipped' | 'active' | 'locked'
  horizon: string
  items: string[]
  unlocks: string[]
}

export const ROADMAP: Phase[] = [
  {
    id: 'p0', name: 'Phase 0 — Deception Console', status: 'shipped', horizon: 'Shipped',
    items: ['Async honeypot proxy', 'IsolationForest anomaly layer', '4 Claude deception personas', 'Live telemetry dashboard', 'MITRE PDF reports'],
    unlocks: ['p1'],
  },
  {
    id: 'p1', name: 'Phase 1 — Mission Control + Research Core', status: 'active', horizon: 'Now',
    items: ['10-feature calibrated ensemble', 'Benchmark harness (ROC-AUC, ablation, latency)', 'Deception Quality Index', 'JANUS advisor', 'Cinematic Mission Control UI'],
    unlocks: ['p2'],
  },
  {
    id: 'p2', name: 'Phase 2 — Production Hardening', status: 'locked', horizon: '3–6 mo',
    items: ['Session + event persistence', 'Auth / RBAC', 'Online retraining on live traffic', 'Prometheus metrics', 'Rate limiting & token budgets'],
    unlocks: ['p3'],
  },
  {
    id: 'p3', name: 'Phase 3 — Deception Fabric', status: 'locked', horizon: '6–12 mo',
    items: ['Multi-node mesh deployment', 'Adversary-intel data flywheel', 'Persona marketplace', 'Shared threat graph across tenants'],
    unlocks: [],
  },
]

// ── Competitors ──────────────────────────────────────────────────────────────
export interface Competitor { name: string; latency: number; intel: number; engagement: number; note: string; us?: boolean }
export const COMPETITORS: Competitor[] = [
  { name: 'Mirage', latency: 95, intel: 90, engagement: 95, note: 'Active LLM deception + calibrated ML triage', us: true },
  { name: 'WAF', latency: 90, intel: 25, engagement: 10, note: 'Blocks, learns nothing about the attacker' },
  { name: 'SIEM', latency: 40, intel: 60, engagement: 5, note: 'Correlates logs after the fact' },
  { name: 'EDR', latency: 55, intel: 55, engagement: 15, note: 'Endpoint-centric, not network deception' },
  { name: 'Classic honeypot', latency: 70, intel: 45, engagement: 50, note: 'Static, fingerprintable, no triage' },
]

// ── Risks / opportunities (2×2 by impact × likelihood) ───────────────────────
export interface RiskOpp { label: string; kind: 'risk' | 'opp'; impact: number; likelihood: number; note: string }
export const RISKS_OPPS: RiskOpp[] = [
  { label: 'LLM cost per engaged session', kind: 'risk', impact: 0.7, likelihood: 0.7, note: 'Cap tokens; cache persona scaffolds.' },
  { label: 'Persona fingerprinting', kind: 'risk', impact: 0.8, likelihood: 0.5, note: 'Rotate banners; DQI monitoring.' },
  { label: 'False positives at scale', kind: 'risk', impact: 0.7, likelihood: 0.45, note: 'Calibrated thresholds + drift watch.' },
  { label: 'Honeypot self-compromise', kind: 'risk', impact: 0.9, likelihood: 0.25, note: 'Containment guardrails, no real assets.' },
  { label: 'Adversary-intel flywheel', kind: 'opp', impact: 0.9, likelihood: 0.6, note: 'Each engagement sharpens the next.' },
  { label: 'MSSP channel', kind: 'opp', impact: 0.8, likelihood: 0.55, note: 'One deploy, many tenants.' },
  { label: 'Deception-as-a-feature API', kind: 'opp', impact: 0.7, likelihood: 0.5, note: 'Embed Mirage in any app perimeter.' },
]

// ── Growth loop ──────────────────────────────────────────────────────────────
export const GROWTH_LOOP = [
  { step: 'Deploy in front of an asset', icon: '◈' },
  { step: 'Capture adversary interactions', icon: '⌖' },
  { step: 'Score deception + extract intel', icon: '⊹' },
  { step: 'Sharpen personas & detectors', icon: '✦' },
  { step: 'Win the next design partner', icon: '➤' },
]

// ── Scenario simulator ───────────────────────────────────────────────────────
export type Decision = 'distribution' | 'hosting' | 'funding'
export interface DecisionState {
  distribution: 'oss' | 'proprietary'
  hosting: 'selfhost' | 'saas'
  funding: 'bootstrap' | 'raise'
}

export const DECISIONS: { id: Decision; label: string; left: string; right: string }[] = [
  { id: 'distribution', label: 'Distribution', left: 'oss', right: 'proprietary' },
  { id: 'hosting', label: 'Hosting', left: 'selfhost', right: 'saas' },
  { id: 'funding', label: 'Funding', left: 'bootstrap', right: 'raise' },
]

export type ScenarioKey = 'conservative' | 'base' | 'aggressive' | 'moonshot'
export interface Outcome { partners: number; arr: number; coverage: number; headcount: number }

// Deterministic, transparent scenario math — no backend, fully client-side.
export function projectOutcome(d: DecisionState, scenario: ScenarioKey): Outcome {
  const m: number = { conservative: 0.6, base: 1, aggressive: 1.8, moonshot: 3.4 }[scenario]

  let partners = 8
  let arrPerPartner = 18 // $k
  let coverage = 62 // % MITRE tactic coverage
  let headcount = 4

  if (d.distribution === 'oss') { partners *= 2.2; arrPerPartner *= 0.45; coverage += 8 }
  else { arrPerPartner *= 1.5; partners *= 0.9 }

  if (d.hosting === 'saas') { arrPerPartner *= 1.4; headcount += 3; coverage += 4 }
  else { arrPerPartner *= 0.85 }

  if (d.funding === 'raise') { partners *= 1.6; headcount += 8; coverage += 10 }
  else { headcount += 1 }

  partners = Math.round(partners * m)
  const arr = Math.round(partners * arrPerPartner * m)
  coverage = Math.min(99, Math.round(coverage * (0.85 + 0.15 * m)))
  headcount = Math.round(headcount * (0.7 + 0.3 * m))
  return { partners, arr, coverage, headcount }
}

export const SCENARIOS: { key: ScenarioKey; label: string; tone: string }[] = [
  { key: 'conservative', label: 'Conservative', tone: '#34D399' },
  { key: 'base', label: 'Base', tone: '#22D3EE' },
  { key: 'aggressive', label: 'Aggressive', tone: '#FACC15' },
  { key: 'moonshot', label: 'Moonshot', tone: '#A78BFA' },
]
