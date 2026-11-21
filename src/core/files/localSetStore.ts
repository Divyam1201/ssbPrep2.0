/**
 * localSetStore: Browser-only storage for custom practice sets.
 * Stores images locally in IndexedDB with a 24-hour TTL and graceful in-memory fallback.
 */

export const LOCAL_SET_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DB_NAME = "ssb_local_store";
const STORE_NAME = "custom_sets";
const DB_VERSION = 1;

export interface StoredLocalFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

export interface StoredLocalSet {
  id: string; // e.g. `${moduleId}:custom`
  moduleId: string;
  name: string;
  files: StoredLocalFile[];
  savedAt: number;
}

export interface LocalStoreResult<T> {
  data: T;
  isInMemoryFallback: boolean;
  message?: string;
}

// In-memory fallback if IndexedDB is blocked (incognito, quota, or disabled)
const memoryStore = new Map<string, StoredLocalSet>();
let hasFallbackOccurred = false;

function canUseIndexedDb(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined" &&
    window.indexedDB !== null
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      return reject(new Error("IndexedDB is not available"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open DB"));
  });
}

/**
 * Saves a custom set to local storage (IndexedDB with memory fallback).
 */
export async function saveLocalCustomSet(
  moduleId: string,
  name: string,
  files: readonly File[],
): Promise<LocalStoreResult<StoredLocalSet>> {
  const id = `${moduleId}:custom`;
  const storedFiles: StoredLocalFile[] = files.map((f) => ({
    name: f.name,
    type: f.type,
    size: f.size,
    lastModified: f.lastModified,
    blob: f.slice(0, f.size, f.type),
  }));

  const record: StoredLocalSet = {
    id,
    moduleId,
    name: name || "Custom Practice Set",
    files: storedFiles,
    savedAt: Date.now(),
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return {
      data: record,
      isInMemoryFallback: false,
    };
  } catch (err) {
    console.warn("IndexedDB save failed, falling back to memory:", err);
    hasFallbackOccurred = true;
    memoryStore.set(id, record);
    return {
      data: record,
      isInMemoryFallback: true,
      message: "Saving in-memory for this session (local storage unavailable).",
    };
  }
}

/**
 * Loads the active custom set for a module if not expired.
 */
export async function loadLocalCustomSet(
  moduleId: string,
): Promise<LocalStoreResult<StoredLocalSet | null>> {
  const id = `${moduleId}:custom`;

  try {
    const db = await openDb();
    const record = await new Promise<StoredLocalSet | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      },
    );

    if (!record) {
      const memRecord = memoryStore.get(id) || null;
      return { data: memRecord, isInMemoryFallback: hasFallbackOccurred };
    }

    // Check TTL (24 hours)
    if (Date.now() - record.savedAt > LOCAL_SET_TTL_MS) {
      // Expired: delete
      await deleteLocalCustomSet(moduleId);
      return { data: null, isInMemoryFallback: false };
    }

    return { data: record, isInMemoryFallback: false };
  } catch {
    const memRecord = memoryStore.get(id);
    if (memRecord && Date.now() - memRecord.savedAt <= LOCAL_SET_TTL_MS) {
      return { data: memRecord, isInMemoryFallback: true };
    }
    return { data: null, isInMemoryFallback: true };
  }
}

/**
 * Deletes the stored custom set for a module.
 */
export async function deleteLocalCustomSet(moduleId: string): Promise<void> {
  const id = `${moduleId}:custom`;
  memoryStore.delete(id);

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Purges all expired sets across all modules on app startup.
 */
export async function purgeExpiredLocalSets(): Promise<void> {
  // Purge memory store
  const now = Date.now();
  for (const [id, record] of memoryStore.entries()) {
    if (now - record.savedAt > LOCAL_SET_TTL_MS) {
      memoryStore.delete(id);
    }
  }

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as StoredLocalSet;
          if (now - item.savedAt > LOCAL_SET_TTL_MS) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error if DB inaccessible
  }
}
