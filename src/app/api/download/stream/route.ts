import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getProductById } from "@/lib/product-config";
import { claimDownloadTicket, markDownloadTicketConsumed, releaseDownloadTicket } from "@/lib/download-ticket-store";
import { hashDownloadToken, isValidDownloadToken } from "@/lib/download-token";
import { openGoogleDriveMediaStream } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The current Vercel project is on Hobby; its per-function cap is 300 seconds.
export const maxDuration = 300;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, private, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}

function encodeFileName(fileName: string): string {
  return encodeURIComponent(fileName).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("A valid download authorization is required.", 400);
  }
  const rawTicket = form.get("ticket");
  const ticket = typeof rawTicket === "string" ? rawTicket : "";
  if (!isValidDownloadToken(ticket)) {
    return errorResponse("A valid download authorization is required.", 400);
  }

  const ticketHash = hashDownloadToken(ticket);
  let claim: { productId: string } | null;
  try {
    claim = await claimDownloadTicket(ticketHash);
  } catch {
    return errorResponse("Secure download authorization is temporarily unavailable.", 503);
  }
  if (!claim) {
    return errorResponse("This download authorization has expired, is already in use, or has been fulfilled.", 410);
  }

  const product = getProductById(claim.productId);
  if (!product?.googleDriveFileId) {
    await releaseDownloadTicket(ticketHash).catch(() => undefined);
    return errorResponse("The purchased file is not configured for secure delivery.", 503);
  }

  let media;
  try {
    media = await openGoogleDriveMediaStream(product.googleDriveFileId);
  } catch (error) {
    console.error("Google Drive stream could not be opened:", error instanceof Error ? error.name : "unknown error");
    await releaseDownloadTicket(ticketHash).catch(() => undefined);
    return errorResponse("The file could not be opened for delivery. Please try again before the authorization expires.", 502);
  }

  const source = Readable.toWeb(media.stream) as ReadableStream<Uint8Array>;
  const reader = source.getReader();
  let finalized = false;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await reader.read();
        if (result.done) {
          finalized = true;
          try {
            await markDownloadTicketConsumed(ticketHash);
          } catch {
            console.error("Download ticket completion could not be persisted.");
          }
          controller.close();
          return;
        }
        controller.enqueue(result.value);
      } catch {
        if (!finalized) {
          finalized = true;
          await releaseDownloadTicket(ticketHash).catch(() => undefined);
        }
        controller.error(new Error("The file stream ended unexpectedly."));
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        if (!finalized) {
          finalized = true;
          await releaseDownloadTicket(ticketHash).catch(() => undefined);
        }
      }
    },
  });

  const contentType = product.fileName.toLowerCase().endsWith(".apk")
    ? "application/vnd.android.package-archive"
    : "application/pdf";
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(product.fileName)}`,
    "Cache-Control": "no-store, private, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  if (media.contentLength && /^\d+$/.test(media.contentLength)) {
    headers.set("Content-Length", media.contentLength);
  }

  return new NextResponse(body, { status: 200, headers });
}
