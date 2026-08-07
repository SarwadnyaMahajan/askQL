/** ChatPanel — message list, input bar, SSE streaming. */
import { useState, useRef, useEffect } from 'react';
import { gsap } from '../../animations/gsap-registry';
import MessageBubble from './MessageBubble';
import Button from '../common/Button';
import { SSE_EVENTS } from '../../utils/constants';

export default function ChatPanel({ events, isStreaming, error, onSend, disabled }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Derive messages from SSE events
  const messages = [];
  let currentAssistant = null;

  // Group events into messages
  const userMessages = [];
  const assistantBlocks = [];

  // We track sent messages via parent, so rebuild from events
  // events flow: agent_step*, code?, chart?, anomaly*, forecast?, token, done

  // Build assistant message from events
  const agentSteps = events.filter((e) => e.event === SSE_EVENTS.AGENT_STEP);
  const codeBlocks = events.filter((e) => e.event === SSE_EVENTS.CODE);
  const charts = events.filter((e) => e.event === SSE_EVENTS.CHART);
  const anomalies = events.filter((e) => e.event === SSE_EVENTS.ANOMALY);
  const forecasts = events.filter((e) => e.event === SSE_EVENTS.FORECAST);
  const tokens = events.filter((e) => e.event === SSE_EVENTS.TOKEN);
  const narration = tokens.map((t) => t.data.content).join('');

  // Scroll to bottom on new events
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length, narration]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
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
        {/* Show assistant response if we have events */}
        {events.length > 0 && (
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

      <form className="chat-panel__input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-panel__input"
          placeholder={disabled ? 'Upload a CSV first...' : 'Ask a question about your data...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
          id="chat-input"
        />
        <Button
          variant="primary"
          size="md"
          disabled={disabled || isStreaming || !input.trim()}
          loading={isStreaming}
          onClick={handleSubmit}
        >
          {isStreaming ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
