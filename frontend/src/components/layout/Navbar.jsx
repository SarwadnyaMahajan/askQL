/** Navbar — minimal top navigation bar with trace drawer toggle. */

export default function Navbar({ agentStepsCount = 0, isTraceOpen = false, onToggleTrace }) {
  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">◆</span>
        <span className="navbar__title">AI Data Analyst</span>
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
