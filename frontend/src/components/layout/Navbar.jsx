/** Navbar — minimal top navigation bar with trace drawer toggle and user profile. */
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ agentStepsCount = 0, isTraceOpen = false, onToggleTrace, fileSummaries = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeFileName = fileSummaries.length > 0
    ? fileSummaries.map((f) => f.filename || f.file_name || f.name).join(', ')
    : null;

  const displayName = user?.name || user?.email || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <button
        type="button"
        className="navbar__brand navbar__brand--clickable"
        onClick={() => navigate('/')}
        title="Go to Home"
      >
        <img src="/logo.png" alt="askQL" className="navbar__logo-img" />
      </button>


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

        {/* Logged in User Name Badge & Avatar (Top Right Corner) */}
        {user && (
          <div className="navbar__user-badge" title={`Logged in as ${displayName}`}>
            <span className="navbar__user-avatar">👤</span>
            <span className="navbar__user-name">{displayName}</span>
            <button
              type="button"
              className="btn-navbar-logout"
              onClick={handleLogout}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

