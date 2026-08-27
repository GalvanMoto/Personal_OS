import "server-only"

import { localStorage } from "@/lib/storage/local"
import type { StorageAdapter } from "@/lib/storage/types"

export type { StorageAdapter, StoredObject } from "@/lib/storage/types"
export { buildKey, keyBelongsTo, safeFileName } from "@/lib/storage/keys"

let adapter: StorageAdapter | null = null

/// Single place the storage backend is chosen.
export function storage(): StorageAdapter {
  adapter ??= localStorage(process.env.STORAGE_DIR ?? "./.storage")
  return adapter
}

/// Lets tests and workers substitute a backend without touching env vars.
export function setStorage(next: StorageAdapter | null) {
  adapter = next
}
