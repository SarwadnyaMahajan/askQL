/** Toast notification — slide-in from top-right, auto-dismiss. */
import { useEffect, useRef } from 'react';
import { gsap } from '../../animations/gsap-registry';

export default function Toast({ message, type = 'info', onDismiss, duration = 4000 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    gsap.fromTo(el,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );

    const timer = setTimeout(() => {
      gsap.to(el, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        onComplete: onDismiss,
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

  return (
    <div ref={ref} className={`toast toast--${type}`}>
      <span className="toast__icon">{icons[type] || icons.info}</span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onDismiss}>×</button>
    </div>
  );
}
