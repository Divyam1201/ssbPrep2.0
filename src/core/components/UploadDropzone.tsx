"use client";

import { useId, useRef, useState } from "react";

import { useUploadThing } from "@/core/uploadthing";

export interface UploadedFileItem {
  key: string;
  url: string;
  name: string;
  size: number;
}

export interface UploadDropzoneProps {
  endpoint: "tatImages" | "materialDocument";
  files: readonly UploadedFileItem[];
  onFilesChange: (files: readonly UploadedFileItem[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export function UploadDropzone({
  endpoint,
  files,
  onFilesChange,
  disabled = false,
  label,
  hint,
}: UploadDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress: (p) => {
      setProgress(p);
    },
    onClientUploadComplete: (res) => {
      setProgress(100);
      setErrorMessage(null);
      if (res && res.length > 0) {
        const newUploaded: UploadedFileItem[] = res.map((r) => ({
          key: r.key,
          url: r.url,
          name: r.name,
          size: r.size,
        }));

        if (endpoint === "materialDocument") {
          // Document route replaces the single document
          onFilesChange(newUploaded);
        } else {
          // Merge images without duplicates by key
          const seen = new Set(files.map((f) => f.key));
          const merged = [...files];
          for (const item of newUploaded) {
            if (!seen.has(item.key)) {
              seen.add(item.key);
              merged.push(item);
            }
          }
          onFilesChange(merged);
        }
      }
    },
    onUploadError: (err) => {
      setErrorMessage(err.message || "Upload failed. Please try again.");
    },
  });

  const isImages = endpoint === "tatImages";
  const defaultLabel = isImages
    ? "Drop practice images here"
    : "Drop practice document here";
  const defaultHint = isImages
    ? "or click to browse — PNG, JPG, WEBP (up to 11 images, 8MB each)"
    : "or click to browse — PDF, DOC, DOCX, or Image (up to 16MB)";
  const acceptTypes = isImages
    ? "image/*"
    : ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

  const handleFiles = (incomingList: FileList | null) => {
    if (!incomingList || incomingList.length === 0 || disabled || isUploading) {
      return;
    }
    const incoming = Array.from(incomingList);
    setErrorMessage(null);
    setProgress(0);

    if (isImages && files.length + incoming.length > 11) {
      setErrorMessage(
        `TAT sets can have at most 11 images (currently have ${files.length}, tried adding ${incoming.length}).`,
      );
      return;
    }

    void startUpload(incoming);
  };

  const removeFile = (keyToRemove: string) => {
    if (disabled || isUploading) return;
    onFilesChange(files.filter((f) => f.key !== keyToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone container */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled || isUploading) return;
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
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-8 ${
          isDragging
            ? "border-[#cba358] bg-[#cba358]/10"
            : "border-[#282f2c] bg-[#141716] hover:border-[#5d6b4f]"
        } ${disabled || isUploading ? "opacity-75" : ""}`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={acceptTypes}
          multiple={isImages}
          disabled={disabled || isUploading}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="mt-3 text-sm font-medium text-[#f4efe6] sm:text-base">
          {label ?? defaultLabel}
        </p>
        <p className="mt-1 text-xs text-[#c2b9a7] sm:text-sm">
          {hint ?? defaultHint}
        </p>

        {isUploading ? (
          <div className="mx-auto mt-4 max-w-xs space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e2321]">
              <div
                className="h-full bg-[#cba358] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-[#cba358]">
              Uploading to UploadThing… {progress}%
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#cba358] px-4 py-2 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImages ? "Choose images" : "Choose document"}
          </button>
        )}
      </div>

      {/* Error display */}
      {errorMessage ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
          <p className="font-semibold">Upload Error</p>
          <p className="mt-0.5">{errorMessage}</p>
        </div>
      ) : null}

      {/* Uploaded items list */}
      {files.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#c2b9a7]">
            <span>
              Uploaded {files.length} {isImages ? "image" : "document"}
              {files.length === 1 ? "" : "s"}
            </span>
            {!isUploading && !disabled ? (
              <button
                type="button"
                onClick={() => onFilesChange([])}
                className="text-xs text-[#c2b9a7] hover:text-red-400"
              >
                Clear all
              </button>
            ) : null}
          </div>

          {isImages ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file, idx) => (
                <li
                  key={file.key}
                  className="group relative overflow-hidden rounded-xl border border-[#282f2c] bg-[#141716]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#0d0f0e]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- UploadThing remote images */}
                    <img
                      src={file.url}
                      alt={file.name || `TAT image ${idx + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="border-t border-[#282f2c] p-2">
                    <p className="truncate text-[11px] font-medium text-[#f4efe6]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[#8c8273]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!disabled && !isUploading ? (
                    <button
                      type="button"
                      onClick={() => removeFile(file.key)}
                      aria-label={`Remove ${file.name}`}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs text-zinc-300 transition hover:bg-red-500 hover:text-white"
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.key}
                  className="flex items-center justify-between rounded-xl border border-[#282f2c] bg-[#141716] p-3 text-xs"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e2321] text-[#cba358]">
                      📄
                    </span>
                    <div className="truncate">
                      <p className="truncate font-medium text-[#f4efe6]">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-[#8c8273]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · UploadThing
                      </p>
                    </div>
                  </div>
                  {!disabled && !isUploading ? (
                    <button
                      type="button"
                      onClick={() => removeFile(file.key)}
                      className="ml-3 text-sm text-[#c2b9a7] hover:text-red-400"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
