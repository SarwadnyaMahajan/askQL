/** Workspace page — split layout: sidebar + main (chat + dashboard). */
import { useState, useCallback, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Dropzone from '../components/upload/Dropzone';
import ChatPanel from '../components/chat/ChatPanel';
import AutoDashboard from '../components/dashboard/AutoDashboard';
import ChartRenderer from '../components/charts/ChartRenderer';
import AgentTraceTimeline from '../components/trace/AgentTraceTimeline';
import Toast from '../components/common/Toast';
import useSSE from '../hooks/useSSE';
import { uploadFiles } from '../utils/api';
import { SSE_EVENTS } from '../utils/constants';

export default function Workspace() {
  const [sessionId, setSessionId] = useState(null);
  const [fileSummaries, setFileSummaries] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // Array of { role, content, events }
  const { send, events, isStreaming, error, reset } = useSSE();

  const [isTraceOpen, setIsTraceOpen] = useState(false);

  // Current chart spec from latest response
  const latestChart = events.find((e) => e.event === SSE_EVENTS.CHART)?.data || null;
  // Current agent steps from latest response
  const latestSteps = events
    .filter((e) => e.event === SSE_EVENTS.AGENT_STEP)
    .map((e) => e.data);

  const handleFilesSelected = useCallback(async (files) => {
    setIsUploading(true);
    try {
      const result = await uploadFiles(files, sessionId);
      setSessionId(result.session_id);
      setFileSummaries((prev) => [...prev, ...result.files]);
      setToast({
        message: `${result.files.length} file(s) uploaded successfully!`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }, [sessionId]);

  // Load stored chat history when session changes
  useEffect(() => {
    if (sessionId) {
      try {
        const stored = sessionStorage.getItem(`chat_history_${sessionId}`);
        if (stored) {
          setChatHistory(JSON.parse(stored));
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
        <Sidebar fileSummaries={fileSummaries} />

        <main className="workspace__main">
          {/* Upload zone - always visible at top if no data yet, compact if data exists */}
          <div className={`workspace__upload ${hasData ? 'workspace__upload--compact' : ''}`}>
            <Dropzone onFilesSelected={handleFilesSelected} disabled={isUploading} />
          </div>

          {/* Dashboard - appears after upload */}
          {hasData && <AutoDashboard fileSummaries={fileSummaries} />}

          {/* Chart - appears when chat produces one */}
          {latestChart && (
            <div className="workspace__chart">
              <ChartRenderer spec={latestChart} />
            </div>
          )}

          {/* Chat section */}
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
