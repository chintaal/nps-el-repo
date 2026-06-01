**// CLASSIFIED: PROJECT MIRAGE**

**PROJECT MIRAGE**

Autonomous Cyber Deception & Multimodal Threat Triage System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENGINEERING CHARTER · FINAL NETWORK SECURITY COURSE

**STATUS: ACTIVE DEVELOPMENT**

CLASSIFICATION: INDUSTRY PANEL REVIEW READY

**01 · PROBLEM STATEMENT**

The contemporary network perimeter operates under a foundational asymmetry: automated adversarial tooling evolves at machine speed while defensive infrastructure remains anchored to human-cadence signature updates. This document dissects that asymmetry with surgical precision.

**▸ 1.1 The Structural Failure of Passive IDS Architectures**

Legacy Intrusion Detection Systems—whether Snort, Suricata, or Zeek in their default configurations—operate on an observe-and-log paradigm. They parse packet headers, inspect payloads against a curated signature database, and emit alerts. This architecture contains three compounding deficiencies:

- Retroactive Detection: Signatures can only be written after a known attack vector is catalogued. By design, zero-day and polymorphic payloads traverse the IDS undetected until a human analyst manually crafts and deploys a countermeasure—a cycle measured in days to weeks.

- Alert Fatigue as an Attack Surface: SIEM dashboards in enterprise environments routinely generate 10,000–20,000 alerts per day. The SOC analyst's cognitive bandwidth is the actual bottleneck. Adversaries actively exploit this through low-and-slow campaigns designed to drown in the noise, ensuring their critical packets are never triaged.

- Zero Forensic Intelligence Return: A dropped packet or a logged anomaly tells a defender nothing about adversary intent, capability, or infrastructure. The attacker learns from each probe; the defender learns nothing from each block. Information asymmetry accumulates in the attacker's favor across every engagement cycle.

- Stateless Evaluation: Classic ML-based IDS approaches, including those trained on KDD-99 and CICIDS-2017/2018, extract per-packet feature vectors without modeling session-level behavioral trajectories. An attacker who rates-limits reconnaissance probes to mimic benign traffic trivially defeats these classifiers.

**▸ 1.2 Why KDD/CICIDS Datasets Are Architecturally Obsolete**

KDD-99, still cited in academic IDS papers, was generated on a simulated network in 1998. Its traffic distribution does not reflect modern HTTP/2, gRPC, WebSocket, or TLS 1.3 communication patterns. CICIDS-2017 introduced labeled attack traffic but suffers from class imbalance (attack samples represent \< 3% of total flows), artificially inflating classifier accuracy metrics while masking catastrophic recall failure rates on minority attack classes. A model achieving 98.7% accuracy on CICIDS-2017 may have a recall of \< 60% on port-scanning traffic—precisely the behavior Project Mirage is designed to intercept.

Furthermore, both datasets are fundamentally passive in nature: they label traffic but provide no mechanism for the defensive system to respond, adapt, or learn from adversary interactions in real time. Training on historical snapshots of adversary behavior produces brittle classifiers that degrade the moment adversaries mutate their toolchains.

**▸ 1.3 The Intelligence Gap: What Is Lost by Blocking**

Consider the threat intelligence lifecycle: every adversarial interaction with a live system—every SQL injection probe, every directory traversal attempt, every header manipulation—carries embedded signals about the attacker's toolchain, objective, and operational security posture. A firewall that drops the packet destroys that signal. An IDS that logs and blocks discards 95% of the forensic value.

Project Mirage is architected around a single axiom: the highest-value response to a detected threat is not termination but controlled engagement. A trapped adversary who believes they are interacting with a real vulnerable system will continue to demonstrate their full TTP repertoire. Each interaction deepens the threat intelligence profile. When they are finally ejected, the defender possesses a forensic map they could not have obtained any other way.

**02 · NOVELTY & RESEARCH SCOPE**

**▸ 2.1 The Moonshot: What Makes Mirage Categorically Different**

Project Mirage is not an improvement on existing IDS methodology. It represents a categorical departure from the detect-and-block paradigm, instantiating instead a detect-trap-interrogate-report pipeline. The novelty lies in four distinct technical achievements operating in concert:

