import "server-only";
import { google } from "googleapis";
import type { Readable } from "node:stream";

export interface DriveMediaStream {
  stream: Readable;
  contentType: string;
  contentLength?: string;
  contentRange?: string;
  status: number;
}

function getDriveClient() {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error("Google Drive server credentials are not configured.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      project_id: projectId,
      client_email: clientEmail,
      private_key: rawPrivateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

export async function getGoogleDriveFileSize(fileId: string): Promise<number> {
  const drive = getDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: "size",
    supportsAllDrives: true,
  });
  const size = Number(response.data.size);
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error("Google Drive did not return a valid file size.");
  }
  return size;
}

export async function openGoogleDriveMediaStream(fileId: string, range?: string): Promise<DriveMediaStream> {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    {
      responseType: "stream",
      ...(range ? { headers: { Range: range } } : {}),
    },
  );

  const stream = response.data as Readable;
  if (!stream || typeof stream.pipe !== "function") {
    throw new Error("Google Drive did not return a readable media stream.");
  }
  const headers = response.headers as Record<string, string | undefined>;
  return {
    stream,
    contentType: headers["content-type"] || "application/octet-stream",
    contentLength: headers["content-length"],
    contentRange: headers["content-range"],
    status: response.status || (range ? 206 : 200),
  };
}
