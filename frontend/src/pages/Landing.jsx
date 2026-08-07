/** Landing page — hero section with GSAP animations and upload CTA. */
import { useRef, useEffect } from 'react';
import { gsap } from '../animations/gsap-registry';
import Button from '../components/common/Button';

export default function Landing({ onGetStarted }) {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const featuresRef = useRef(null);

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

      // Feature cards stagger
      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll('.landing__feature');
        tl.fromTo(cards,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
          '-=0.2'
        );
      }
    }, heroRef.current);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="landing">
      <div className="landing__hero">
        <div className="landing__badge">✨ AI-Powered Analytics</div>
        <h1 ref={titleRef} className="landing__title">
          Your Data,{' '}
          <span className="landing__title-accent">Understood.</span>
        </h1>
        <p ref={subtitleRef} className="landing__subtitle">
          Upload any CSV. Ask questions in plain English.
          Get instant insights, charts, and anomaly detection — powered by multi-agent AI.
        </p>
        <div ref={ctaRef} className="landing__cta">
          <Button variant="primary" size="lg" onClick={onGetStarted}>
            Get Started — Upload CSV
          </Button>
        </div>
      </div>

      <div ref={featuresRef} className="landing__features">
        <div className="landing__feature">
          <span className="landing__feature-icon">💬</span>
          <h3>Natural Language Q&A</h3>
          <p>Ask questions about your data in plain English. Our AI generates SQL, executes it, and explains results.</p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">📊</span>
          <h3>Auto Visualizations</h3>
          <p>Charts are generated automatically based on your query and data shape. Bar, line, pie, scatter — all handled.</p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">🔍</span>
          <h3>Anomaly Detective</h3>
          <p>Statistical outlier detection (IQR + Z-score) combined with AI-generated investigative notes.</p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">📈</span>
          <h3>Forecasting</h3>
          <p>Time-series analysis with confidence intervals. Ask "predict next quarter sales" and get answers.</p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">🛡️</span>
          <h3>Secure by Design</h3>
          <p>Formula injection escaping, prompt injection quarantine, SELECT-only SQL, sandboxed execution.</p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">⚡</span>
          <h3>Agent Trace</h3>
          <p>See exactly what each AI agent did — Router, Coder, Validator, Executor, Narrator — full transparency.</p>
        </div>
      </div>
    </div>
  );
}