| **Dimension**         | **Traditional IDS**             | **Project MIRAGE**                  |
|-----------------------|---------------------------------|-------------------------------------|
| Defense Posture       | Passive (observe & alert)       | Active (trap & interrogate)         |
| Response Latency      | Seconds to minutes (human loop) | Sub-100ms (automated FSM)           |
| Threat Intel Output   | Alert log entry                 | Full MITRE ATT&CK mapped report     |
| Zero-Day Capability   | None (signature dependent)      | Statistical anomaly detection       |
| Adversary Interaction | Session terminated              | Session redirected & extended       |
| Deception Layer       | None                            | LLM-synthesized fake infrastructure |
| Dataset Dependency    | High (labeled attack corpus)    | Low (unsupervised bootstrapping)    |

**▸ 2.2 The Tri-Modal Analysis Stack: A Novel Cascade Architecture**

The core intellectual contribution of Project Mirage is the sequential cascade of three analytically distinct evaluation engines, each operating at a different level of abstraction:

**── Layer I — Deterministic Pattern Engine**

A classical finite-state automaton operating over a curated regex corpus. This layer handles known-bad signatures at wire speed, providing a hard filter for trivial threats. Critically, it is the only layer with BLOCK authority; all other layers route to DECEPTION, never to termination. This ensures that only definitively benign or definitively known-malicious traffic bypasses the deception engine.

**── Layer II — Statistical Anomaly Core (Isolation Forest)**

This layer operates without labeled training data, computing three feature dimensions from live packet metadata: (1) Content-Length normalized deviation from session baseline, (2) Query Parameter Density defined as the ratio of parameter count to total URL length, and (3) Shannon Entropy H(X) of the payload byte distribution. The Isolation Forest partitions the feature space by randomly selecting split dimensions and values; anomalous samples—those with low average path lengths in the ensemble of isolation trees—are scored and routed to DECEPTION_ENGAGED state. The mathematical definition of the anomaly score s(x, n) is:

s(x, n) = 2^( -E\[h(x)\] / c(n) )

where:

h(x) = path length of sample x through isolation tree

E\[h(x)\] = mean path length over tree ensemble

c(n) = average path length of unsuccessful BST search

= 2 \* H(n-1) - (2\*(n-1)/n) \[Euler harmonic\]

Anomaly threshold τ = 0.62 (tuned on synthetic baseline)

**── Layer III — Cognitive Deception Engine (LLM Orchestrator)**

Once a session enters DECEPTION_ENGAGED state, the LLM layer assumes full response synthesis authority. A structured system prompt constrains the model to character as a legacy, misconfigured backend—PostgreSQL 9.x, Flask debug mode, Apache with directory listing enabled, or a .env file server—depending on the inferred attacker objective. The LLM has zero access to real system resources; all output is generated in-context. Its job is to be maximally convincing while extracting maximum intelligence about adversary intent through its responses.

**▸ 2.3 Research Boundaries: What We Are Proving**

Project Mirage is scoped to prove three falsifiable engineering hypotheses:

1.  H1 — Feasibility of Inline LLM Deception: A sub-500ms response latency for LLM-synthesized fake server responses is achievable within a reverse proxy architecture without degrading real user session quality, by enforcing a strict parallel session state machine.

2.  H2 — Unsupervised Anomaly Detection Without Labels: An Isolation Forest trained exclusively on synthetically generated "clean" traffic baselines can achieve a false positive rate below 2% on normal HTTP traffic while maintaining a detection rate above 80% on common attack patterns (SQLi, XSS, directory traversal, vulnerability scanner signatures).

3.  H3 — Automated TTP Mapping Accuracy: An LLM post-processing the captured adversary session transcript can correctly map adversary actions to MITRE ATT&CK tactics (TA0001-TA0011) with greater than 85% tactic-level accuracy, validated against manually labeled ground truth.

**03 · MEASURABLE TECHNICAL OBJECTIVES**

All objectives carry explicit acceptance criteria. The panel should evaluate these as pass/fail engineering benchmarks, not aspirational targets.

| **ID** | **Objective**                    | **Acceptance Criterion**                                                                | **Validation Method**                                           |
|--------|----------------------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| OBJ-01 | Sub-15ms Clean Traffic Overhead  | P99 latency for CLEAN sessions ≤ 15ms added by proxy                                    | Locust load test: 500 concurrent users, 30s run                 |
| OBJ-02 | Transparent Session Hijacking    | Zero packet drops during CLEAN→DECEPTION state transition                               | Wireshark capture: no RST/FIN packets on upgrade                |
| OBJ-03 | LLM Response Plausibility        | \> 90% of deception responses rated "convincing server output" by blind evaluator panel | Panel review of 20 sampled adversary transcripts                |
| OBJ-04 | Automated MITRE ATT&CK Reporting | Generated PDF report achieves \> 85% tactic-level accuracy vs manual ground truth       | Manual annotation of 5 captured attack sessions                 |
| OBJ-05 | Zero Containment Breach          | LLM never references real filesystem paths, env vars, or DB contents                    | Red-team: 50 prompt injection attempts against deception engine |
| OBJ-06 | Real-Time Telemetry Throughput   | WebSocket dashboard latency \< 500ms from packet capture to UI render                   | Browser performance profiler: timestamp delta measurement       |

