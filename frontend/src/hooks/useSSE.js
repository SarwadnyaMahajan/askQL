/** SSE stream consumer hook for chat responses. */
import { useState, useCallback, useRef } from 'react';
import { sendChatMessage } from '../utils/api';
import { SSE_EVENTS } from '../utils/constants';

/**
 * useSSE — manages an SSE stream from the chat endpoint.
 *
 * Returns:
 *  - send(sessionId, message): start a new SSE stream
 *  - events: accumulated parsed events array
 *  - isStreaming: boolean
 *  - error: string | null
 *  - reset(): clear all state
 */
export function useSSE() {
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setEvents([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  const send = useCallback(async (sessionId, message, generateChart = false) => {
    // Abort previous stream if any
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setEvents([]);
    setIsStreaming(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: sessionId, message, generate_chart: generateChart }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Chat request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = null;

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:') && currentEvent) {
            const dataStr = line.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              const evt = { event: currentEvent, data };
              setEvents((prev) => [...prev, evt]);

              if (currentEvent === SSE_EVENTS.ERROR) {
                setError(data.detail || 'Unknown error');
              }

              if (currentEvent === SSE_EVENTS.DONE) {
                setIsStreaming(false);
              }
            } catch {
              // Non-JSON data — skip
            }
            currentEvent = null;
          } else if (line === '') {
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { send, events, isStreaming, error, reset };
}

export default useSSE;
