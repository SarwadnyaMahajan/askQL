/** Landing page — full redesign per redesign.md reference design spec.
 * Features: Nav, Hero with floating cards & gradient blob, Stat strip,
 * 2x2 Workflow grid, Key Features split view, CTA Banner, Pricing, Footer.
 */
import { useRef, useEffect } from 'react';
import { gsap } from '../animations/gsap-registry';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

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
            <a href="#pricing" className="landing-nav__link">Pricing</a>
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

      {/* ─── Pricing Section ───────────────────────────────────────────────── */}
      <section id="pricing" className="landing-section">
        <div className="landing-section__header">
          <div className="landing-badge">Pricing</div>
          <h2 className="landing-section__title">
            Simple, transparent <span className="title-accent">pricing</span>
          </h2>
          <p className="landing-section__desc">Choose the plan that best fits your analytics workload.</p>
        </div>

        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="pricing-card">
            <div className="pricing-card__name">Starter</div>
            <div className="pricing-card__price">$0 <span>/ month</span></div>
            <p className="pricing-card__desc">Ideal for individual exploration and quick data checks.</p>
            <ul className="pricing-card__features">
              <li>✓ 10 CSV Uploads per day</li>
              <li>✓ Standard DuckDB engine</li>
              <li>✓ 50 AI queries per day</li>
              <li>✓ Basic chart visualizations</li>
            </ul>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => navigate('/workspace')}
            >
              Get Started Free
            </Button>
          </div>

          {/* Pro Plan (Highlighted) */}
          <div className="pricing-card pricing-card--featured">
            <div className="pricing-card__popular">Most Popular</div>
            <div className="pricing-card__name">Analyst Pro</div>
            <div className="pricing-card__price">$29 <span>/ month</span></div>
            <p className="pricing-card__desc">Full multi-agent capabilities for power data users.</p>
            <ul className="pricing-card__features">
              <li>✓ Unlimited CSV dataset uploads</li>
              <li>✓ LangGraph multi-agent pipeline</li>
              <li>✓ Anomaly Detective & Forecasting</li>
              <li>✓ Full Agent Trace visibility</li>
              <li>✓ High-priority Groq & Gemini fallback</li>
            </ul>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => navigate('/workspace')}
            >
              Start 14-Day Free Trial
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="pricing-card">
            <div className="pricing-card__name">Enterprise</div>
            <div className="pricing-card__price">$99 <span>/ month</span></div>
            <p className="pricing-card__desc">Dedicated infrastructure and team workspace isolation.</p>
            <ul className="pricing-card__features">
              <li>✓ Everything in Analyst Pro</li>
              <li>✓ Dedicated Qdrant Vector namespace</li>
              <li>✓ Custom Redis session caching</li>
              <li>✓ Admin access & audit logs</li>
              <li>✓ Priority 24/7 support</li>
            </ul>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => navigate('/workspace')}
            >
              Contact Sales
            </Button>
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
              <a href="#pricing">Pricing</a>
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
