import "server-only"

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const DRIVE_API = "https://www.googleapis.com/drive/v3"
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
]

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  size?: number
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
  parents?: string[]
}

export type DriveListResult = {
  files: DriveFile[]
  nextPageToken?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function requireEnv(name: string): string {
  const value =
    process.env[name] ||
    process.env[name.replace("GOOGLE_DRIVE_", "GMAIL_")] ||
    process.env[name.replace("GOOGLE_DRIVE_", "GOOGLE_")] ||
    process.env[name.replace("GMAIL_", "GOOGLE_")]
  if (!value) {
    throw new Error(`${name} is not set in environment.`)
  }
  return value
}

/**
 * Builds the Google Drive OAuth consent URL.
 */
export function driveAuthUrl(redirectUri: string, state: string): string {
  const clientId =
    process.env.GOOGLE_DRIVE_CLIENT_ID ||
    process.env.GMAIL_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error("GOOGLE_DRIVE_CLIENT_ID, GMAIL_CLIENT_ID, or GOOGLE_CLIENT_ID must be set.")
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return `${AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCodeForDriveTokens(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: number; scope?: string }> {
  const clientId =
    process.env.GOOGLE_DRIVE_CLIENT_ID ||
    process.env.GMAIL_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID!
  const clientSecret =
    process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
    process.env.GMAIL_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET!

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    throw new Error(`Drive token exchange failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  }
}

/**
 * Looks up or creates a folder by name inside a parent folder.
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<string> {
  const queryParts = [
    `name = '${folderName.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
  ]
  if (parentId) {
    queryParts.push(`'${parentId}' in parents`)
  } else {
    queryParts.push("'root' in parents")
  }

  const searchRes = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(queryParts.join(" and "))}&fields=files(id, name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.files && data.files.length > 0) {
      return data.files[0].id
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Failed to create Drive folder ${folderName}: ${await createRes.text()}`)
  }

  const folder = await createRes.json()
  return folder.id
}

/**
 * Creates or retrieves the structured folder hierarchy:
 * Personal_OS / [workspaceSlug] / [Category]
 */
export async function getOrCreateHierarchy(
  accessToken: string,
  workspaceSlug: string,
  category: string = "Captures & Assets"
): Promise<string> {
  // 1. Root folder: Personal_OS
  const rootId = await getOrCreateFolder(accessToken, "Personal_OS")

  // 2. Workspace folder: [workspaceSlug]
  const wsFolder = workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1)
  const wsId = await getOrCreateFolder(accessToken, wsFolder, rootId)

  // 3. Category folder
  const categoryFolderId = await getOrCreateFolder(accessToken, category, wsId)
  return categoryFolderId
}

/**
 * Uploads a file buffer directly to Google Drive via multipart upload.
 */
export async function uploadFileToDrive(
  accessToken: string,
  input: {
    name: string
    mimeType: string
    bytes: Buffer
    parentFolderId?: string
  }
): Promise<{ id: string; name: string; webViewLink?: string; size: number; checksum?: string }> {
  const boundary = `-------PersonalOSUploadBoundary${Date.now()}`
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadata = {
    name: input.name,
    mimeType: input.mimeType,
    parents: input.parentFolderId ? [input.parentFolderId] : undefined,
  }

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${input.mimeType}\r\n\r\n`
    ),
    input.bytes,
    Buffer.from(closeDelimiter),
  ])

  const res = await fetch(
    `${UPLOAD_API}&fields=id,name,mimeType,size,md5Checksum,webViewLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  )

  if (!res.ok) {
    throw new Error(`Google Drive upload failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
    size: parseInt(data.size || String(input.bytes.byteLength), 10),
    checksum: data.md5Checksum,
  }
}

/**
 * Downloads binary content of a file from Google Drive.
 */
export async function downloadFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Google Drive download failed: ${res.status} ${await res.text()}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Deletes a file from Google Drive.
 */
export async function deleteFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok && res.status !== 404) {
    throw new Error(`Google Drive delete failed: ${res.status} ${await res.text()}`)
  }
}

export async function listDriveFiles(
  accessToken: string,
  options?: { pageSize?: number; pageToken?: string; query?: string }
): Promise<DriveListResult> {
  const params = new URLSearchParams({
    pageSize: String(options?.pageSize ?? 20),
    fields: "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink, thumbnailLink, parents)",
    orderBy: "modifiedTime desc",
  })

  if (options?.pageToken) {
    params.set("pageToken", options.pageToken)
  }

  if (options?.query) {
    params.set("q", options.query)
  }

  const res = await fetch(`${DRIVE_API}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Drive list files failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files: (data.files ?? []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size, 10) : undefined,
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink,
      thumbnailLink: f.thumbnailLink,
      parents: f.parents,
    })),
    nextPageToken: data.nextPageToken,
  }
}

export async function getDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFile> {
  const res = await fetch(
    `${DRIVE_API}/files/${fileId}?fields=id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink, thumbnailLink`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok) {
    throw new Error(`Drive get file failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}
