/** FileCard — uploaded file info with fly-in animation. */
import { useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';
import Badge from '../common/Badge';

export default function FileCard({ file, index = 0, isActive = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, delay: index * 0.08, ease: 'power3.out' }
    );
  }, [index]);

  return (
    <div ref={ref} className={`file-card ${isActive ? 'file-card--active' : ''}`}>
      <div className="file-card__icon">📄</div>
      <div className="file-card__info">
        <span className="file-card__name">{file.filename || file.file_name || file.name || 'Dataset'}</span>
        <span className="file-card__meta">
          {file.row_count ? `${file.row_count.toLocaleString()} rows` : ''}
          {file.column_count ? ` · ${file.column_count} cols` : ''}
        </span>
      </div>
      <div className="file-card__arrow">
        <span>➔</span>
      </div>
    </div>
  );
}