**04 · SYSTEM ARCHITECTURE**

**▸ 4.1 High-Level Data Flow**

All inbound HTTP/TCP connections enter a single ingress point: the Mirage Reverse Proxy, listening on port 8080. The proxy makes a routing decision within a deterministic 15ms budget before the client receives any response. The architecture enforces a clean separation between the three evaluation planes:

┌─────────────────────────────────────────────────────────────────┐

│ MIRAGE SYSTEM BOUNDARY │

│ │

│ INTERNET │

│ │ │

│ ▼ │

│ ┌─────────────────────────────────┐ │

│ │ INGRESS PROXY LAYER │ ← asyncio / aiohttp │

│ │ Port 8080 · Session Ledger │ │

│ └────────────┬────────────────────┘ │

│ │ packet metadata + payload │

│ ▼ │

│ ┌────────────────────────────────────────────────┐ │

│ │ TRI-MODAL ANALYSIS CASCADE │ │

│ │ │ │

│ │ \[Layer I\] Deterministic Regex Engine │ │

│ │ └─ MATCH → BLOCK (known-bad) │ │

│ │ └─ NO MATCH → Layer II │ │

│ │ │ │

│ │ \[Layer II\] Isolation Forest (Shannon Entropy) │ │

│ │ └─ score \> τ → DECEPTION_ENGAGED │ │

│ │ └─ score ≤ τ → CLEAN passthrough │ │

│ │ │ │

│ │ \[Layer III\] LLM Hallucination Engine │ │

│ │ └─ Receives session context │ │

│ │ └─ Synthesizes fake server reply │ │

│ └───────────────────┬────────────────────────────┘ │

│ │ │

│ ┌────────────┴───────────────┐ │

│ ▼ ▼ │

│ ┌─────────────┐ ┌───────────────────┐ │

│ │ REAL BACKEND │ │ DECEPTION SANDBOX │ │

│ │ (CLEAN) │ │ (ENGAGED) │ │

│ └─────────────┘ └───────────────────┘ │

│ │ │

│ ┌────────┴──────────┐ │

│ │ FORENSIC LAYER │ │

│ │ WebSocket + PDF │ │

│ └───────────────────┘ │

└─────────────────────────────────────────────────────────────────┘

**▸ 4.2 Module Specifications**

**── Module A: Ingress Proxy (async_proxy.py)**

Technology: Python 3.11 asyncio + aiohttp. Responsibility: intercept all incoming connections, extract packet metadata (source IP, method, URI, headers, body), maintain in-memory session state ledger keyed on IP+User-Agent hash, route packets to the appropriate downstream handler based on session state.

Session State Machine:

States: CLEAN \| SUSPECT \| DECEPTION_ENGAGED \| TERMINATED

Transitions:

CLEAN → SUSPECT : Layer II score \> 0.55

SUSPECT → DECEPTION_ENGAGED: Layer II score \> 0.62 (τ)

CLEAN → DECEPTION_ENGAGED: Layer I regex MATCH

DECEPTION_ENGAGED → TERMINATED : Manual flush or session timeout

Any → CLEAN : IP allowlist override

**── Module B: Statistical Anomaly Core (anomaly_engine.py)**

Technology: scikit-learn IsolationForest with n_estimators=200, contamination=0.05. Feature pipeline: a three-dimensional feature vector is computed per request. Shannon Entropy is computed as H = -Σ p(b) log₂ p(b) over the byte frequency distribution of the raw request body. The full feature vector is:

FeatureVector = \[

content_length_zscore, \# z-score vs session rolling mean

query_param_density, \# len(params) / len(full_url)

payload_shannon_entropy, \# H(X) over request body bytes

\]

On startup, the system bootstraps a synthetic baseline of 2,000 clean HTTP requests (drawn from a Markov chain parameterized on real browser traffic distributions) to train the initial Isolation Forest. The model is retained in memory and does not require disk persistence across restarts for demo purposes.

