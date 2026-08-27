import "server-only"

import {
  deleteFileFromDrive,
  downloadFileFromDrive,
  getOrCreateHierarchy,
  uploadFileToDrive,
} from "@/lib/integrations/drive"
import { checksum } from "@/lib/storage/keys"
import type { StorageAdapter, StoredObject } from "@/lib/storage/types"

/**
 * Google Drive hierarchical storage adapter.
 *
 * Automatically organizes uploaded files into:
 * 📁 Personal_OS / [workspaceSlug] / [Category]
 */
export function gdriveStorage(getAccessToken: () => Promise<string>): StorageAdapter {
  return {
    name: "gdrive",

    async put(key, data, contentType) {
      const token = await getAccessToken()

      // Parse workspace and file name from key (e.g. "tenantId/filename.pdf")
      const parts = key.split("/")
      const workspaceSlug = parts[0] || "workspace"
      const fileName = parts.slice(1).join("_") || key

      // Categorize into the appropriate hierarchy folder
      let category = "Captures & Assets"
      const lowerName = fileName.toLowerCase()
      if (
        contentType.includes("pdf") ||
        lowerName.endsWith(".pdf") ||
        lowerName.includes("brief") ||
        lowerName.includes("proposal") ||
        lowerName.includes("contract")
      ) {
        category = "Briefs & Contracts"
      } else if (
        lowerName.includes("invoice") ||
        lowerName.includes("receipt") ||
        lowerName.includes("statement") ||
        lowerName.includes("bill")
      ) {
        category = "Finance & Invoices"
      } else if (
        contentType.startsWith("video/") ||
        lowerName.endsWith(".mp4") ||
        lowerName.endsWith(".mov") ||
        lowerName.includes("deliverable") ||
        lowerName.includes("reel")
      ) {
        category = "Deliverables"
      } else if (contentType.startsWith("audio/") || lowerName.endsWith(".m4a") || lowerName.endsWith(".mp3")) {
        category = "Voice Notes"
      }

      const parentFolderId = await getOrCreateHierarchy(token, workspaceSlug, category)
      const uploaded = await uploadFileToDrive(token, {
        name: fileName,
        mimeType: contentType,
        bytes: data,
        parentFolderId,
      })

      return {
        key: `gdrive://${uploaded.id}:${key}`,
        size: uploaded.size,
        contentType,
        checksum: uploaded.checksum || checksum(data),
      } satisfies StoredObject
    },

    async get(key) {
      const token = await getAccessToken()
      if (key.startsWith("gdrive://")) {
        const fileId = key.replace("gdrive://", "").split(":")[0]
        return downloadFileFromDrive(token, fileId)
      }
      throw new Error(`Invalid Google Drive storage key: ${key}`)
    },

    async delete(key) {
      const token = await getAccessToken()
      if (key.startsWith("gdrive://")) {
        const fileId = key.replace("gdrive://", "").split(":")[0]
        await deleteFileFromDrive(token, fileId)
      }
    },

    async exists(key) {
      return key.startsWith("gdrive://")
    },
  }
}
