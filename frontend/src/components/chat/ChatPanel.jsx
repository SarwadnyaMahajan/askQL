/** ChatPanel — message list, input bar, SSE streaming. */
import { useState, useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';
import MessageBubble from './MessageBubble';
import Button from '../common/Button';
import { SSE_EVENTS } from '../../utils/constants';

export default function ChatPanel({ history = [], events = [], isStreaming, error, onSend, disabled }) {
  const [input, setInput] = useState('');
  const [generateChart, setGenerateChart] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Build active assistant streaming message from current events
  const agentSteps = events.filter((e) => e.event === SSE_EVENTS.AGENT_STEP);
  const codeBlocks = events.filter((e) => e.event === SSE_EVENTS.CODE);
  const charts = events.filter((e) => e.event === SSE_EVENTS.CHART);
  const anomalies = events.filter((e) => e.event === SSE_EVENTS.ANOMALY);
  const forecasts = events.filter((e) => e.event === SSE_EVENTS.FORECAST);
  const tokens = events.filter((e) => e.event === SSE_EVENTS.TOKEN);
  const narration = tokens.map((t) => t.data.content).join('');

  // Scroll to bottom on new events or history update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length, events.length, narration]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed, generateChart);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__messages">
        {/* Render all preserved historical messages */}
        {history.map((msg, idx) => (
          <MessageBubble
            key={idx}
            role={msg.role}
            content={msg.content}
            agentSteps={msg.agentSteps || []}
            codeBlocks={msg.codeBlocks || []}
            charts={msg.charts || []}
            anomalies={msg.anomalies || []}
            forecasts={msg.forecasts || []}
            fileSummaries={msg.fileSummaries || []}
          />
        ))}

        {/* Show active assistant response stream only while streaming */}
        {isStreaming && events.length > 0 && (
          <MessageBubble
            role="assistant"
            content={narration}
            agentSteps={agentSteps.map((e) => e.data)}
            codeBlocks={codeBlocks.map((e) => e.data)}
            charts={charts.map((e) => e.data)}
            anomalies={anomalies.map((e) => e.data)}
            forecasts={forecasts.map((e) => e.data)}
            isStreaming={isStreaming}
          />
        )}
        {error && (
          <div className="chat-panel__error">
            <span>⚠️</span> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-panel__footer">
        <form className="chat-panel__input-capsule" onSubmit={handleSubmit}>
          {/* Toggle Button for Chart Generation (token saver) */}
          <button
            type="button"
            className={`btn-chart-toggle ${generateChart ? 'btn-chart-toggle--active' : ''}`}
            onClick={() => setGenerateChart(!generateChart)}
            title={generateChart ? 'Chart generation enabled' : 'Chart generation disabled (saves tokens)'}
            disabled={disabled || isStreaming}
          >
            <span>📊</span>
            <span>{generateChart ? 'Chart: ON' : 'Chart: OFF'}</span>
          </button>

          <input
            ref={inputRef}
            type="text"
            className="chat-panel__input"
            placeholder={disabled ? 'Upload a CSV dataset to start chatting...' : 'Ask anything about your data...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isStreaming}
            id="chat-input"
          />

          <button
            type="submit"
            className="chat-panel__btn-send"
            disabled={disabled || isStreaming || !input.trim()}
            title="Send Message"
          >
            {isStreaming ? (
              <span className="chat-send-spinner" />
            ) : (
              <span className="chat-send-icon">↑</span>
            )}
          </button>
        </form>
        <div className="chat-panel__footer-disclaimer">
          AI Data Analyst can make mistakes. Verify important financial or analytical data.
        </div>
      </div>
    </div>
  );
}
