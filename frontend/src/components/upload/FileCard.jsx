/** FileCard — uploaded file info with fly-in animation. */
import { useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';
import Badge from '../common/Badge';

export default function FileCard({ file, index = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, delay: index * 0.1, ease: 'power3.out' }
    );
  }, [index]);

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div ref={ref} className="file-card">
      <div className="file-card__icon">📊</div>
      <div className="file-card__info">
        <span className="file-card__name">{file.file_name || file.name}</span>
        <span className="file-card__meta">
          {file.row_count ? `${file.row_count.toLocaleString()} rows` : ''}
          {file.column_count ? ` · ${file.column_count} cols` : ''}
        </span>
      </div>
      <div className="file-card__badges">
        {file.total_null_pct > 0 && (
          <Badge variant={file.total_null_pct > 5 ? 'warning' : 'default'}>
            {file.total_null_pct.toFixed(1)}% nulls
          </Badge>
        )}
        {file.duplicate_row_pct > 0 && (
          <Badge variant="warning">
            {file.duplicate_row_pct.toFixed(1)}% dups
          </Badge>
        )}
      </div>
    </div>
  );
}
