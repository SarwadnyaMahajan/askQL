# PRD — AI-Powered Data Analyst
**Prepared for:** Digital Back Office Ltd. — AI Engineer Intern Assignment
**Target build agent:** Antigravity
**Version:** 1.0

---

## 1. Product Overview

A web application that lets a user upload one or more CSV files and interact with the data using natural language. The system answers questions, generates business insights, creates charts, generates SQL/pandas code, detects and explains anomalies, and maintains conversation context — powered by a multi-agent LLM pipeline rather than a single prompt-response wrapper.

**Success criteria:**
- Every example question in the assignment brief is answerable end-to-end.
- The agentic pipeline is visibly inspectable (trace of which agent/tool ran, in what order).
- The app is deployed on a live URL, fully on free-tier infrastructure, and survives a cold demo (no seeded local state required).
- Security guardrails prevent code-execution and prompt-injection failure modes, since the app executes LLM-generated code against user data.

---

## 2. Users & Core Use Cases

- Upload 1+ CSV files, get automatic validation and a data-quality summary.
- Ask natural-language questions ("Which region generated the highest revenue?") and get an answer with reasoning shown.
- Request charts ("Show monthly sales trends") — bar/line/pie/scatter, auto-selected when not specified.
- Request generated SQL/pandas code for a given analysis.
- Run anomaly detection and get a plain-language explanation for each flagged row.
- Continue a multi-turn conversation with context retained ("now break that down by product").

---

## 3. Feature Scope

### 3.1 Core (required by brief)
- Multi-CSV upload + validation (type, size, schema sanity check)
- Natural-language Q&A over the data
- Business insight/summary generation
- Chart generation: bar, line, pie, scatter (extendable)
- SQL and/or pandas code generation, shown alongside the answer
- Anomaly detection with explanation
- Visible reasoning trace behind every response
- Multi-turn conversation memory within a session

### 3.2 Bonus (from brief — all included)
- Multi-file analysis (joins across uploaded files)
- Auto-generated dashboard on upload
- Data quality checks (nulls, dtypes, duplicates, outlier %)
- Forecasting (time-series columns, Prophet/statsmodels)
- Agentic workflow (LangGraph multi-agent graph — see §5)
- Tool calling (each agent node is a bound tool)
- Semantic search (Qdrant over schema + past Q&A)
- Caching (Redis on embeddings + repeated queries)
- Authentication (JWT, per-user session isolation)
- Export reports (PDF export of session insights)
- Streaming responses (SSE — tokens + agent step events)
- Observability/logging (structured logs + trace viewer UI)
- Evaluation framework (fixed Q&A test set, automated scoring)

### 3.3 Standout / differentiator features
Priority order — build top-down, everything below the line is cut-safe if time runs short.

1. **Anomaly "detective" framing (P0)** — each flagged row gets a two-layer output: the statistical flag (test used, threshold crossed, e.g. IQR/Z-score/Isolation Forest) plus an LLM-written investigative note grounded in the actual comparison values (median, peer group, expected range). Cap at top-N most severe rows (default 10) to bound LLM calls on messy datasets.
---

## 4. System Architecture

**Stack:** FastAPI · LangGraph · DuckDB · React + Tailwind + GSAP · Qdrant · Redis · Postgres · Docker

**Why DuckDB:** runs real SQL directly against CSVs/dataframes in-memory — satisfies the "SQL and/or pandas" requirement natively and lets the app show both SQL and pandas for the same query.

**Data flow:**
1. User uploads CSV(s) → validated → profiled (data quality pass) → loaded into a per-session DuckDB instance.
2. Schema + column stats embedded into Qdrant (per-session namespace).
3. User sends a message → Router/Planner classifies intent.
4. Relevant schema retrieved from Qdrant → passed to Coder agent.
5. Coder generates SQL/pandas → Validator checks it (see §6.2) → Executor runs it in a sandbox.
6. On error: error routed back to Coder (self-healing retry, max 2 attempts).
7. Result routed to Chart agent (if visual), Anomaly agent (if requested/auto-triggered), or directly to Narrator.
8. Narrator agent composes the natural-language answer + reasoning trace.
9. Response streamed to frontend via SSE, trace events streamed to the agent-trace visualization in parallel.

---

## 5. Agent Graph (LangGraph nodes)

| Node | Input | Output | Notes |
|---|---|---|---|
| Router/Planner | user message, session state | intent classification | decides which downstream nodes fire |
| Schema Retriever | intent, query | relevant columns/stats | Qdrant semantic search, avoids full-schema stuffing |
| Coder | intent, schema context | SQL and/or pandas code | grounded only in retrieved schema |
| Validator | generated code | pass/fail + reason | see §6.2 — runs before execution, not after |
| Executor | validated code | result set | sandboxed (see §6.2) |
| Self-heal loop | execution error | corrected code | max 2 retries, then surfaces failure to user honestly |
| Chart Agent | result set | chart spec | Plotly, chart type auto-selected unless specified |
| Anomaly Agent | result set / full dataset | flags + notes | statistical test + grounded LLM explanation |
| Forecast Agent | time-series result set | forecast + interval | only triggered on explicit request or detected datetime column |
| Narrator | all upstream outputs | final NL answer | must cite which agent/tool produced each claim |
| Memory Manager | full turn | updated session state | LangGraph checkpointing |

---

## 6. Security & Guardrails

This app executes LLM-generated code against user-uploaded data — the security section is not optional polish, it's core scope.

