import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { gsap } from '../../animations/gsap-registry';
import Badge from '../common/Badge';
import { AGENT_ICONS } from '../../utils/constants';

import ChartRenderer from '../charts/ChartRenderer';

function CodeBlockItem({ block }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!block.code) return;
    navigator.clipboard.writeText(block.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="message__code">
      <div className="message__code-header">
        <span>{block.language?.toUpperCase() || 'SQL'}</span>
        <button
          type="button"
          className="message__code-copy-btn"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy Code'}
        </button>
      </div>
      <pre className="message__code-body">
        <code>{block.code}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({
  role,
  content,
  agentSteps = [],
  codeBlocks = [],
  charts = [],
  anomalies = [],
  forecasts = [],
  isStreaming = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }
    );
  }, []);

  if (role === 'user') {
    return (
      <div ref={ref} className="message message--user">
        <div className="message__bubble message__bubble--user">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div ref={ref} className="message message--assistant">
      <div className="message__bubble message__bubble--assistant">
        {/* Agent Steps Trace */}
        {agentSteps.length > 0 && (
          <div className="message__trace">
            {agentSteps.map((step, i) => (
              <div key={i} className="message__step">
                <span className="message__step-icon">
                  {AGENT_ICONS[step.agent] || '🔧'}
                </span>
                <span className="message__step-agent">{step.agent}</span>
                <span className="message__step-action">{step.action}</span>
                {step.duration_ms != null && (
                  <Badge variant="default">{step.duration_ms}ms</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Code Blocks */}
        {codeBlocks.map((block, i) => (
          <CodeBlockItem key={`code-${i}`} block={block} />
        ))}

        {/* Inline Charts (ChatGPT / Gemini style) */}
        {charts.length > 0 && (
          <div className="message__inline-charts">
            {charts.map((chartSpec, i) => (
              <div key={`inline-chart-${i}`} className="message__inline-chart-item">
                <ChartRenderer spec={chartSpec} />
              </div>
            ))}
          </div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="message__anomalies">
            <div className="message__anomalies-header">
              🔍 {anomalies.length} anomalies detected
            </div>
            {anomalies.slice(0, 5).map((a, i) => (
              <div key={i} className="message__anomaly-item">
                <Badge variant={a.severity === 'high' ? 'error' : 'warning'}>
                  {a.test_used}
                </Badge>
                <span>
                  Column <strong>{a.column}</strong>, Row {a.row_index}: {a.value}
                </span>
                {a.detective_note && (
                  <p className="message__anomaly-note">{a.detective_note}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Narration text rendered as Markdown */}
        {content && (
          <div className="message__content markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && <span className="message__cursor">▊</span>}
          </div>
        )}

        {!content && isStreaming && (
          <div className="message__thinking">
            <span className="message__thinking-dot" />
            <span className="message__thinking-dot" />
            <span className="message__thinking-dot" />
          </div>
        )}
      </div>
    </div>
  );
}
