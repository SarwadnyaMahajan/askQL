/** Landing page — full redesign per redesign.md reference design spec.
 * Features: Nav, Hero with floating cards & gradient blob, Stat strip,
 * 2x2 Workflow grid, Key Features split view, CTA Banner, Pricing, Footer.
 */
import { useRef, useEffect } from 'react';
import { gsap } from '../animations/gsap-registry';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import GradientBlurBg from '../components/ui/GradientBlurBg';


export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const visualRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(titleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      )
      .fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      )
      .fromTo(ctaRef.current,
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5 },
        '-=0.3'
      );

      if (visualRef.current) {
        const floatCards = visualRef.current.querySelectorAll('.hero-float-card');
        tl.fromTo(floatCards,
          { y: 30, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1 },
          '-=0.3'
        );
      }
    }, heroRef.current);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-page">
      {/* ─── Ambient Gradient + Grid Background ────────────────────────────── */}
      <GradientBlurBg variant="hero" />

      {/* ─── Top Navigation Bar ────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand" onClick={() => navigate('/')}>
            <span className="landing-nav__logo">◆</span>
            <span className="landing-nav__wordmark">AI Data Analyst</span>
          </div>

          <div className="landing-nav__links">
            <a href="#features" className="landing-nav__link">Features</a>
            <a href="#workflow" className="landing-nav__link">Workflow</a>
            <a href="#technology" className="landing-nav__link">Technology</a>

          </div>

          <div className="landing-nav__actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/workspace')}
            >
              Try Free →
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-badge">
            <span>✨</span>
            <span>AI-Powered Multi-Agent Analytics</span>
          </div>

          <h1 ref={titleRef} className="landing-hero__title">
            Understand your data with{' '}
            <span className="title-accent">AI Agents</span>
          </h1>

          <p ref={subtitleRef} className="landing-hero__subtitle">
            Upload any CSV dataset. Ask questions in plain English. Watch specialized multi-agent pipeline reason, query, detect anomalies, and generate charts in real time.
          </p>

          <div ref={ctaRef} className="landing-hero__cta">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/workspace')}
            >
              Start Analyzing Free
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
            >
              Sign In / Register
            </Button>

          </div>
        </div>

        {/* Floating Cards & Gradient Blob Hero Composite */}
        <div ref={visualRef} className="hero-visual-wrapper">
          <div className="hero-blob" />

          {/* Central Main Chat Card */}
          <div className="hero-card-main">
            <div className="hero-card-main__header">
              <div className="hero-card-main__title">
                <span className="hero-card-main__dot" />
                <span>Multi-Agent Pipeline Active</span>
              </div>
              <div className="hero-card-main__agents">
                <span className="agent-chip">🧭 Router</span>
                <span className="agent-chip">💻 Coder</span>
                <span className="agent-chip">⚡ Executor</span>
              </div>
            </div>

            <div className="hero-card-main__body">
              <div className="hero-chat-bubble hero-chat-bubble--user">
                Which region produced the highest total revenue in 2024?
              </div>

              <div className="hero-chat-bubble hero-chat-bubble--assistant">
                <div className="hero-chat-narration">
                  The <strong>North Region</strong> generated <strong>$482,910</strong> in revenue, leading the Central region by <strong>18.4%</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Satellite Floating Card 1: SQL Snippet (Top Left) */}
          <div className="hero-float-card hero-float-card--sql">
            <div className="float-card__header">
              <span>SQL QUERY</span>
              <span className="float-card__badge">DuckDB</span>
            </div>
            <pre className="float-card__code">
              <code>SELECT region, SUM(revenue) FROM sales GROUP BY 1 ORDER BY 2 DESC LIMIT 1;</code>
            </pre>
          </div>

          {/* Satellite Floating Card 2: Mini Bar Chart (Top Right) */}
          <div className="hero-float-card hero-float-card--chart">
            <div className="float-card__header">
              <span>REVENUE BREAKDOWN</span>
            </div>
            <div className="mini-bar-chart">
              <div className="mini-bar" style={{ height: '100%' }} title="North $482k" />
              <div className="mini-bar" style={{ height: '75%' }} title="South $362k" />
              <div className="mini-bar" style={{ height: '82%' }} title="West $395k" />
              <div className="mini-bar" style={{ height: '60%' }} title="East $290k" />
            </div>
          </div>

          {/* Satellite Floating Card 3: Anomaly Alert (Bottom Left) */}
          <div className="hero-float-card hero-float-card--anomaly">
            <div className="float-card__anomaly">
              <span className="anomaly-icon">🔍</span>
              <div>
                <div className="anomaly-title">Anomaly Detected</div>
                <div className="anomaly-detail">Row #842: $24,500 (+840% vs peer avg)</div>
              </div>
            </div>
          </div>

          {/* Satellite Floating Card 4: Agent Step Execution (Bottom Right) */}
          <div className="hero-float-card hero-float-card--status">
            <div className="status-chip">
              <span className="status-dot" />
              <span>Executed in 14ms · 1,000 rows scanned</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stat Strip (Replaces Customer Logos) ─────────────────────────── */}
      <section className="landing-stat-strip">
        <div className="stat-strip__container">
          <div className="stat-strip__item">
            <span className="stat-strip__num">1,000+</span>
            <span className="stat-strip__label">Rows Analyzed per Query</span>

          </div>
          <div className="stat-strip__divider" />
          <div className="stat-strip__item">
            <span className="stat-strip__num">6</span>
            <span className="stat-strip__label">Specialized AI Agents</span>
          </div>
          <div className="stat-strip__divider" />
          <div className="stat-strip__item">
            <span className="stat-strip__num">&lt; 5s</span>
            <span className="stat-strip__label">Average Query Speed</span>
          </div>
          <div className="stat-strip__divider" />
          <div className="stat-strip__item">
            <span className="stat-strip__num">100%</span>
            <span className="stat-strip__label">SELECT-Only Security</span>
          </div>
        </div>
      </section>

      {/* ─── Workflow Section (2x2 Card Grid) ─────────────────────────────── */}
      <section id="workflow" className="landing-section">
        <div className="landing-section__header">
          <div className="landing-badge">Our Workflow</div>
          <h2 className="landing-section__title">
            How Data Analyst makes sense of your data, <span className="title-accent">easier</span>
          </h2>
          <p className="landing-section__desc">
            A specialized multi-agent pipeline handles validation, SQL generation, execution, visual rendering, and narration autonomously.
          </p>
        </div>

        <div className="workflow-grid">
          {/* Card 1 */}
          <div className="workflow-card">
            <div className="workflow-card__icon-badge">①</div>
            <h3 className="workflow-card__title">Upload Your CSV Data</h3>
            <p className="workflow-card__desc">
              Drop one or more CSV files. Automatic schema inspection, data quality checks, null percentages, and data profiling.
            </p>
            <div className="workflow-card__preview">
              <div className="preview-dropzone">
                <span>📄 sales_2024.csv</span>
                <span className="preview-tag">1,000 rows · 9 cols</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="workflow-card">
            <div className="workflow-card__icon-badge">②</div>
            <h3 className="workflow-card__title">Ask in Plain English</h3>
            <p className="workflow-card__desc">
              Ask anything about your numbers — top products, regional sales, anomaly checks, or time-series forecasts.
            </p>
            <div className="workflow-card__preview">
              <div className="preview-prompt">
                💬 "Show monthly sales trends for 2024"
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="workflow-card">
            <div className="workflow-card__icon-badge">③</div>
            <h3 className="workflow-card__title">Agents Reason in Real Time</h3>
            <p className="workflow-card__desc">
              Watch Router, Schema Retriever, Coder, Validator, and Executor work together to produce verified SQL queries.
            </p>
            <div className="workflow-card__preview">
              <div className="preview-steps">
                <span className="preview-step-chip">🧭 Router</span>
                <span className="preview-step-chip">💻 Coder</span>
                <span className="preview-step-chip">✅ Validator</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="workflow-card">
            <div className="workflow-card__icon-badge">④</div>
            <h3 className="workflow-card__title">Get Answers & Charts</h3>
            <p className="workflow-card__desc">
              Receive formatted markdown narration, downloadable charts (bar, line, pie, scatter), and full code transparency.
            </p>
            <div className="workflow-card__preview">
              <div className="preview-chart-box">
                <div className="preview-bar" style={{ height: '80%' }} />
                <div className="preview-bar" style={{ height: '50%' }} />
                <div className="preview-bar" style={{ height: '90%' }} />
                <div className="preview-bar" style={{ height: '65%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Key Features Section (Split View) ───────────────────────────── */}
      <section id="features" className="landing-section landing-section--tint">
        <div className="landing-section__header">
          <div className="landing-badge">Key Features</div>
          <h2 className="landing-section__title">
            Boost your analysis with <span className="title-accent">Data Analyst</span>
          </h2>
        </div>

        <div className="features-split">
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-item__icon">🔍</div>
              <div>
                <h3 className="feature-item__title">Anomaly Detective</h3>
                <p className="feature-item__desc">
                  Statistical outlier detection (IQR + Z-Score) combined with LLM investigative notes explaining extreme values.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-item__icon">📈</div>
              <div>
                <h3 className="feature-item__title">Forecasting & Time Series</h3>
                <p className="feature-item__desc">
                  Predict future metrics with automated datetime column recognition and confidence intervals.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-item__icon">⚡</div>
              <div>
                <h3 className="feature-item__title">Full Agent Reasoning Trace</h3>
                <p className="feature-item__desc">
                  Complete transparency into every step of the execution graph, timing metrics, and generated code.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-item__icon">🛡️</div>
              <div>
                <h3 className="feature-item__title">Secure Sandboxed Engine</h3>
                <p className="feature-item__desc">
                  Strict SELECT-only SQL isolation, prompt injection quarantine, and formula injection escaping.
                </p>
              </div>
            </div>
          </div>

          <div className="features-mockup">
            <div className="mockup-window">
              <div className="mockup-header">
                <span className="dot dot--red" />
                <span className="dot dot--yellow" />
                <span className="dot dot--green" />
                <span className="mockup-title">Workspace Live View</span>
              </div>
              <div className="mockup-body">
                <div className="mockup-bubble mockup-bubble--user">
                  Find the top 3 customers by revenue in South region.
                </div>
                <div className="mockup-bubble mockup-bubble--assistant">
                  <div className="mockup-trace">
                    <span>🧭 Router</span>
                    <span>💻 Coder</span>
                    <span>⚡ Executor</span>
                  </div>
                  <pre className="mockup-code">
                    <code>SELECT customer_id, SUM(revenue) FROM sales WHERE region='South' GROUP BY 1 LIMIT 3;</code>
                  </pre>
                  <p>Top customers: <strong>CUST-0042 ($18,400)</strong>, <strong>CUST-0019 ($15,200)</strong>, <strong>CUST-0088 ($14,100)</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner (Concentric Circles Device) ────────────────────────── */}
      <section className="landing-cta-banner">
        <div className="cta-banner__container">
          <div className="cta-banner__circles">
            <div className="circle circle--1" />
            <div className="circle circle--2" />
            <div className="circle circle--3" />
          </div>

          <div className="cta-banner__mark">◆</div>
          <h2 className="cta-banner__title">Ready to understand your data in seconds?</h2>
          <p className="cta-banner__desc">No setup required. Upload your CSV and start chatting with your data.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/workspace')}
          >
            Start Analyzing Free
          </Button>
        </div>
      </section>

      {/* ─── Tech Stack Showcase Section ─────────────────────────────────────── */}
      <section id="technology" className="landing-section">
        <div className="landing-section__header">
          <div className="landing-badge">Technology</div>
          <h2 className="landing-section__title">
            Built on <span className="title-accent">cutting-edge</span> infrastructure
          </h2>
          <p className="landing-section__desc">
            Every layer of the stack is purpose-built for speed, accuracy, and intelligent data reasoning.
          </p>
        </div>

        <div className="tech-stack-grid">
          {/* LangGraph */}
          <div className="tech-card tech-card--accent">
            <div className="tech-card__glow" />
            <div className="tech-card__icon-wrap tech-card__icon-wrap--purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            </div>
            <div className="tech-card__label">LangGraph</div>
            <div className="tech-card__name">Multi-Agent Orchestration</div>
            <p className="tech-card__desc">
              A directed stateful graph routes your query through specialised agents — Router → Coder → Validator → Executor → Chart → Narrator — each with a single responsibility.
            </p>
            <div className="tech-card__pill">StateGraph · Conditional Edges</div>
          </div>

          {/* DuckDB */}
          <div className="tech-card tech-card--teal">
            <div className="tech-card__glow" />
            <div className="tech-card__icon-wrap tech-card__icon-wrap--teal">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
            </div>
            <div className="tech-card__label">DuckDB</div>
            <div className="tech-card__name">In-Process Analytical Engine</div>
            <p className="tech-card__desc">
              Your CSV lands directly into a blazing-fast columnar in-memory database. SQL queries run locally with no round-trips — sub-second even on million-row files.
            </p>
            <div className="tech-card__pill">Columnar · In-Memory · SQL</div>
          </div>

          {/* LLM Layer */}
          <div className="tech-card tech-card--orange">
            <div className="tech-card__glow" />
            <div className="tech-card__icon-wrap tech-card__icon-wrap--orange">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div className="tech-card__label">Groq · Gemini · OpenAI</div>
            <div className="tech-card__name">LLM Intelligence Layer</div>
            <p className="tech-card__desc">
              Multi-model fallback ensures availability and cost efficiency. Groq's ultra-low latency handles real-time generation while Gemini handles complex reasoning tasks.
            </p>
            <div className="tech-card__pill">Groq LPU · Gemini Flash · GPT-4o</div>
          </div>

          {/* Qdrant */}
          <div className="tech-card tech-card--blue">
            <div className="tech-card__glow" />
            <div className="tech-card__icon-wrap tech-card__icon-wrap--blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div className="tech-card__label">Qdrant</div>
            <div className="tech-card__name">Vector Memory Store</div>
            <p className="tech-card__desc">
              Schema embeddings are stored in Qdrant so the Schema Retriever agent finds the most relevant column context via ANN search — not brute-force string matching.
            </p>
            <div className="tech-card__pill">ANN Search · Embeddings · RAG</div>
          </div>

          {/* LangSmith */}
          <div className="tech-card tech-card--green">
            <div className="tech-card__glow" />
            <div className="tech-card__icon-wrap tech-card__icon-wrap--green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div className="tech-card__label">LangSmith</div>
            <div className="tech-card__name">Full Trace Observability</div>
            <p className="tech-card__desc">
              Every agent invocation is traced end-to-end via LangSmith. Latency, token counts, and intermediate reasoning steps are captured for debugging and optimization.
            </p>
            <div className="tech-card__pill">Tracing · Token Metrics · Debugging</div>
          </div>

          {/* FastAPI + PostgreSQL */}
          <div className="tech-card tech-card--rose">
            <div className="tech-card__glow" />
            <div className="tech-card__icon-wrap tech-card__icon-wrap--rose">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div className="tech-card__label">FastAPI · PostgreSQL · Redis</div>
            <div className="tech-card__name">Production Backend</div>
            <p className="tech-card__desc">
              Async FastAPI SSE streams results token-by-token. PostgreSQL persists multi-tenant account data and chat history. Redis caches session state for instant workspace restoration.
            </p>
            <div className="tech-card__pill">SSE Streaming · Multi-tenant · JWT Auth</div>
          </div>
        </div>
      </section>


      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <div className="landing-footer__logo">
              <span>◆</span>
              <span>AI Data Analyst</span>
            </div>
            <p className="landing-footer__tagline">
              Autonomous multi-agent data analytics engine for instant CSV insights.
            </p>
          </div>

          <div className="landing-footer__links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#technology">Technology</a>

            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#workspace" onClick={(e) => { e.preventDefault(); navigate('/workspace'); }}>Workspace</a>
              <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In</a>

              <a href="https://github.com" target="_blank" rel="noreferrer">Documentation</a>
            </div>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <span>© 2026 AI Data Analyst. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
