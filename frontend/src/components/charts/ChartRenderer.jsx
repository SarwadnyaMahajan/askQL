/** ChartRenderer — Plotly.js wrapper with GSAP entrance, PNG download action, and de-cluttered layout. */
import { useRef, useEffect, useState } from 'react';
import { gsap } from '../../animations/gsap-registry';

export default function ChartRenderer({ spec }) {
  const containerRef = useRef(null);
  const plotContainerRef = useRef(null);
  const [PlotlyComponent, setPlotlyComponent] = useState(null);
  const [plotlyModule, setPlotlyModule] = useState(null);
  const [copied, setCopied] = useState(false);

  // Lazy-load Plotly (heavy library)
  useEffect(() => {
    import('react-plotly.js').then((mod) => {
      setPlotlyComponent(() => mod.default);
    });
    import('plotly.js-dist-min').then((mod) => {
      setPlotlyModule(mod.default || mod);
    });
  }, []);

  // GSAP entrance animation
  useEffect(() => {
    if (!containerRef.current || !PlotlyComponent) return;
    gsap.fromTo(containerRef.current,
      { scale: 0.96, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );
  }, [PlotlyComponent, spec]);

  const handleDownload = () => {
    if (!plotContainerRef.current) return;
    const gd = plotContainerRef.current.querySelector('.js-plotly-plot');
    if (gd && plotlyModule) {
      const chartTitle = spec?.layout?.title?.text || spec?.layout?.title || 'chart_export';
      plotlyModule.downloadImage(gd, {
        format: 'png',
        width: 1200,
        height: 700,
        filename: chartTitle.toString().toLowerCase().replace(/[^a-z0-9]/g, '_'),
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!spec || !spec.data) return null;

  const chartTitle = typeof spec.layout?.title === 'string'
    ? spec.layout.title
    : (spec.layout?.title?.text || 'Data Visualization');

  // De-cluttered layout setup
  const layout = {
    ...spec.layout,
    title: undefined, // Handled in clean header
    autosize: true,
    margin: { t: 20, r: 24, b: 50, l: 54 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#374151', size: 12 },
    legend: {
      orientation: 'h',
      y: -0.2,
      x: 0.5,
      xanchor: 'center',
    },
    xaxis: {
      ...spec.layout?.xaxis,
      gridcolor: 'rgba(0,0,0,0.04)',
      zerolinecolor: 'rgba(0,0,0,0.08)',
    },
    yaxis: {
      ...spec.layout?.yaxis,
      gridcolor: 'rgba(0,0,0,0.04)',
      zerolinecolor: 'rgba(0,0,0,0.08)',
    },
  };

  return (
    <div ref={containerRef} className="chart-renderer-card">
      <div className="chart-renderer-card__header">
        <div className="chart-renderer-card__title">
          <span className="chart-renderer-card__text">{chartTitle}</span>

        </div>
        <div className="chart-renderer-card__actions">
          <button
            type="button"
            className="chart-renderer-card__btn-download"
            onClick={handleDownload}
            title="Download Chart as PNG image"
          >
            <span>{copied ? '✓ Downloaded!' : '📥 Download PNG'}</span>
          </button>
        </div>
      </div>

      <div ref={plotContainerRef} className="chart-renderer-card__body">
        {PlotlyComponent ? (
          <PlotlyComponent
            data={spec.data}
            layout={layout}
            config={{
              responsive: true,
              displayModeBar: false, // Clean de-cluttered view without default modebar noise
            }}
            style={{ width: '100%', height: '340px' }}
          />
        ) : (
          <div className="chart-renderer__loading">
            <span className="chart-loading-spinner" />
            <span>Rendering visualization...</span>
          </div>
        )}
      </div>
    </div>
  );
}
