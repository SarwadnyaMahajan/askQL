# AI Data Analyst — Task Tracker

---

## Phase 1 — Project Scaffolding
- [ ] Initialize monorepo structure (`backend/`, `frontend/`, `data/`, `eval/`)
- [ ] Backend: `pip init` with FastAPI, LangGraph, DuckDB, anthropic, qdrant-client, redis, sqlalchemy, pydantic-settings
- [ ] Frontend: `npx create-vite` with React template
- [ ] Install frontend deps: `gsap`, `plotly.js-dist-min`, `react-plotly.js`, `react-router-dom`
- [ ] Create `.env.example` with all required env vars
- [ ] Create `docker-compose.yml` (backend, frontend, postgres, redis, qdrant)
- [ ] Create `Dockerfile` for backend (Python 3.11 + uvicorn)
- [ ] Create synthetic `data/sample_sales.csv` (~1000 rows, columns: date, region, product, customer, revenue, quantity, cost)

---

## Phase 2 — Backend: Upload + Single-Agent Q&A
- [x] `backend/app/main.py` — FastAPI app, CORS, lifespan hooks, health check
- [x] `backend/app/config.py` — Pydantic settings from env vars
- [x] `backend/app/models/schemas.py` — Pydantic request/response models
- [x] `backend/app/security/csv_sanitizer.py` — formula injection escape, prompt injection quarantine
- [x] `backend/app/services/duckdb_service.py` — per-session in-memory DuckDB, read-only connections, TTL cleanup
- [x] `backend/app/routers/upload.py` — CSV validation (MIME, size, schema), profiling (nulls, dtypes, duplicates, outliers), DuckDB load
- [x] `backend/app/services/qdrant_service.py` — embed schema + column stats into Qdrant per-session namespace
- [x] `backend/app/routers/chat.py` (v1) — single Claude call: retrieve schema → generate SQL → execute → narrate → SSE stream
- [ ] **Milestone test**: upload CSV → ask "Which region has highest revenue?" → get streamed answer
- [ ] 📌 **Git commit**: `feat: CSV upload + single-agent Q&A with DuckDB and SSE streaming`

---

## Phase 3 — Full LangGraph Multi-Agent Pipeline
- [ ] `backend/app/agents/router_agent.py` — intent classification (question, chart, anomaly, forecast, code_gen, general)
- [ ] `backend/app/agents/schema_retriever.py` — Qdrant semantic search for relevant columns/stats
- [ ] `backend/app/agents/coder_agent.py` — generate SQL + pandas code grounded in retrieved schema
- [ ] `backend/app/agents/validator.py` — SQL: `sqlglot` SELECT-only check; Pandas: AST allowlist walk
- [ ] `backend/app/agents/executor.py` — sandboxed execution (read-only DuckDB, 5s timeout, memory cap)
- [ ] `backend/app/agents/graph.py` — LangGraph `StateGraph` wiring all nodes + conditional edges
- [ ] Self-heal loop: Executor error → Coder retry (max 2), visible in trace
- [ ] `backend/app/agents/chart_agent.py` — result set → Plotly JSON spec, auto-select chart type
- [ ] `backend/app/agents/anomaly_agent.py` — IQR/Z-score/Isolation Forest + top-N LLM detective notes
- [ ] `backend/app/agents/forecast_agent.py` — datetime detection, statsmodels forecast + confidence interval
- [ ] `backend/app/agents/narrator_agent.py` — compose final answer citing agent sources + reasoning trace
- [ ] `backend/app/agents/memory.py` — LangGraph checkpointing for multi-turn conversation context
- [ ] Update `chat.py` to route through full LangGraph graph instead of single agent
- [ ] **Milestone test**: full pipeline end-to-end — question → router → schema → code → execute → narrate, all steps in trace

---

## Phase 4 — Frontend: Light YC Aesthetic + Heavy GSAP

### Design System
- [ ] `frontend/src/index.css` — CSS custom properties (colors, typography, spacing, shadows, radii)
- [ ] Import Inter font from Google Fonts
- [ ] Global reset + base styles (light off-white bg, near-black text, subtle borders)

### GSAP Infrastructure
- [ ] `frontend/src/animations/gsap-registry.js` — register ScrollTrigger, TextPlugin; export configured GSAP
- [ ] `frontend/src/hooks/useGsap.js` — custom hook: ref + animation callback + auto-cleanup on unmount
- [ ] `frontend/src/animations/transitions.js` — page/route transition timelines
- [ ] `frontend/src/animations/micro.js` — hover effects, stagger utilities, counter tweens, magnetic buttons

### Landing Page
- [ ] `frontend/src/pages/Landing.jsx` — hero with split-text stagger, subtext fade, magnetic CTA button
- [ ] ScrollTrigger feature cards (reveal on scroll)
- [ ] Route transition to Workspace on upload

### Upload Flow
- [ ] `frontend/src/components/upload/Dropzone.jsx` — drag-drop zone, GSAP border pulse on dragover
- [ ] `frontend/src/components/upload/FileCard.jsx` — fly-in animation on file add
- [ ] `frontend/src/components/upload/ProgressRing.jsx` — animated SVG progress ring + counter

