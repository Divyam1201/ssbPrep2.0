"use client";

import { useState } from "react";

import {
  UploadDropzone,
  type UploadedFileItem,
} from "@/core/components/UploadDropzone";
import type { ModuleType } from "@/server/services/setService";

export interface AdminUploadModalProps {
  isOpen: boolean;
  initialModule?: ModuleType;
  onClose: () => void;
  onSuccess: () => void;
}

const MODULE_OPTIONS: Array<{ value: ModuleType; label: string; desc: string }> = [
  { value: "tat", label: "TAT (Thematic Apperception Test)", desc: "Up to 11 images" },
  { value: "wat", label: "WAT (Word Association Test)", desc: "1 document with words" },
  { value: "srt", label: "SRT (Situation Reaction Test)", desc: "1 document with situations" },
  { value: "lecturette", label: "Lecturette", desc: "1 document with lecture topics" },
  { value: "gd", label: "Group Discussion (GD)", desc: "1 document with GD scenarios" },
];

export function AdminUploadModal({
  isOpen,
  initialModule = "tat",
  onClose,
  onSuccess,
}: AdminUploadModalProps) {
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);
  const [setName, setSetName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<readonly UploadedFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTat = selectedModule === "tat";
  const endpoint = isTat ? "tatImages" : "materialDocument";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setName.trim()) {
      setErrorMessage("Please enter a set name.");
      return;
    }
    if (uploadedFiles.length === 0) {
      setErrorMessage("Please upload at least one file before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: selectedModule,
          name: setName.trim(),
          files: uploadedFiles,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save set");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error creating set",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-upload-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#282f2c] bg-[#141716] p-6 text-[#f4efe6] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#282f2c] pb-3">
          <div>
            <h2 id="admin-upload-title" className="text-lg font-semibold text-[#f4efe6]">
              Upload New Shared Set
            </h2>
            <p className="text-xs text-[#c2b9a7]">
              Sets uploaded here become publicly available to all candidates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#8c8273] hover:text-[#f4efe6]"
          >
            ✕
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="set-type-select"
              className="block text-xs font-medium text-[#c2b9a7]"
            >
              Test Type
            </label>
            <select
              id="set-type-select"
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value as ModuleType);
                setUploadedFiles([]); // clear uploaded files when changing type
              }}
              className="mt-1 w-full rounded-xl border border-[#282f2c] bg-[#0d0f0e] px-3.5 py-2 text-sm text-[#f4efe6] focus:border-[#cba358] focus:outline-none"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="upload-set-name"
              className="block text-xs font-medium text-[#c2b9a7]"
            >
              Set Name
            </label>
            <input
              id="upload-set-name"
              type="text"
              required
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="e.g. Standard SSB Set 2026 #1"
              className="mt-1 w-full rounded-xl border border-[#282f2c] bg-[#0d0f0e] px-3.5 py-2 text-sm text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c2b9a7] mb-1.5">
              Files ({isTat ? "Up to 11 images" : "1 document or image"})
            </label>
            <UploadDropzone
              endpoint={endpoint}
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#282f2c] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#282f2c] px-4 py-2 text-xs font-medium text-[#c2b9a7] hover:bg-[#1e2321]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadedFiles.length === 0}
              className="rounded-xl bg-[#cba358] px-5 py-2 text-xs font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving to database…" : "Save Set to Public Pool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
