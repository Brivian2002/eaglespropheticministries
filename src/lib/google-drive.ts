/**
 * Google Drive Helper
 *
 * Uses JWT (Service Account) authentication with the googleapis package.
 * Reads private PDFs from Google Drive and returns a readable stream.
 * The Drive File ID is NEVER exposed to the client.
 */

import { google } from "googleapis";
import type { Readable } from "stream";

let _auth: Awaited<ReturnType<typeof getAuth>> | null = null;

async function getAuth() {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      "Google Drive: GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY must be set."
    );
  }

  // Replace escaped newlines in the private key
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return auth;
}

/**
 * Get an authenticated Google Drive client (v3).
 * Caches the auth client for reuse.
 */
async function getDrive() {
  if (!_auth) {
    _auth = await getAuth();
  }
  const drive = google.drive({ version: "v3", auth: _auth });
  return drive;
}

/**
 * Fetch a private file from Google Drive as a stream.
 * @param fileId - The Google Drive file ID
 * @returns A Node.js Readable stream of the file content
 */
export async function getDriveFileStream(fileId: string): Promise<Readable> {
  const drive = await getDrive();

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return response.data as unknown as Readable;
}

/**
 * Verify that a file exists and is a PDF.
 * Returns the file name if found, null otherwise.
 */
export async function getDriveFileInfo(
  fileId: string
): Promise<{ name: string; size: string; mimeType: string } | null> {
  try {
    const drive = await getDrive();
    const response = await drive.files.get({
      fileId,
      fields: "name, size, mimeType",
    });
    return response.data as unknown as {
      name: string;
      size: string;
      mimeType: string;
    };
  } catch {
    return null;
  }
}
