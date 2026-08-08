/** StatCard — individual stat with count-up animation. */
import { useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';

export default function StatCard({ label, value, suffix = '', icon, variant = 'default', index = 0 }) {
  const ref = useRef(null);
  const valueRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { scale: 0.9, opacity: 0, y: 12 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, delay: index * 0.08, ease: 'power3.out' }
    );
  }, [index]);

  useEffect(() => {
    if (!valueRef.current || typeof value !== 'number') return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.2,
      delay: index * 0.08 + 0.2,
      ease: 'power2.out',
      snap: { val: value >= 100 ? 1 : 0.1 },
      onUpdate: () => {
        if (valueRef.current) {
          valueRef.current.textContent =
            value >= 1000
              ? obj.val.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : value >= 10
              ? obj.val.toFixed(0)
              : obj.val.toFixed(1);
        }
      },
    });
  }, [value, index]);

  return (
    <div ref={ref} className="stat-card">
      <div className="stat-card__header">
        {icon && <div className="stat-card__icon-badge">{icon}</div>}
        <span className="stat-card__label">{label}</span>
      </div>
      <div className="stat-card__body">
        <span ref={valueRef} className="stat-card__value">
          {typeof value === 'number' ? '0' : value}
        </span>
        {suffix && <span className="stat-card__suffix">{suffix}</span>}
      </div>
    </div>
  );
}
