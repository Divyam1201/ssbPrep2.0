"use client";

import { useId, useRef, useState } from "react";

import { useObjectUrl } from "@/core/files/useObjectUrl";

export interface LocalFileDropzoneProps {
  files: readonly File[];
  onFilesChange: (files: readonly File[]) => void;
  maxFiles?: number;
  accept?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function LocalFileDropzone({
  files,
  onFilesChange,
  maxFiles = 11,
  accept = "image/*",
  label = "Drop images from this device",
  hint = "or click to browse — PNG, JPG, WEBP (up to 11 images, stored on device only)",
  disabled = false,
}: LocalFileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addFiles = (incomingList: FileList | null) => {
    if (!incomingList || incomingList.length === 0 || disabled) return;
    setErrorMessage(null);

    const incoming = Array.from(incomingList).filter((f) =>
      f.type.startsWith("image/"),
    );

    if (files.length + incoming.length > maxFiles) {
      setErrorMessage(
        `You can add at most ${maxFiles} images (currently have ${files.length}, tried adding ${incoming.length}).`,
      );
      return;
    }

    // Merge files avoiding duplicate names & sizes
    const seen = new Set(files.map((f) => `${f.name}:${f.size}`));
    const next = [...files];
    for (const f of incoming) {
      const key = `${f.name}:${f.size}`;
      if (!seen.has(key)) {
        seen.add(key);
        next.push(f);
      }
    }

    onFilesChange(next);
  };

  const removeFile = (fileToRemove: File) => {
    if (disabled) return;
    onFilesChange(files.filter((f) => f !== fileToRemove));
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragDepth.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-8 ${
          isDragging
            ? "border-[#cba358] bg-[#cba358]/10"
            : "border-[#282f2c] bg-[#141716] hover:border-[#5d6b4f]"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2321] text-[#cba358]">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <p className="mt-3 text-sm font-medium text-[#f4efe6] sm:text-base">
          {label}
        </p>
        <p className="mt-1 text-xs text-[#c2b9a7] sm:text-sm">{hint}</p>

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#cba358] px-4 py-2 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Choose local images
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#c2b9a7]">
            <span>{files.length} of {maxFiles} images selected</span>
            <button
              type="button"
              onClick={() => onFilesChange([])}
              className="text-xs text-[#c2b9a7] hover:text-red-400"
            >
              Clear all
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, idx) => (
              <LocalThumbnail
                key={`${file.name}:${file.size}:${idx}`}
                file={file}
                disabled={disabled}
                onRemove={() => removeFile(file)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LocalThumbnail({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled: boolean;
  onRemove: () => void;
}) {
  const url = useObjectUrl(file);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#282f2c] bg-[#141716]">
      <div className="flex aspect-[4/3] items-center justify-center bg-[#0d0f0e]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={file.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-xs text-[#8c8273]">Loading…</span>
        )}
      </div>
      <div className="border-t border-[#282f2c] p-2">
        <p className="truncate text-[11px] font-medium text-[#f4efe6]">
          {file.name}
        </p>
        <p className="text-[10px] text-[#8c8273]">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs text-zinc-300 transition hover:bg-red-500 hover:text-white"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
