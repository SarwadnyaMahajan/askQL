/** AgentTraceTimeline — vertical timeline showing agent execution steps. */
import { useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';
import Badge from '../common/Badge';
import { AGENT_ICONS } from '../../utils/constants';

export default function AgentTraceTimeline({ steps = [], onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || steps.length === 0) return;
    const cards = ref.current.querySelectorAll('.trace-step');
    gsap.fromTo(cards,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power3.out' }
    );
  }, [steps.length]);

  const handleScrollToTop = () => {
    if (!ref.current) return;
    const parent = ref.current.closest('.workspace__right-rail') || ref.current.parentElement || ref.current;
    parent.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    if (!ref.current) return;
    const parent = ref.current.closest('.workspace__right-rail') || ref.current.parentElement || ref.current;
    parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
  };

  if (steps.length === 0) return null;

  return (
    <div ref={ref} className="trace-timeline">
      <div className="trace-timeline__header">
        <div className="trace-timeline__title-group">
          <h4 className="trace-timeline__title">Agent Trace</h4>
          <span className="trace-timeline__badge">{steps.length} steps</span>
        </div>
        <div className="trace-timeline__actions">
          <button
            type="button"
            className="btn-trace-scroll"
            onClick={handleScrollToTop}
            title="Scroll back to top of agent trace"
          >
            ⬆ Top
          </button>
          <button
            type="button"
            className="btn-trace-scroll"
            onClick={handleScrollToBottom}
            title="Scroll to latest agent step"
          >
            ⬇ Latest
          </button>
          {onClose && (
            <button
              type="button"
              className="btn-trace-close"
              onClick={onClose}
              title="Slide out / Hide Agent Trace (Slide right)"
            >
              ➡️
            </button>
          )}
        </div>
      </div>
      <div className="trace-timeline__list">
        {steps.map((step, i) => (
          <div key={i} className="trace-step">
            <div className="trace-step__line" />
            <div className="trace-step__dot" />
            <div className="trace-step__content">
              <div className="trace-step__header">
                <span className="trace-step__icon">
                  {AGENT_ICONS[step.agent] || '🔧'}
                </span>
                <span className="trace-step__agent">{step.agent}</span>
                {step.duration_ms != null && (
                  <Badge variant="default">{step.duration_ms}ms</Badge>
                )}
              </div>
              <p className="trace-step__action">{step.action}</p>
              {step.detail && (
                <p className="trace-step__detail">{step.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
