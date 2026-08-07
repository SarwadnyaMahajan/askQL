# AI Data Analyst — Task Tracker

---

## Phase 1 — Project Scaffolding
- [x] Initialize monorepo structure (`backend/`, `frontend/`, `data/`, `eval/`)
- [x] Backend: `pip init` with FastAPI, LangGraph, DuckDB, google-genai, qdrant-client, redis, sqlalchemy, pydantic-settings
- [x] Frontend: `npx create-vite` with React template
- [x] Install frontend deps: `gsap`, `plotly.js-dist-min`, `react-plotly.js`, `react-router-dom`
- [x] Create `.env.example` with all required env vars
- [x] Create `docker-compose.yml` (backend, frontend, postgres, redis, qdrant)
- [x] Create `Dockerfile` for backend (Python 3.11 + uvicorn)
- [x] Create synthetic `data/sample_sales.csv` (~1000 rows, columns: date, region, product, customer, revenue, quantity, cost)

---

## Phase 2 — Backend: Upload + Gemini Migration + Multi-Agent Q&A
- [x] `backend/app/main.py` — FastAPI app, CORS, lifespan hooks, health check
- [x] `backend/app/config.py` — Pydantic settings from env vars (updated for Google Gemini)
- [x] `backend/app/models/schemas.py` — Pydantic request/response models
- [x] `backend/app/security/csv_sanitizer.py` — formula injection escape, prompt injection quarantine
- [x] `backend/app/services/duckdb_service.py` — per-session in-memory DuckDB, read-only connections, TTL cleanup
- [x] `backend/app/routers/upload.py` — CSV validation (MIME, size, schema), profiling (nulls, dtypes, duplicates, outliers), DuckDB load
- [x] `backend/app/services/qdrant_service.py` — embed schema + column stats into Qdrant per-session namespace
- [x] **Gemini Migration**: Replaced Anthropic SDK with `google-genai` and `langchain-google-genai`
- [x] **Milestone test**: Verified backend startup & `/health` endpoint returning `{"status":"ok","version":"0.1.0"}`

---

## Phase 3 — Full LangGraph Multi-Agent Pipeline
- [x] `backend/app/agents/router_agent.py` — intent classification (question, chart, anomaly, forecast, code_gen, general) via Gemini
- [x] `backend/app/agents/schema_retriever.py` — Qdrant / DuckDB schema context node
- [x] `backend/app/agents/coder_agent.py` — generate SQL + pandas code grounded in schema context via Gemini
- [x] `backend/app/agents/validator.py` — SQL: `sqlglot` SELECT-only check; Pandas: AST allowlist walk
- [x] `backend/app/agents/executor.py` — sandboxed execution (read-only DuckDB, timeout protection)
- [x] `backend/app/agents/graph.py` — LangGraph pipeline orchestrator wiring all nodes + self-heal retry loop
- [x] `backend/app/agents/chart_agent.py` — result set → Plotly JSON spec, auto-select chart type via Gemini
- [x] `backend/app/agents/anomaly_agent.py` — IQR / Z-score statistical detection + top-N Gemini detective notes
- [x] `backend/app/agents/forecast_agent.py` — datetime detection, statsmodels forecast + 95% confidence intervals
- [x] `backend/app/agents/narrator_agent.py` — compose final answer citing agent sources + reasoning trace via Gemini
- [x] `backend/app/agents/memory.py` — session conversation context manager
- [x] Update `chat.py` to route through full multi-agent pipeline and stream typed SSE events (`agent_step`, `code`, `chart`, `anomaly`, `forecast`, `token`, `error`, `done`)

---

## Phase 4 — Frontend: Light YC Aesthetic + GSAP Animations

### Design System
- [x] `frontend/src/index.css` — CSS custom properties (colors, typography, spacing, shadows, radii)
- [x] Import Inter font from Google Fonts
- [x] Global reset + base styles (light off-white bg, near-black text, subtle borders)

### GSAP Infrastructure
- [x] `frontend/src/animations/gsap-registry.js` — register ScrollTrigger, TextPlugin; export configured GSAP
- [x] `frontend/src/hooks/useGsap.js` — custom hook: ref + animation callback + auto-cleanup on unmount