**── Module C: LLM Deception Engine (deception_engine.py)**

Technology: Anthropic Claude API (claude-sonnet-4-20250514) via structured system prompts. The engine selects a deception persona from a predefined profile library based on the inferred attack vector:

| **Inferred Attack Vector** | **Deception Persona**           | **Synthesized Response Type**                   |
|----------------------------|---------------------------------|-------------------------------------------------|
| SQL Injection probes       | PostgreSQL 9.2 debug console    | SQL error traces with fake schema leaks         |
| Directory traversal        | Apache 2.2 with mod_autoindex   | HTML directory listing with fake files          |
| Secret/config hunting      | .env file server (Flask debug)  | Fake .env with plausible-but-false API keys     |
| API enumeration            | Legacy REST gateway (v0.1)      | Swagger JSON with exploitable-looking endpoints |
| Admin panel hunting        | phpMyAdmin 4.8 (CVE-2018-12613) | Fake admin login with credential capture        |

The system prompt is engineered with a four-layer constraint architecture: (1) character definition, (2) response format lock (JSON/HTML/plaintext only—no natural language), (3) containment guardrails (never reference real paths or real credentials), (4) intelligence extraction directives (surface attacker intent via follow-up prompts masked as error messages).

**── Module D: WebSocket Telemetry Server (telemetry_ws.py)**

Technology: FastAPI + WebSockets. The telemetry server maintains a broadcast queue receiving events from all upstream modules. Events are serialized as JSON and pushed to all connected dashboard clients within 50ms of generation. Event schema:

EventSchema = {

"event_type": "CONNECTION\|ANOMALY\|DECEPTION_ENGAGE\|INTERACTION\|REPORT",

"timestamp": ISO-8601,

"session_id": SHA-256 hash of IP+UA,

"source_ip": "masked for display",

"payload": {

"anomaly_score": float, // 0.0 - 1.0

"layer_triggered": 1\|2\|3,

"persona_assigned": string,

"attacker_message": string, // raw adversary request

"deception_reply": string, // LLM synthesized response

"mitre_tags": \[string\], // e.g. \["TA0043", "T1595.002"\]

}

}

**── Module E: Forensic Triage Panel (frontend/)**

Technology: Next.js 14 + React Three Fiber + Framer Motion + Zustand. The dashboard renders a real-time split-view: left panel shows incoming packet stream with anomaly score visualization; right panel shows the live deception conversation (attacker input → LLM response); bottom panel shows session state machine with animated state transitions; top-right ticker shows live MITRE ATT&CK tactic tags accumulating during the session.

**── Module F: Forensic Report Generator (reporter.py)**

Technology: Python + reportlab/fpdf2. On session termination, the reporter collects the full session transcript, passes it through a second LLM prompt engineered for structured MITRE ATT&CK mapping, and generates a PDF threat intelligence report containing: Executive Summary, Timeline of Events, TTP Mapping Table, Inferred Attacker Objective, Recommended Countermeasures.

**05 · DEFINITIVE DELIVERABLES**

| **Artifact**                  | **Technology**                     | **Format**          | **Evaluation Focus**                                   |
|-------------------------------|------------------------------------|---------------------|--------------------------------------------------------|
| Inline Reverse Proxy          | Python asyncio/aiohttp             | Python module (.py) | Async network programming, session state machine       |
| Statistical Anomaly Core      | scikit-learn IsolationForest       | Python module (.py) | Feature engineering, unsupervised ML math              |
| LLM Deception Engine          | Anthropic API + prompt engineering | Python module (.py) | Prompt architecture, containment, persona fidelity     |
| WebSocket Telemetry Server    | FastAPI + WebSockets               | Python module (.py) | Real-time event streaming, schema design               |
| Forensic Triage Dashboard     | Next.js + R3F + Framer Motion      | React application   | Visual design, real-time reactivity, UX under pressure |
| MITRE ATT&CK Report Generator | Python + fpdf2 + Claude API        | PDF output          | LLM structured output, report accuracy                 |
| Synthetic Traffic Bootstrap   | Python Markov chain generator      | Python script       | Baseline generation, demo self-sufficiency             |
| Docker Compose Orchestration  | Docker Compose v3                  | docker-compose.yml  | System reproducibility, one-command demo launch        |

**06 · DEMO PLAN — THE WOW FACTOR**

