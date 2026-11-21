"use client";

import { useEffect, useState } from "react";

/**
 * Creates an object URL for a local file and revokes it on change/unmount.
 * The URL is kept in state so a Strict Mode effect re-run always ends with a
 * live URL rather than a revoked one.
 */
export function useObjectUrl(file: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a revoked object URL must be cleared from state
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => {
      setUrl(null);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return url;
}

/**
 * Object URLs for a list of files, keyed by the File instance.
 * `files` must be referentially stable (memoise it) between renders.
 */
export function useObjectUrls(
  files: readonly File[],
): ReadonlyMap<File, string> {
  const [urls, setUrls] = useState<ReadonlyMap<File, string>>(new Map());

  useEffect(() => {
    const created = new Map<File, string>();
    for (const file of files) {
      created.set(file, URL.createObjectURL(file));
    }
    // The effect owns the object URL lifecycle, so state is the only way to
    // surface the newly created URLs to the render that displays them.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs are external resources
    setUrls(created);

    return () => {
      setUrls(new Map());
      for (const url of created.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [files]);

  return urls;
}
