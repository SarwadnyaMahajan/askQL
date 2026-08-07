/** Workspace page — split layout: sidebar + main (chat + dashboard). */
import { useState, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Dropzone from '../components/upload/Dropzone';
import ChatPanel from '../components/chat/ChatPanel';
import AutoDashboard from '../components/dashboard/AutoDashboard';
import ChartRenderer from '../components/charts/ChartRenderer';
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

  const handleSend = useCallback((message) => {
    if (!sessionId) return;

    // Save previous response to history
    if (events.length > 0) {
      const narration = events
        .filter((e) => e.event === SSE_EVENTS.TOKEN)
        .map((e) => e.data.content)
        .join('');
      if (narration) {
        setChatHistory((prev) => [...prev, {
          role: 'assistant',
          content: narration,
          agentSteps: events.filter((e) => e.event === SSE_EVENTS.AGENT_STEP).map((e) => e.data),
          codeBlocks: events.filter((e) => e.event === SSE_EVENTS.CODE).map((e) => e.data),
        }]);
      }
    }

    // Add user message to history
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);

    // Reset and send new query
    reset();
    send(sessionId, message);
  }, [sessionId, events, send, reset]);

  const hasData = fileSummaries.length > 0;

  return (
    <div className="workspace">
      <Navbar />
      <div className="workspace__body">
        <Sidebar fileSummaries={fileSummaries} agentSteps={latestSteps} />

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
            {/* Previous messages */}
            <div className="workspace__history">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`message message--${msg.role}`}>
                  <div className={`message__bubble message__bubble--${msg.role}`}>
                    {msg.role === 'assistant' && msg.agentSteps?.length > 0 && (
                      <div className="message__trace">
                        {msg.agentSteps.map((step, j) => (
                          <div key={j} className="message__step">
                            <span className="message__step-agent">{step.agent}</span>
                            <span className="message__step-action">{step.action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <ChatPanel
              events={events}
              isStreaming={isStreaming}
              error={error}
              onSend={handleSend}
              disabled={!hasData}
            />
          </div>
        </main>
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
