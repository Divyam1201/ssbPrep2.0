"use client";

import { useCallback, useEffect, useState } from "react";

import type { LecturetteTopic } from "../types";

export interface UseTopicsReturn {
  topics: LecturetteTopic[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTopics(): UseTopicsReturn {
  const [topics, setTopics] = useState<LecturetteTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchToken, setFetchToken] = useState(0);

  const refetch = useCallback(() => setFetchToken((t) => t + 1), []);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        // On first load, seed default topics
        const url =
          fetchToken === 0
            ? "/api/lecturette/topics?seed=true"
            : "/api/lecturette/topics";

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load topics");
        }

        if (!ignore) {
          setTopics(data.topics || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load topics",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [fetchToken]);

  return { topics, isLoading, error, refetch };
}