### Landing Page
- [x] `frontend/src/pages/Landing.jsx` — hero with stagger reveal, subtext fade, CTA button
- [x] Feature cards grid

### Upload Flow
- [x] `frontend/src/components/upload/Dropzone.jsx` — drag-drop zone, GSAP border pulse on dragover
- [x] `frontend/src/components/upload/FileCard.jsx` — fly-in animation on file add

### Workspace Layout
- [x] `frontend/src/pages/Workspace.jsx` — split layout: sidebar (files + trace) | main (upload, dashboard, chart, chat)
- [x] `frontend/src/components/layout/Navbar.jsx` — minimal top nav, logo
- [x] `frontend/src/components/layout/Sidebar.jsx` — uploaded files list, agent trace steps

### Dashboard
- [x] `frontend/src/components/dashboard/AutoDashboard.jsx` — stat card grid + per-column stats
- [x] `frontend/src/components/dashboard/StatCard.jsx` — number count-up animation (GSAP counter)

### Chat & SSE
- [x] `frontend/src/hooks/useSSE.js` — SSE stream consumer, parse typed events (`token`, `agent_step`, `chart`, `code`, `anomaly`, `forecast`)
- [x] `frontend/src/components/chat/ChatPanel.jsx` — message list, input bar
- [x] `frontend/src/components/chat/MessageBubble.jsx` — user (right, accent) vs assistant (left, white card with embedded code, trace, anomalies)

### Charts & Trace
- [x] `frontend/src/components/charts/ChartRenderer.jsx` — react-plotly.js wrapper, GSAP scale-in entrance
- [x] `frontend/src/components/trace/AgentTraceTimeline.jsx` — vertical timeline, GSAP cascading reveal

### Common Components
- [x] `frontend/src/components/common/Button.jsx` — primary/secondary/ghost variants, hover animations
- [x] `frontend/src/components/common/Badge.jsx` — colored badge for statuses
- [x] `frontend/src/components/common/Toast.jsx` — slide-in from top-right, auto-dismiss

---

## Phase 5 — Auth, Caching, Streaming, Security
- [ ] `backend/app/routers/auth.py` — register/login endpoints, JWT generation, password hashing (passlib)
- [ ] `backend/app/models/db_models.py` — SQLAlchemy User model, Postgres connection
- [ ] Auth middleware: extract JWT, attach user to request, protect routes
- [ ] `frontend/src/pages/Login.jsx` — login/register form with GSAP entrance animations
- [ ] `frontend/src/hooks/useAuth.js` — JWT token storage, auth state, protected route wrapper
- [ ] `backend/app/services/redis_service.py` — query result cache + embedding cache with TTL
- [ ] `backend/app/security/rate_limiter.py` — Redis token bucket (20 req/min)
- [x] Security guardrails enforced:
  - [x] CSV MIME + extension check
  - [x] 25MB file size cap
  - [x] Formula injection escape
  - [x] Prompt injection quarantine
  - [x] SELECT-only SQL enforcement (`sqlglot`)
  - [x] Pandas AST allowlist
  - [x] Execution timeout (5s)
  - [x] Session isolation (no cross-session data)
  - [x] CORS locked to frontend origin

---

## Phase 6 — Eval Framework, Trace Viewer, PDF Export
- [ ] `eval/test_set.json` — 15–20 Q&A pairs with expected SQL + numeric answers
- [ ] `eval/run_eval.py` — automated pipeline runner, scoring (exact match, tolerance, LLM-as-judge)
- [ ] Eval output: JSON report (pass rate, avg latency, token cost)
- [ ] `backend/app/routers/export.py` — PDF export of session (Q&A history, charts as images, anomaly notes)

---

## Phase 7 — Deployment & Deliverables
- [x] `docker-compose.yml` — services bootable (backend, frontend, postgres, redis, qdrant)
- [x] `data/sample_sales.csv` — synthetic seed dataset (1,000 rows)
- [ ] Deploy backend to Railway or Fly.io
- [ ] Deploy frontend to Vercel
- [ ] `.github/workflows/ci.yml` — lint, test, audit, build, deploy on push to `main`
- [ ] `README.md` — setup instructions, mermaid architecture diagram, screenshots, live link
