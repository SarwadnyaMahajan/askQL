/** Workspace page — ChatGPT / Gemini style full-page conversational layout. */
import { useState, useCallback, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ChatPanel from '../components/chat/ChatPanel';
import AgentTraceTimeline from '../components/trace/AgentTraceTimeline';
import Toast from '../components/common/Toast';
import useSSE from '../hooks/useSSE';
import { useAuth } from '../hooks/useAuth';
import { uploadFiles, fetchUserSessions, fetchSessionHistory } from '../utils/api';
import { SSE_EVENTS } from '../utils/constants';

function buildDataOverviewMessage(files) {
  if (!files || files.length === 0) return '';
  const file = files[0];
  const filename = file.filename || file.file_name || file.name || 'Dataset';
  const rowCount = file.row_count || file.rows || 'N/A';
  const colCount = file.column_count || (file.columns ? file.columns.length : 'N/A');

  let markdown = `### Dataset Overview: **${filename}**\n\n`;

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
  markdown += `- *"Show top 5 items by numerical value"* (toggle **Chart: ON** for visual graph)\n`;

  markdown += `- *"Find anomalies or outliers in key columns"*\n`;

  return markdown;
}

export default function Workspace() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [fileSummaries, setFileSummaries] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const { send, events, isStreaming, error, reset } = useSSE();
  const [isTraceOpen, setIsTraceOpen] = useState(false);

  // Latest agent steps for trace timeline
  const latestSteps = events
    .filter((e) => e.event === SSE_EVENTS.AGENT_STEP)
    .map((e) => e.data);

  // Load history from DB for target session
  const loadHistoryForSession = useCallback(async (targetSessionId, filesForSession) => {
    try {
      const res = await fetchSessionHistory(targetSessionId);
      if (res.history && res.history.length > 0) {
        setChatHistory(res.history);
      } else {
        const overview = buildDataOverviewMessage(filesForSession);
        setChatHistory([{ role: 'assistant', content: overview, fileSummaries: filesForSession }]);
      }
    } catch (err) {
      const overview = buildDataOverviewMessage(filesForSession);
      setChatHistory([{ role: 'assistant', content: overview, fileSummaries: filesForSession }]);
    }
  }, []);

  // Load account-specific sessions when user changes or mounts
  const loadSessions = useCallback(async () => {
    if (!user) {
      setAllSessions([]);
      setSessionId(null);
      setFileSummaries([]);
      setChatHistory([]);
      return;
    }
    try {
      const userSessions = await fetchUserSessions();
      const datasetItems = userSessions.map((sess) => ({
        session_id: sess.session_id,
        created_at: sess.created_at,
        filename: sess.files[0]?.filename || sess.files[0]?.file_name || 'Dataset.csv',
        row_count: sess.files[0]?.row_count,
        column_count: sess.files[0]?.column_count,
        files: sess.files,
      }));
      setAllSessions(datasetItems);

      if (datasetItems.length > 0) {
        const first = datasetItems[0];
        setSessionId(first.session_id);
        setFileSummaries(first.files);
        loadHistoryForSession(first.session_id, first.files);
      } else {
        setSessionId(null);
        setFileSummaries([]);
        setChatHistory([]);
      }
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    }
  }, [user, loadHistoryForSession]);

  useEffect(() => {
    loadSessions();
  }, [user, loadSessions]);

  const handleFilesSelected = useCallback(async (files) => {
    setIsUploading(true);
    try {
      const result = await uploadFiles(files, null);
      const filesWithSession = result.files.map((f) => ({
        ...f,
        session_id: result.session_id,
        filename: f.file_name || f.filename || 'Dataset.csv',
      }));

      setSessionId(result.session_id);
      setFileSummaries(filesWithSession);

      const newItem = {
        session_id: result.session_id,
        filename: filesWithSession[0]?.filename || 'Dataset.csv',
        row_count: filesWithSession[0]?.row_count,
        column_count: filesWithSession[0]?.column_count,
        files: filesWithSession,
      };

      setAllSessions((prev) => [newItem, ...prev.filter((s) => s.session_id !== result.session_id)]);

      const overviewText = buildDataOverviewMessage(filesWithSession);
      setChatHistory([{ role: 'assistant', content: overviewText, fileSummaries: filesWithSession }]);

      setToast({
        message: `${filesWithSession.length} dataset(s) uploaded and saved to your account!`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSelectSession = useCallback((sessionItem) => {
    if (!sessionItem || !sessionItem.session_id) return;
    const targetSessionId = sessionItem.session_id;

    reset();
    setSessionId(targetSessionId);
    setFileSummaries(sessionItem.files || [sessionItem]);
    loadHistoryForSession(targetSessionId, sessionItem.files || [sessionItem]);
  }, [reset, loadHistoryForSession]);

  // Commit streaming completion turn to chat history
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
          return [
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
        });
      }
    }
  }, [isStreaming, events]);

  const handleSend = useCallback((message, generateChart = false) => {
    if (!sessionId) return;
    reset();
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
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

        {latestSteps.length > 0 && (
          <aside className={`workspace__right-rail ${isTraceOpen ? 'workspace__right-rail--open' : 'workspace__right-rail--closed'}`}>
            <AgentTraceTimeline steps={latestSteps} onClose={() => setIsTraceOpen(false)} />
          </aside>
        )}

        {latestSteps.length > 0 && !isTraceOpen && (
          <button
            type="button"
            className="floating-trace-handle"
            onClick={() => setIsTraceOpen(true)}
            title="Open Agent Trace Window"
          >
            <span>⚡ Trace ({latestSteps.length})</span>
            <span>⬅️</span>
          </button>
        )}
      </div>

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
