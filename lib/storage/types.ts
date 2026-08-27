export type StoredObject = {
  key: string
  size: number
  contentType: string
  checksum: string
}

/**
 * Storage boundary.
 *
 * Local disk today, S3-compatible later (PRD §29). Keeping this an interface
 * means the swap is one module rather than a search through every upload path,
 * and keys are already shaped the way object stores expect.
 */
export interface StorageAdapter {
  readonly name: string
  put(key: string, data: Buffer, contentType: string): Promise<StoredObject>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}
