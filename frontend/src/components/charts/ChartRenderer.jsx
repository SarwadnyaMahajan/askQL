/** ChartRenderer — Plotly.js wrapper with GSAP entrance animation. */
import { useRef, useEffect, useState } from 'react';
import { gsap } from '../../animations/gsap-registry';

export default function ChartRenderer({ spec }) {
  const containerRef = useRef(null);
  const plotRef = useRef(null);
  const [PlotlyComponent, setPlotlyComponent] = useState(null);

  // Lazy-load Plotly (it's heavy)
  useEffect(() => {
    import('react-plotly.js').then((mod) => {
      setPlotlyComponent(() => mod.default);
    });
  }, []);

  // GSAP entrance
  useEffect(() => {
    if (!containerRef.current || !PlotlyComponent) return;
    gsap.fromTo(containerRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, [PlotlyComponent, spec]);

  if (!spec || !spec.data) return null;

  const layout = {
    ...spec.layout,
    autosize: true,
    margin: { t: 40, r: 20, b: 40, l: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: "'Inter', sans-serif", color: '#111827' },
  };

  return (
    <div ref={containerRef} className="chart-renderer">
      {PlotlyComponent ? (
        <PlotlyComponent
          data={spec.data}
          layout={layout}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '320px' }}
        />
      ) : (
        <div className="chart-renderer__loading">Loading chart...</div>
      )}
    </div>
  );
}
