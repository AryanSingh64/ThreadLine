"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const INITIAL = {
  running: false,
  inputType: null,
  mode: "standard",
  statusMessages: [],
  moduleResults: {},
  expectedModules: [],          // ← list from first status event
  graph: { nodes: [], edges: [] },
  score: null,
  explanation: "",
  summary: null,
  timeline: [],
  error: "",
};

export function useInvestigation() {
  const [state, setState] = useState(INITIAL);
  const sourceRef = useRef(null);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  const startInvestigation = useCallback(
    (query, mode) => {
      stop();

      setState({
        ...INITIAL,
        running: true,
        mode,
        statusMessages: [`Dispatching ${mode} investigation for "${query}"...`],
      });

      const params = new URLSearchParams({ q: query, mode });
      const source = new EventSource(`/api/investigate?${params.toString()}`);
      sourceRef.current = source;

      source.addEventListener("status", (event) => {
        const payload = JSON.parse(event.data);
        setState((prev) => {
          const next = {
            ...prev,
            inputType: payload.inputType || prev.inputType,
            statusMessages: [...prev.statusMessages, payload.message],
          };
          // First status event carries the full module list
          if (Array.isArray(payload.modules) && prev.expectedModules.length === 0) {
            next.expectedModules = payload.modules;
          }
          return next;
        });
      });

      source.addEventListener("module_result", (event) => {
        const payload = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          moduleResults: {
            ...prev.moduleResults,
            [payload.module]: payload,
          },
        }));
      });

      source.addEventListener("graph_update", (event) => {
        const payload = JSON.parse(event.data);
        setState((prev) => ({ ...prev, graph: payload }));
      });

      source.addEventListener("score", (event) => {
        const payload = JSON.parse(event.data);
        setState((prev) => ({ ...prev, score: payload }));
      });

      source.addEventListener("explanation", (event) => {
        const payload = JSON.parse(event.data);
        setState((prev) => ({ ...prev, explanation: payload.text || "" }));
      });

      source.addEventListener("complete", (event) => {
        const payload = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          running: false,
          summary: payload.summary,
          timeline: payload.summary?.timeline || [],
          graph: payload.summary?.graph || prev.graph,
        }));
        // Save to investigation history
        try {
          const s = payload.summary;
          const entry = {
            id: Date.now(),
            query: s?.query || "",
            inputType: s?.inputType || "unknown",
            score: s?.score?.score ?? null,
            label: s?.score?.label ?? null,
            mode: s?.mode || "deep",
            ts: new Date().toISOString(),
          };
          const prev = JSON.parse(localStorage.getItem("threadline_history") || "[]");
          const next = [entry, ...prev.filter((h) => h.query !== entry.query)].slice(0, 10);
          localStorage.setItem("threadline_history", JSON.stringify(next));
        } catch {}
        source.close();
        sourceRef.current = null;
      });

      source.onerror = () => {
        setState((prev) => ({
          ...prev,
          running: false,
          error: "The investigation stream ended unexpectedly.",
        }));
        source.close();
        sourceRef.current = null;
      };
    },
    [stop]
  );

  const moduleList = useMemo(
    () => Object.values(state.moduleResults),
    [state.moduleResults]
  );

  /**
   * Real progress: percentage of expected modules that have returned results.
   * Falls back to message-count estimate if expectedModules isn't populated yet.
   */
  const progress = useMemo(() => {
    if (!state.running) return 100;
    const total = state.expectedModules.length;
    const done = Object.keys(state.moduleResults).length;
    if (total > 0) {
      // Keep between 5% and 97% while running
      return Math.min(97, Math.max(5, Math.round((done / total) * 100)));
    }
    // Fallback: message count heuristic
    const messageCount = state.statusMessages.length;
    const estimatedTotal = 12;
    return Math.min(Math.round((messageCount / estimatedTotal) * 100), 60);
  }, [state.expectedModules, state.moduleResults, state.statusMessages, state.running]);

  return {
    ...state,
    moduleList,
    progress,
    startInvestigation,
    stop,
  };
}
