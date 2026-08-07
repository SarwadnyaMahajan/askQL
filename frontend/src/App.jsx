/** Root App component with client-side routing. */
import { useState } from 'react';
import Landing from './pages/Landing';
import Workspace from './pages/Workspace';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'workspace'

  if (view === 'workspace') {
    return <Workspace />;
  }

  return <Landing onGetStarted={() => setView('workspace')} />;
}