### 6.1 Input validation
- CSV MIME-type and extension check; reject anything else.
- File size cap (e.g. 25 MB) and row/column caps enforced before parsing.
- CSV/Excel formula-injection defense: any cell value starting with `=`, `+`, `-`, `@` is escaped/neutralized before it is ever rendered, exported, or exposed to a spreadsheet tool downstream.
- Column names and cell values are treated strictly as **data**, never as instructions — any text resembling a prompt-injection attempt inside cell values (e.g. "ignore previous instructions") is stripped or quarantined before being placed in LLM context, and the system prompt explicitly instructs the model to treat file content as untrusted data.

### 6.2 Sandboxed code execution
- Generated SQL is restricted to `SELECT` only — no DDL/DML, enforced via a read-only DuckDB connection and an AST/query check before execution.
- Generated pandas code runs through an AST validator with a strict allowlist (no `eval`, `exec`, `os`, `sys`, `subprocess`, `open`, `import`, network calls, or filesystem access).
- Execution runs in a resource-limited sandbox: hard timeout (e.g. 5s), memory cap, no network egress.
- Each session gets its own isolated in-memory DuckDB instance — no cross-session data leakage.

### 6.3 Auth & access control
- JWT-based authentication; sessions and uploaded files scoped strictly per-user.
- Per-user rate limiting (Redis token bucket) to prevent abuse of LLM/compute resources.
- CORS locked to the deployed frontend origin only.

### 6.4 Secrets & infra
- All keys (LLM API, DB, Redis, Qdrant) via environment variables only; `.env` never committed, `.env.example` provided.
- HTTPS enforced on all deployed endpoints.
- Dependency versions pinned; CI runs a dependency audit (`pip-audit` / `npm audit`) on every build.

### 6.5 Data handling & privacy
- Uploaded files and session data auto-deleted after a TTL (e.g. 24h) or on explicit user deletion.
- No raw file contents or secrets written to logs — structured logs capture only metadata (query type, latency, token counts, success/failure).
- Optional column-level PII pattern detection (email, phone, national ID formats) flags sensitive columns and asks user confirmation before they're sent to the LLM.

---

## 7. Free-Tier Deployment Plan

| Component | Service | Free-tier notes |
|---|---|---|
| Frontend | Vercel | Zero-config React deploy, generous free tier |
| Backend (FastAPI+LangGraph, Dockerized) | Railway or Fly.io | Deploys existing Dockerfile directly; free tier sufficient for a demo app |
| Postgres | Neon or Supabase | Free serverless Postgres |
| Vector store | Qdrant Cloud | Free tier cluster, same API as local |
| Cache | Upstash Redis | Serverless, REST-based, free tier |
| CI/CD | GitHub Actions | Build → push image → deploy on push to `main` |
| Error tracking (optional) | Sentry free tier | Non-blocking, nice-to-have |

**Resilience for demo/review:**
- Cache a few pre-computed responses for the bundled sample dataset so a rate-limited LLM API doesn't break the live demo.
- Auto-seed the sample CSV on backend boot so a reviewer can test without sourcing their own file.

---

## 8. Evaluation Framework

- Fixed set of 15–20 Q&A pairs against the sample dataset, each with an expected SQL query and/or expected numeric answer.
- Automated script runs the full pipeline against each and scores:
  - Exact/tolerance match on numeric results.
  - LLM-as-judge score for narrative answer quality and reasoning transparency.
- Outputs a scored report (pass rate, average latency, token cost) — included in the repo as proof of a production-readiness mindset.

---

## 9. Build Phases

1. Upload → DuckDB → single-agent NL Q&A (no graph yet) — first demo-able milestone.
2. Full LangGraph pipeline + charts + anomaly detection (with detective framing) + self-healing retries.
3. Dashboard, data quality checks, multi-file support, click-to-drill-down.
4. Auth, caching, streaming, GSAP polish, security hardening pass (§6).
5. Evaluation framework, observability/trace viewer, PDF export.
6. Standout P1/P2 features (Data Story mode, voice narration, dialectic agent, OCR ingestion, scheduled reports, confidence badges) — in priority order, cut from the bottom if time runs short.
7. Deployment, seed/fallback data, final README + architecture diagram + demo video.

---

## 10. Assumptions

- LLM provider: Claude (Anthropic API), tool-use/function-calling for all agent nodes.
- Sample dataset: synthetic sales data (region, product, customer, date, revenue, quantity) built to directly answer every example question in the brief.
- Single demo deployment is sufficient; no multi-region or high-availability requirement.
- Anomaly/forecast features operate on numeric and datetime columns only in v1; categorical anomaly detection is out of scope.

## 11. Out of Scope (v1)

- Real-time multi-user collaborative editing of the same session.
- Non-CSV structured formats (Excel, JSON) beyond the OCR-ingestion path.
- Fine-tuning or self-hosting an LLM — API-based only.

---

## 12. Deliverables Checklist (maps to submission requirements)

- [ ] GitHub repo — complete source, modular structure
- [ ] README — setup, architecture diagram (mermaid), assumptions, screenshots, demo video/live link
- [ ] Dockerfile + docker-compose.yml
- [ ] Sample dataset(s) in `/data`
- [ ] Evaluation framework in `/eval`, runnable standalone
- [ ] Live deployed app link (free-tier stack above)
- [ ] 10–30s demo video covering: upload → Q&A → chart → SQL gen → anomaly detective notes → self-healing retry → agent trace view
