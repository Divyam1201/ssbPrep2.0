"use client";

export interface ImageViewerProps {
  src: string | null;
  alt: string;
  index: number;
  total: number;
}

/**
 * Full-screen image for the view phase. No timer, no progress bar.
 */
export function ImageViewer({ src, alt, index, total }: ImageViewerProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URLs and static SVGs both need object-contain
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <p className="text-sm text-zinc-500">Preparing image…</p>
        )}
      </div>
      <p className="shrink-0 text-xs tracking-[0.2em] text-zinc-600 uppercase">
        Image {index + 1} of {total}
      </p>
    </div>
  );
}
