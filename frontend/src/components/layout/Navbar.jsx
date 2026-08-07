/** Navbar — minimal top navigation bar. */
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">◆</span>
        <span className="navbar__title">AI Data Analyst</span>
      </div>
      <div className="navbar__actions">
        <span className="navbar__version">v0.1.0</span>
      </div>
    </nav>
  );
}
