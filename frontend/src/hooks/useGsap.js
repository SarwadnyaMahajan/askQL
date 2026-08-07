/** Custom hook for GSAP animations with auto-cleanup. */
import { useRef, useEffect, useCallback } from 'react';
import { gsap } from '../animations/gsap-registry';

/**
 * useGsap — run a GSAP animation callback on mount with automatic cleanup.
 *
 * @param {function} animationFn - Receives (gsap, element) and should return a tween/timeline or void.
 * @param {Array} deps - Effect dependency array (default: []).
 * @returns {{ ref: React.Ref, timeline: function }}
 */
export function useGsap(animationFn, deps = []) {
  const ref = useRef(null);
  const tweenRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const result = animationFn(gsap, ref.current);
      if (result) tweenRef.current = result;
    }, ref.current);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const timeline = useCallback(
    (vars = {}) => gsap.timeline({ defaults: { ease: 'power3.out' }, ...vars }),
    []
  );

  return { ref, timeline };
}

export default useGsap;
