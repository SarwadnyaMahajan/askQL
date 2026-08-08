/** Workspace page — ChatGPT / Gemini style full-page conversational layout. */
import { useState, useCallback, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ChatPanel from '../components/chat/ChatPanel';
import AutoDashboard from '../components/dashboard/AutoDashboard';
import AgentTraceTimeline from '../components/trace/AgentTraceTimeline';
import Toast from '../components/common/Toast';
import useSSE from '../hooks/useSSE';
import { uploadFiles } from '../utils/api';
import { SSE_EVENTS } from '../utils/constants';

function buildDataOverviewMessage(files) {
  if (!files || files.length === 0) return '';
  const file = files[0];
  const filename = file.filename || file.name || 'Dataset';
  const rowCount = file.row_count || file.rows || 'N/A';
  const colCount = file.column_count || (file.columns ? file.columns.length : 'N/A');

  let markdown = `### 📊 Dataset Overview: **${filename}**\n\n`;
  markdown += `Dataset loaded into DuckDB session! Here is the statistical structure:\n\n`;
  markdown += `- **Total Rows**: \`${typeof rowCount === 'number' ? rowCount.toLocaleString() : rowCount}\`\n`;
  markdown += `- **Total Columns**: \`${colCount}\`\n\n`;

  if (file.columns && Array.isArray(file.columns)) {
    markdown += `#### 📋 Column Schema:\n`;
    file.columns.slice(0, 10).forEach((col) => {
      const colName = typeof col === 'string' ? col : col.name || col.column;
      const dtype = typeof col === 'object' ? col.dtype || col.type || 'text' : 'text';
      const samples = col.sample_values && col.sample_values.length > 0
        ? ` — samples: \`${col.sample_values.slice(0, 3).join(', ')}\``
        : '';
      markdown += `- \`${colName}\` (*${dtype.toUpperCase()}*)${samples}\n`;
    });
    if (file.columns.length > 10) {
      markdown += `\n*... and ${file.columns.length - 10} more columns.*\n`;
    }
  }

  markdown += `\n---\n**💡 Suggested Questions to Ask:**\n`;
  markdown += `- *"What is total summary metric for this dataset?"*\n`;
  markdown += `- *"Show top 5 items by numerical value"* (toggle 📊 **Chart: ON** for visual graph)\n`;
  markdown += `- *"Find anomalies or outliers in key columns"*\n`;

  return markdown;
}

export default function Workspace() {
  const [sessionId, setSessionId] = useState(null);
  const [fileSummaries, setFileSummaries] = useState([]);
  const [allSessions, setAllSessions] = useState(() => {
    try {
      const stored = sessionStorage.getItem('all_user_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // Array of { role, content, events }
  const { send, events, isStreaming, error, reset } = useSSE();

  const [isTraceOpen, setIsTraceOpen] = useState(false);

  // Current agent steps from latest response
  const latestSteps = events
    .filter((e) => e.event === SSE_EVENTS.AGENT_STEP)
    .map((e) => e.data);

  const handleFilesSelected = useCallback(async (files) => {
    setIsUploading(true);
    try {
      // Pass null so each new CSV upload gets its own isolated session_id
      const result = await uploadFiles(files, null);
      
      // Explicitly attach session_id and normalized filename to each file summary
      const filesWithSession = result.files.map((f) => ({
        ...f,
        session_id: result.session_id,
        filename: f.file_name || f.filename || 'Dataset.csv',
      }));

      setSessionId(result.session_id);
      setFileSummaries(filesWithSession);

      // Prepend to allSessions list for left sidebar (newest stacked on top!)
      setAllSessions((prev) => {
        const filteredPrev = prev.filter((item) => item.session_id !== result.session_id);
        const updated = [...filesWithSession, ...filteredPrev];
        try {
          sessionStorage.setItem('all_user_sessions', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
        return updated;
      });

      // Generate Data Overview Welcome Message with inline StatCard tiles
      const overviewText = buildDataOverviewMessage(filesWithSession);
      const initialHistory = [{ role: 'assistant', content: overviewText, fileSummaries: filesWithSession }];
      setChatHistory(initialHistory);

      try {
        sessionStorage.setItem(`chat_history_${result.session_id}`, JSON.stringify(initialHistory));
        sessionStorage.setItem(`files_${result.session_id}`, JSON.stringify(filesWithSession));
      } catch (e) {
        // ignore
      }

      setToast({
        message: `${filesWithSession.length} dataset(s) loaded into active workspace!`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Handle switching dataset session from left sidebar
  const handleSelectSession = useCallback((file) => {
    if (!file || !file.session_id) return;
    const targetSessionId = file.session_id;

    // Reset SSE stream state
    reset();

    setSessionId(targetSessionId);
    setFileSummaries([file]);

    try {
      const storedHistory = sessionStorage.getItem(`chat_history_${targetSessionId}`);
      if (storedHistory) {
        setChatHistory(JSON.parse(storedHistory));
      } else {
        const overviewText = buildDataOverviewMessage([file]);
        const initialHistory = [{ role: 'assistant', content: overviewText, fileSummaries: [file] }];
        setChatHistory(initialHistory);
        sessionStorage.setItem(`chat_history_${targetSessionId}`, JSON.stringify(initialHistory));
      }
    } catch (e) {
      // ignore
    }
  }, [reset]);

  // Load stored chat history when session changes
  useEffect(() => {
    if (sessionId) {
      try {
        const stored = sessionStorage.getItem(`chat_history_${sessionId}`);
        if (stored) {
          setChatHistory(JSON.parse(stored));
        } else if (fileSummaries.length > 0) {
          const overviewText = buildDataOverviewMessage(fileSummaries);
          setChatHistory([{ role: 'assistant', content: overviewText, fileSummaries: fileSummaries }]);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [sessionId]);

  // Commit completed response to chat history when streaming completes
  useEffect(() => {
    if (!isStreaming && events.length > 0) {
      const narration = events
        .filter((e) => e.event === SSE_EVENTS.TOKEN)
        .map((e) => e.data.content)
        .join('');
      const agentSteps = events.filter((e) => e.event === SSE_EVENTS.AGENT_STEP).map((e) => e.data);
      const codeBlocks = events.filter((e) => e.event === SSE_EVENTS.CODE).map((e) => e.data);
      const charts = events.filter((e) => e.event === SSE_EVENTS.CHART).map((e) => e.data);
      const anomalies = events.filter((e) => e.event === SSE_EVENTS.ANOMALY).map((e) => e.data);
      const forecasts = events.filter((e) => e.event === SSE_EVENTS.FORECAST).map((e) => e.data);

      if (narration || agentSteps.length > 0 || codeBlocks.length > 0) {
        setChatHistory((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === narration) {
            return prev;
          }
          const updated = [
            ...prev,
            {
              role: 'assistant',
              content: narration,
              agentSteps,
              codeBlocks,
              charts,
              anomalies,
              forecasts,
            },
          ];
          if (sessionId) {
            try {
              sessionStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(updated));
            } catch (e) {
              // ignore
            }
          }
          return updated;
        });
      }
    }
  }, [isStreaming, events, sessionId]);

  const handleSend = useCallback((message, generateChart = false) => {
    if (!sessionId) return;

    // Reset SSE state
    reset();

    // Add user message to history
    setChatHistory((prev) => {
      const updated = [...prev, { role: 'user', content: message }];
      if (sessionId) {
        try {
          sessionStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }
      return updated;
    });

    send(sessionId, message, generateChart);
  }, [sessionId, send, reset]);

  const hasData = fileSummaries.length > 0;

  return (
    <div className="workspace">
      <Navbar
        agentStepsCount={latestSteps.length}
        isTraceOpen={isTraceOpen}
        onToggleTrace={() => setIsTraceOpen(!isTraceOpen)}
        fileSummaries={fileSummaries}
      />
      <div className="workspace__body">
        <Sidebar
          fileSummaries={allSessions}
          activeSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
        />

        <main className="workspace__main">
          {/* Full-Page ChatGPT / Gemini Chat Section */}
          <div className="workspace__chat">
            <ChatPanel
              history={chatHistory}
              events={events}
              isStreaming={isStreaming}
              error={error}
              onSend={handleSend}
              disabled={!hasData}
            />
          </div>
        </main>

        {/* Sliding Right Drawer for Agent Trace */}
        {latestSteps.length > 0 && (
          <aside className={`workspace__right-rail ${isTraceOpen ? 'workspace__right-rail--open' : 'workspace__right-rail--closed'}`}>
            <AgentTraceTimeline steps={latestSteps} onClose={() => setIsTraceOpen(false)} />
          </aside>
        )}

        {/* Floating edge handle when drawer is slid out / closed */}
        {latestSteps.length > 0 && !isTraceOpen && (
          <button
            type="button"
            className="floating-trace-handle"
            onClick={() => setIsTraceOpen(true)}
            title="Open Agent Trace Window (Slide left)"
          >
            <span>⚡ Trace ({latestSteps.length})</span>
            <span>⬅️</span>
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
