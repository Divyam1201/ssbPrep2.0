"use client";

export interface WritingScreenProps {
  /** Next image is fetched invisibly while writing, so it opens instantly. */
  preloadSrc: string | null;
}

/**
 * The writing phase shows exactly one instruction and nothing else.
 */
export function WritingScreen({ preloadSrc }: WritingScreenProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-center text-2xl font-semibold tracking-tight text-zinc-200 sm:text-3xl">
        Start writing
      </p>
      {preloadSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- hidden preload of the next object URL
        <img
          src={preloadSrc}
          alt=""
          aria-hidden="true"
          className="hidden"
          draggable={false}
        />
      ) : null}
    </div>
  );
}
