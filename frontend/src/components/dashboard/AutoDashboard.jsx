/** AutoDashboard — stat card grid showing data quality summary. */
import StatCard from './StatCard';

export default function AutoDashboard({ fileSummaries = [] }) {
  if (!fileSummaries.length) return null;

  // Aggregate stats across all files
  const totalRows = fileSummaries.reduce((s, f) => s + (f.row_count || 0), 0);
  const totalCols = fileSummaries.reduce((s, f) => s + (f.column_count || 0), 0);
  const totalNullPct = fileSummaries.length > 0
    ? fileSummaries.reduce((s, f) => s + (f.total_null_pct || 0), 0) / fileSummaries.length
    : 0;
  const totalDupPct = fileSummaries.length > 0
    ? fileSummaries.reduce((s, f) => s + (f.duplicate_row_pct || 0), 0) / fileSummaries.length
    : 0;

  return (
    <div className="auto-dashboard">
      <h3 className="auto-dashboard__title">Data Overview</h3>
      <div className="auto-dashboard__grid">
        <StatCard label="Total Rows" value={totalRows} icon="📋" index={0} />
        <StatCard label="Columns" value={totalCols} icon="📐" index={1} />
        <StatCard
          label="Null Rate"
          value={totalNullPct}
          suffix="%"
          icon="⚡"
          variant={totalNullPct > 5 ? 'warning' : 'success'}
          index={2}
        />
        <StatCard
          label="Duplicates"
          value={totalDupPct}
          suffix="%"
          icon="🔄"
          variant={totalDupPct > 5 ? 'warning' : 'success'}
          index={3}
        />
        <StatCard label="Files" value={fileSummaries.length} icon="📁" index={4} />
      </div>

      {/* Column details */}
      {fileSummaries.map((file, fi) => (
        <div key={fi} className="auto-dashboard__columns">
          <h4>{file.file_name}</h4>
          <div className="auto-dashboard__col-grid">
            {file.columns?.map((col, ci) => (
              <div key={ci} className="auto-dashboard__col-card">
                <span className="auto-dashboard__col-name">{col.name}</span>
                <span className="auto-dashboard__col-type">{col.dtype}</span>
                <div className="auto-dashboard__col-stats">
                  <span>{col.unique_count} unique</span>
                  {col.null_pct > 0 && <span className="text-warning">{col.null_pct}% null</span>}
                  {col.mean != null && <span>μ={col.mean.toFixed(1)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