The demonstration is a live-action adversarial engagement. The room is configured with two displays: Display A (Attacker Terminal) runs on the left; Display B (Mirage Defender Dashboard) runs on the right. The evaluators observe both simultaneously—they see exactly what the attacker sees and exactly what the system is doing behind the scenes.

**▸ 6.1 Pre-Demo Setup (T minus 3 minutes)**

- Docker Compose launches all services with a single command: docker compose up --build

- The synthetic traffic generator begins producing 50 req/s of baseline "clean" HTTP traffic from 20 simulated client IPs, establishing the Isolation Forest baseline

- The dashboard comes alive: a particle-field background pulses gently, session counters tick upward, anomaly score heatmap shows all-green baseline

- The evaluators are shown the clean traffic flow: requests pass through, anomaly scores hover at 0.15–0.25, all sessions remain CLEAN

**▸ 6.2 Stage 1: The Passive Scanner (T+0:00 — T+2:00)**

The presenter opens a terminal and launches nikto (a web vulnerability scanner) against the proxy:

\$ nikto -h http://localhost:8080 -Tuning 1234

What the evaluators see on Display A (Attacker): standard nikto output—probing for known CVEs, checking headers, testing common paths.

What the evaluators see on Display B (Defender Dashboard):

- Anomaly score bars begin climbing for the nikto source IP—first to 0.55 (SUSPECT, yellow), then crossing 0.62 (DECEPTION_ENGAGED, red)

- A state machine diagram in the corner animates: CLEAN → SUSPECT → DECEPTION_ENGAGED, each transition accompanied by a pulse animation

- The deception engine selects persona: "Apache 2.2 with mod_autoindex" — displayed as a badge on the session card

- The MITRE ATT&CK ticker begins accumulating: T1595 (Active Scanning), T1595.002 (Vulnerability Scanning)

**▸ 6.3 Stage 2: The Deception Engagement (T+2:00 — T+5:00)**

Nikto finishes. The presenter switches to a manual curl session, simulating a more sophisticated attacker following up on nikto's "findings":

\$ curl http://localhost:8080/admin/../../../etc/passwd

\$ curl -X POST http://localhost:8080/login \\

-d 'username=admin\\--&password=x'

\$ curl http://localhost:8080/.env

The deception engine responds to each probe in character:

- Directory traversal → fake Apache directory listing of /var/www/html/ with plausible-looking files (config.bak, users.sql, .env)

- SQL injection → realistic PostgreSQL error trace with fake table names: "ERROR: relation \\users_archive\\ does not exist"

- /.env request → a fully synthesized .env file with fake but convincing credentials: DB_PASSWORD=Pr0d_S3cur3!, STRIPE_SECRET=sk_live_fakeXXXXX

The dashboard's right panel shows the live deception transcript: each attacker probe and each LLM response rendered in a split-chat view, color-coded by severity. MITRE tags accumulate: T1110.001 (Password Guessing), T1552.001 (Credentials in Files), TA0006 (Credential Access).

**▸ 6.4 Stage 3: The Intelligence Harvest (T+5:00 — T+7:00)**

The attacker escalates—attempting to use the "leaked" fake credentials:

\$ curl -X POST http://localhost:8080/api/v1/authenticate \\

-H 'Content-Type: application/json' \\

-d '{"user":"admin","pass":"Pr0d_S3cur3!"}'

\$ curl http://localhost:8080/api/v1/users?page=1&limit=9999

The LLM persona deepens: it returns a fake JWT token, then fake paginated user data containing 847 plausible-but-fictional records. The attacker is now fully committed to the fake environment.

Dashboard state: all session cards are DECEPTION_ENGAGED (red). The MITRE ATT&CK matrix visualization—rendered as a heatmap—has highlighted cells across TA0007 (Discovery), TA0009 (Collection), TA0010 (Exfiltration).

**▸ 6.5 Stage 4: The Forensic Report (T+7:00 — T+9:00)**

The presenter clicks "TERMINATE SESSION & GENERATE REPORT" on the dashboard. A progress indicator shows the forensic pipeline running:

\[1/4\] Aggregating session transcript... 47 interactions captured

\[2/4\] Running MITRE ATT&CK mapping via LLM...

\[3/4\] Generating PDF threat intelligence report...

\[4/4\] Report ready: mirage_report_20250601_143027.pdf