### Workspace Layout
- [ ] `frontend/src/pages/Workspace.jsx` — split layout: sidebar (files + data quality) | main (chat + dashboard)
- [ ] `frontend/src/components/layout/Navbar.jsx` — minimal top nav, logo, user avatar
- [ ] `frontend/src/components/layout/Sidebar.jsx` — uploaded files list, data quality badges

### Dashboard
- [ ] `frontend/src/components/dashboard/AutoDashboard.jsx` — stat card grid, GSAP staggered scale-in
- [ ] `frontend/src/components/dashboard/StatCard.jsx` — number count-up animation (gsap.to with snap)
- [ ] `frontend/src/components/dashboard/QualityReport.jsx` — null %, dtype breakdown, duplicate count

### Chat
- [ ] `frontend/src/hooks/useSSE.js` — SSE stream consumer, parse typed events (token, agent_step, chart, code, anomaly)
- [ ] `frontend/src/components/chat/ChatPanel.jsx` — message list, input bar, GSAP slide-up per message
- [ ] `frontend/src/components/chat/MessageBubble.jsx` — user (right, accent) vs assistant (left, white card)
- [ ] `frontend/src/components/chat/StreamingText.jsx` — character-by-character typewriter reveal
- [ ] Embedded blocks: code (syntax highlighted), chart (Plotly), anomaly card within messages

### Charts
- [ ] `frontend/src/components/charts/ChartRenderer.jsx` — react-plotly.js wrapper, GSAP scale-in entrance

### Agent Trace
- [ ] `frontend/src/components/trace/AgentTraceTimeline.jsx` — vertical timeline, GSAP cascading reveal
- [ ] `frontend/src/components/trace/StepCard.jsx` — agent name, I/O summary, latency badge, status indicator

### Anomaly Detective
- [ ] `frontend/src/components/anomaly/AnomalyCard.jsx` — two-layer card (stat flag + detective note), GSAP slide-in
- [ ] Badge component: test type (IQR / Z-score / Isolation Forest), severity color

### Common Components
- [ ] `frontend/src/components/common/Button.jsx` — primary/secondary/ghost variants, magnetic hover
- [ ] `frontend/src/components/common/Badge.jsx` — colored badge for statuses
- [ ] `frontend/src/components/common/Modal.jsx` — GSAP scale + backdrop blur transition
- [ ] `frontend/src/components/common/Toast.jsx` — slide-in from top-right, auto-dismiss

---

## Phase 5 — Auth, Caching, Streaming, Security
- [ ] `backend/app/routers/auth.py` — register/login endpoints, JWT generation, password hashing (passlib)
- [ ] `backend/app/models/db_models.py` — SQLAlchemy User model, Postgres connection
- [ ] Auth middleware: extract JWT, attach user to request, protect routes
- [ ] `frontend/src/pages/Login.jsx` — login/register form with GSAP entrance animations
- [ ] `frontend/src/hooks/useAuth.js` — JWT token storage, auth state, protected route wrapper
- [ ] `backend/app/services/redis_service.py` — query result cache + embedding cache with TTL
- [ ] `backend/app/security/rate_limiter.py` — Redis token bucket (20 req/min)
- [ ] SSE streaming refinement: interleave agent step events with narrative tokens
- [ ] Security hardening pass: verify all §6 guardrails are enforced
  - [ ] CSV MIME + extension check
  - [ ] 25MB file size cap
  - [ ] Formula injection escape
  - [ ] Prompt injection quarantine
  - [ ] SELECT-only SQL enforcement
  - [ ] Pandas AST allowlist
  - [ ] Execution timeout (5s) + memory cap
  - [ ] Session isolation (no cross-session data)
  - [ ] CORS locked to frontend origin

---

## Phase 6 — Eval Framework, Trace Viewer, PDF Export
- [ ] `eval/test_set.json` — 15–20 Q&A pairs with expected SQL + numeric answers
- [ ] `eval/run_eval.py` — automated pipeline runner, scoring (exact match, tolerance, LLM-as-judge)
- [ ] Eval output: JSON report (pass rate, avg latency, token cost)
- [ ] `backend/app/routers/export.py` — PDF export of session (Q&A history, charts as images, anomaly notes)
- [ ] Structured logging: query type, latency, token counts, success/failure (no raw data in logs)
- [ ] Observability: trace metadata stored per request for the trace viewer UI

---

## Phase 7 — Deployment & Deliverables
- [ ] Finalize `docker-compose.yml` — all services bootable with `docker compose up`
- [ ] Auto-seed sample CSV on backend boot
- [ ] Cache pre-computed responses for sample dataset (demo resilience)
- [ ] Deploy backend to Railway or Fly.io
- [ ] Deploy frontend to Vercel
- [ ] Provision free-tier services: Neon Postgres, Qdrant Cloud, Upstash Redis
- [ ] `.github/workflows/ci.yml` — lint, test, audit, build, deploy on push to `main`
- [ ] `README.md` — setup instructions, mermaid architecture diagram, screenshots, assumptions, live link
- [ ] Record 10–30s demo video: upload → Q&A → chart → SQL gen → anomaly detective → self-heal retry → trace view
- [ ] Final review: all [deliverables checklist](file:///d:/Code/internship/assignment/PRD_AI_Data_Analyst.md#L189-L198) items complete
