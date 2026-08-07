/** AgentTraceTimeline — vertical timeline showing agent execution steps. */
import { useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';
import Badge from '../common/Badge';
import { AGENT_ICONS } from '../../utils/constants';

export default function AgentTraceTimeline({ steps = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || steps.length === 0) return;
    const cards = ref.current.querySelectorAll('.trace-step');
    gsap.fromTo(cards,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power3.out' }
    );
  }, [steps.length]);

  if (steps.length === 0) return null;

  return (
    <div ref={ref} className="trace-timeline">
      <h4 className="trace-timeline__title">Agent Trace</h4>
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