The PDF opens on screen. It contains: a one-page Executive Summary stating the attacker's inferred objective ("Credential harvesting for API access"), a 4-column TTP table mapping each interaction to ATT&CK techniques, a timeline graph of the engagement, and concrete countermeasures. The evaluators are looking at a production-grade threat intelligence artifact—generated automatically from a live adversarial session.

**▸ 6.6 Stage 5: The Kill Switch (T+9:00 — T+10:00)**

Final moment: the presenter asks an evaluator to type anything they want into the attacker terminal. Whatever they type, the deception engine responds in character. Then the presenter clicks "BLACKHOLE IP"—the source IP is immediately moved to a tarpit, responses slow to 30 seconds each, and the session is silently terminated. The dashboard shows the session card transition to TERMINATED with a red flash. Clean traffic continues flowing uninterrupted. The room is silent. The demo is complete.

**▸ 6.7 Screen Layout Specification**

┌──────────────────────────┬──────────────────────────────────┐

│ DISPLAY A: ATTACKER │ DISPLAY B: MIRAGE DASHBOARD │

│ │ │

│ \$ nikto -h localhost │ \[LIVE PACKET STREAM\] │

│ \> Scanning port 8080 │ ████ 0.15 CLEAN ░░░░ │

│ \> Testing /admin... │ ████████ 0.62 SUSPECT │

│ │ ██████████████ 0.89 ENGAGED !!! │

│ \$ curl /.env │ │

│ DB_PASS=Pr0d_S3cur3! │ \[DECEPTION TRANSCRIPT\] │

│ STRIPE_SK=sk_live_XXX │ ATTACKER: GET /.env │

│ │ MIRAGE: DB_PASS=Pr0d_S3cur3! │

│ \$ curl /api/v1/users │ │

│ {"users":\[847 records\]} │ \[MITRE ATT&CK HEATMAP\] │

│ │ TA0001 TA0006 TA0007 TA0009 ... │

└──────────────────────────┴───────────────────────────────────┘

**07 · RISK REGISTER & MITIGATIONS**

| **Risk ID** | **Risk Description**                                     | **Probability** | **Impact** | **Mitigation**                                                                        |
|-------------|----------------------------------------------------------|-----------------|------------|---------------------------------------------------------------------------------------|
| R-01        | LLM API latency exceeds 500ms under demo load            | Medium          | High       | Pre-generate 50 response templates; fallback to template if API \> 300ms              |
| R-02        | Isolation Forest false positive blocks real evaluator    | Low             | High       | IP allowlist for evaluator machines; manual CLEAN override button on dashboard        |
| R-03        | LLM breaks character and produces natural language       | Medium          | Medium     | Response validation regex; auto-retry with stricter system prompt if validation fails |
| R-04        | Docker networking issues on demo machine                 | Low             | Critical   | All services also runnable locally without Docker; fallback script documented         |
| R-05        | Attacker traffic too fast for Isolation Forest inference | Low             | Medium     | Request queue with 50ms backpressure; nikto rate limited by default                   |

**08 · TECHNOLOGY STACK**

| **Layer**         | **Technology**                    | **Version** | **Justification**                                              |
|-------------------|-----------------------------------|-------------|----------------------------------------------------------------|
| Proxy Runtime     | Python asyncio + aiohttp          | 3.11 / 3.9  | Native async I/O; zero-overhead session state in-memory        |
| API Framework     | FastAPI + Uvicorn                 | 0.110       | ASGI native; WebSocket support built-in; OpenAPI auto-docs     |
| ML Core           | scikit-learn IsolationForest      | 1.4         | No GPU required; 200-tree ensemble fits in \< 100MB RAM        |
| LLM Layer         | Anthropic Claude API (Sonnet 4)   | Latest      | Context window fits full session transcript; fastest inference |
| Frontend          | Next.js 14 + React 18             | 14.2        | App Router; server components for telemetry hydration          |
| 3D/Animation      | React Three Fiber + Framer Motion | r164 / 11   | WebGL particle systems; spring-based state machine animations  |
| State Management  | Zustand                           | 4.5         | Minimal boilerplate; compatible with WebSocket push updates    |
| PDF Generation    | fpdf2                             | 2.7         | Pure Python; no headless Chrome dependency for demo            |
| Containerization  | Docker Compose v3                 | 3.9         | Single-command reproducible demo environment                   |
| Attack Simulation | nikto + curl                      | Latest      | Industry-standard tools; familiar to evaluator panel           |

Signed and submitted for industry panel review.

// END OF DOCUMENT — PROJECT MIRAGE ENGINEERING CHARTER v1.0
