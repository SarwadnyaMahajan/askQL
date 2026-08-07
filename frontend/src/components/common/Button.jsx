/** Button component — primary, secondary, ghost variants with hover effects. */
import { useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || disabled) return;
    const el = ref.current;

    const onEnter = () => gsap.to(el, { scale: 1.02, duration: 0.2 });
    const onLeave = () => gsap.to(el, { scale: 1, duration: 0.2 });
    const onDown = () => gsap.to(el, { scale: 0.97, duration: 0.1 });
    const onUp = () => gsap.to(el, { scale: 1.02, duration: 0.1 });

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
    };
  }, [disabled]);

  return (
    <button
      ref={ref}
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {children}
    </button>
  );
}
