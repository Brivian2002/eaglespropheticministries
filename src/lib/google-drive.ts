import "server-only";
import { google } from "googleapis";
import type { Readable } from "node:stream";

export interface DriveMediaStream {
  stream: Readable;
  contentType: string;
  contentLength?: string;
}

export async function openGoogleDriveMediaStream(fileId: string): Promise<DriveMediaStream> {
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
  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" },
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
  };
}
