import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"

import { assertSafeKey, checksum } from "@/lib/storage/keys"
import type { StorageAdapter, StoredObject } from "@/lib/storage/types"

/**
 * Local-disk storage for development and single-box self-hosting.
 *
 * Every resolved path is checked to still be inside the root after
 * normalisation — belt and braces alongside `assertSafeKey`, because a path
 * traversal here would expose the whole filesystem.
 */
export function localStorage(rootDir: string): StorageAdapter {
  const root = resolve(rootDir)

  function pathFor(key: string): string {
    assertSafeKey(key)
    const full = resolve(join(root, key))

    if (full !== root && !full.startsWith(`${root}/`)) {
      throw new Error("Resolved storage path escaped the storage root")
    }

    return full
  }

  return {
    name: "local",

    async put(key, data, contentType) {
      const full = pathFor(key)
      await mkdir(dirname(full), { recursive: true })
      await writeFile(full, data)

      return {
        key,
        size: data.byteLength,
        contentType,
        checksum: checksum(data),
      } satisfies StoredObject
    },

    async get(key) {
      return readFile(pathFor(key))
    },

    async delete(key) {
      await rm(pathFor(key), { force: true })
    },

    async exists(key) {
      try {
        await stat(pathFor(key))
        return true
      } catch {
        return false
      }
    },
  }
}
