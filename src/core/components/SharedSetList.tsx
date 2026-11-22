"use client";

import { useEffect, useState } from "react";

import type { ModuleType, PublicRecentSet } from "@/server/services/setService";

export interface SharedSetListProps {
  module: ModuleType;
  selectedSetId?: string | null;
  onSelectSet: (set: PublicRecentSet) => void;
  refreshTrigger?: number;
}

export function SharedSetList({
  module,
  selectedSetId,
  onSelectSet,
  refreshTrigger,
}: SharedSetListProps) {
  const [sets, setSets] = useState<PublicRecentSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state on module/refreshTrigger change
    setIsLoading(true);
    setError(null);

    const fetchSets = async () => {
      try {
        const res = await fetch(`/api/sets?module=${module}&limit=20`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load sets");
        }
        if (!ignore) {
          setSets(data.sets || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Unable to load shared sets",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void fetchSets();

    return () => {
      ignore = true;
    };
  }, [module, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#282f2c] bg-[#141716] p-4 text-center text-xs text-[#8c8273]">
        Loading shared practice sets…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
        <span>{error}</span>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#282f2c] bg-[#141716]/60 p-6 text-center text-xs text-[#8c8273]">
        No sets uploaded yet in the shared pool.
      </div>
    );
  }

  const isTat = module === "tat";

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#cba358]">
        Public Shared Sets
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {sets.map((set) => {
          const isSelected = selectedSetId === set.id;
          const formattedDate = new Date(set.createdAt).toLocaleDateString(
            undefined,
            { month: "short", day: "numeric", year: "numeric" },
          );

          return (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelectSet(set)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-[#cba358] bg-[#cba358]/10 ring-1 ring-[#cba358]"
                  : "border-[#282f2c] bg-[#141716] hover:border-[#5d6b4f]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm text-[#f4efe6]">
                  {set.name}
                </span>
                {set.setType ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      set.isComplete
                        ? "bg-[#5d6b4f]/30 text-[#7c8e6a] border border-[#5d6b4f]/40"
                        : "bg-[#8c8273]/20 text-[#c2b9a7] border border-[#8c8273]/30"
                    }`}
                  >
                    {set.setType}
                  </span>
                ) : null}
              </div>

              {/* TAT image thumbnails preview */}
              {isTat && set.files.length > 0 ? (
                <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
                  {set.files.slice(0, 5).map((f) => (
                    <div
                      key={f.key}
                      className="h-10 w-12 shrink-0 overflow-hidden rounded border border-[#282f2c] bg-[#0d0f0e]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  {set.files.length > 5 ? (
                    <span className="text-[10px] text-[#8c8273]">
                      +{set.files.length - 5}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 flex items-center justify-between text-[11px] text-[#8c8273]">
                <span>
                  {set.itemCount} {isTat ? "image" : module === "wat" ? "word" : "item"}
                  {set.itemCount === 1 ? "" : "s"}
                </span>
                <span>{formattedDate}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
