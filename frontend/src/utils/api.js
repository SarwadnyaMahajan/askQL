/** API utility wrappers */
import { API_BASE } from './constants';

/**
 * Upload CSV files to the backend.
 * @param {File[]} files - Array of File objects
 * @param {string} [sessionId] - Optional existing session ID
 * @returns {Promise<object>} Upload response with session_id and file profiles
 */
export async function uploadFiles(files, sessionId = null) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  let url = `${API_BASE}/upload`;
  if (sessionId) url += `?session_id=${encodeURIComponent(sessionId)}`;

  const token = localStorage.getItem('access_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { method: 'POST', body: formData, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

/**
 * Send a chat message and get an SSE stream back.
 * @param {string} sessionId
 * @param {string} message
 * @returns {Response} Raw fetch Response with readable body stream
 */
export async function sendChatMessage(sessionId, message, generateChart = false) {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId, message, generate_chart: generateChart }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Chat request failed');
  }
  return res;
}

/**
 * Check backend health.
 * @returns {Promise<object>}
 */
export async function checkHealth() {
  const res = await fetch('/health');
  return res.json();
}
