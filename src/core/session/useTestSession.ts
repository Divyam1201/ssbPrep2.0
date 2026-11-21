"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SessionStatus = "idle" | "running" | "complete";

export interface UseTestSessionOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onReset?: () => void;
}

export interface TestSession {
  status: SessionStatus;
  start: () => void;
  complete: () => void;
  reset: () => void;
}

/**
 * The smallest shared state machine every module needs:
 * idle -> running -> complete (and reset back to idle).
 */
export function useTestSession(
  options: UseTestSessionOptions = {},
): TestSession {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const statusRef = useRef<SessionStatus>("idle");
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const start = useCallback(() => {
    if (statusRef.current === "running") return;
    statusRef.current = "running";
    setStatus("running");
    optionsRef.current.onStart?.();
  }, []);

  const complete = useCallback(() => {
    if (statusRef.current === "complete") return;
    statusRef.current = "complete";
    setStatus("complete");
    optionsRef.current.onComplete?.();
  }, []);

  const reset = useCallback(() => {
    statusRef.current = "idle";
    setStatus("idle");
    optionsRef.current.onReset?.();
  }, []);

  return { status, start, complete, reset };
}
