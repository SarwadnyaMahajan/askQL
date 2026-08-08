/** Navbar — minimal top navigation bar with trace drawer toggle. */

export default function Navbar({ agentStepsCount = 0, isTraceOpen = false, onToggleTrace, fileSummaries = [] }) {
  const activeFileName = fileSummaries.length > 0
    ? fileSummaries.map((f) => f.filename || f.name).join(', ')
    : null;

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">◆</span>
        <span className="navbar__title">AI Data Analyst</span>
      </div>

      <div className="navbar__middle">
        {activeFileName ? (
          <div className="navbar__file-badge" title={`Active Dataset: ${activeFileName}`}>
            <span className="navbar__file-icon">📄</span>
            <span className="navbar__file-name">{activeFileName}</span>
          </div>
        ) : (
          <div className="navbar__file-badge navbar__file-badge--empty">
            <span className="navbar__file-icon">📁</span>
            <span className="navbar__file-name">No Dataset Loaded</span>
          </div>
        )}
      </div>

      <div className="navbar__actions">
        {agentStepsCount > 0 && (
          <button
            type="button"
            className={`btn-trace-drawer-toggle ${isTraceOpen ? 'btn-trace-drawer-toggle--active' : ''}`}
            onClick={onToggleTrace}
            title={isTraceOpen ? 'Slide out / Hide Agent Trace' : 'Open / Show Agent Trace'}
          >
            <span>⚡ Agent Trace</span>
            <span className="btn-trace-count">{agentStepsCount}</span>
            <span>{isTraceOpen ? '➡️' : '⬅️'}</span>
          </button>
        )}
        <span className="navbar__version">v0.1.0</span>
      </div>
    </nav>
  );
}
