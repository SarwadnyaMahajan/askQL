/**
 * GradientBlurBg — Dual-gradient animated grid background overlay.
 *
 * Adapted from the shadcn/Tailwind component spec into plain React + CSS.
 * Renders two soft radial blobs (purple + blue) over a subtle grid, creating
 * a premium depth effect for the landing page hero section.
 *
 * Usage: Place as the first child of any relative-positioned container.
 */
export default function GradientBlurBg({ variant = 'hero' }) {
  const configs = {
    hero: {
      // Purple lower-left + Blue upper-right — mirrors the demo.tsx component
      gridColor: 'rgba(209,213,219,0.45)',
      gridSize: '48px 48px',
      blobs: [
        { cx: '8%',  cy: '85%', size: '600px', color: 'rgba(139,92,246,0.22)'  }, // purple, bottom-left
        { cx: '88%', cy: '12%', size: '500px', color: 'rgba(59,130,246,0.18)'  }, // blue,   top-right
        { cx: '50%', cy: '50%', size: '900px', color: 'rgba(99,102,241,0.06)'  }, // soft centre tint
      ],
    },
    section: {
      gridColor: 'rgba(209,213,219,0.25)',
      gridSize: '96px 64px',
      blobs: [
        { cx: '100%', cy: '0%',  size: '800px', color: 'rgba(213,197,255,0.2)' },
      ],
    },
  };

  const cfg = configs[variant] ?? configs.hero;

  const blobGradients = cfg.blobs
    .map(b => `radial-gradient(circle ${b.size} at ${b.cx} ${b.cy}, ${b.color}, transparent)`)
    .join(', ');

  const backgroundImage = [
    `linear-gradient(to right, ${cfg.gridColor} 1px, transparent 1px)`,
    `linear-gradient(to bottom, ${cfg.gridColor} 1px, transparent 1px)`,
    blobGradients,
  ].join(', ');

  const backgroundSize = [
    cfg.gridSize,
    cfg.gridSize,
    ...cfg.blobs.map(() => '100% 100%'),
  ].join(', ');

  return (
    <div
      className="gradient-blur-bg"
      aria-hidden="true"
      style={{ backgroundImage, backgroundSize }}
    />
  );
}
