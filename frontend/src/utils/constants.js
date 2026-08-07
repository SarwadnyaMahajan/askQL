/** API constants */
export const API_BASE = '/api';

/** SSE event types from the backend */
export const SSE_EVENTS = {
  TOKEN: 'token',
  AGENT_STEP: 'agent_step',
  CHART: 'chart',
  CODE: 'code',
  ANOMALY: 'anomaly',
  FORECAST: 'forecast',
  ERROR: 'error',
  DONE: 'done',
};

/** Agent name → icon mapping */
export const AGENT_ICONS = {
  'Router': '🧭',
  'Schema Retriever': '📋',
  'Coder': '💻',
  'Validator': '✅',
  'Executor': '⚡',
  'Chart Agent': '📊',
  'Anomaly Detective': '🔍',
  'Forecast Agent': '📈',
  'Narrator': '📝',
};

/** Anomaly severity colors */
export const SEVERITY_COLORS = {
  high: 'var(--color-error)',
  medium: 'var(--color-warning)',
  low: 'var(--color-text-secondary)',
};
