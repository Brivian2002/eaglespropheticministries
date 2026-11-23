import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getProductById, isProductDeliveryReady } from "@/lib/product-config";
import { claimDownloadTicket, markDownloadTicketConsumed, releaseDownloadTicket } from "@/lib/download-ticket-store";
import { hashDownloadToken, isValidDownloadToken } from "@/lib/download-token";
import { getGoogleDriveFileSize, openGoogleDriveMediaStream } from "@/lib/google-drive";
import { parseByteRange } from "@/lib/byte-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The current Vercel Hobby project caps a single function response at 300 seconds.
export const maxDuration = 300;

function errorResponse(message: string, status: number, additionalHeaders?: HeadersInit) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, private, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        ...Object.fromEntries(new Headers(additionalHeaders).entries()),
      },
    },
  );
}

function encodeFileName(fileName: string): string {
  return encodeURIComponent(fileName).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

async function getAuthorizationToken(request: NextRequest): Promise<string> {
  const cookieToken = request.cookies.get("epm_download_auth")?.value;
  if (cookieToken && isValidDownloadToken(cookieToken)) return cookieToken;
  if (request.method !== "POST") return "";

  // Backward compatibility for already-open bookstore pages during a deployment.
  try {
    const form = await request.formData();
    const formToken = form.get("ticket");
    return typeof formToken === "string" && isValidDownloadToken(formToken) ? formToken : "";
  } catch {
    return "";
  }
}

async function streamAuthorizedFile(request: NextRequest) {
  const ticket = await getAuthorizationToken(request);
  if (!ticket) return errorResponse("A valid download authorization is required.", 401);

  const ticketHash = hashDownloadToken(ticket);
  let claim: { productId: string } | null;
  try {
    claim = await claimDownloadTicket(ticketHash);
  } catch {
    return errorResponse("Secure download authorization is temporarily unavailable.", 503);
  }
  if (!claim) {
    return errorResponse("This download authorization has expired or has been fulfilled.", 410);
  }

  const product = getProductById(claim.productId);
  if (!product || !isProductDeliveryReady(product) || !product.googleDriveFileId) {
    await releaseDownloadTicket(ticketHash).catch(() => undefined);
    return errorResponse("The purchased file is not configured for secure delivery.", 503);
  }

  let size: number;
  try {
    size = await getGoogleDriveFileSize(product.googleDriveFileId);
  } catch (error) {
    console.error("Google Drive file metadata could not be opened:", error instanceof Error ? error.name : "unknown error");
    await releaseDownloadTicket(ticketHash).catch(() => undefined);
    return errorResponse("The file could not be prepared for delivery. Please try again before the authorization expires.", 502);
  }

  const parsedRange = parseByteRange(request.headers.get("range"), size);
  if (parsedRange.kind === "invalid") {
    await releaseDownloadTicket(ticketHash).catch(() => undefined);
    return errorResponse("The requested byte range is not available.", 416, {
      "Content-Range": `bytes */${size}`,
      "Accept-Ranges": "bytes",
    });
  }

  const rangeHeader = parsedRange.kind === "range"
    ? `bytes=${parsedRange.start}-${parsedRange.end}`
    : undefined;

  let media;
  try {
    media = await openGoogleDriveMediaStream(product.googleDriveFileId, rangeHeader);
    if (rangeHeader && media.status !== 206) {
      media.stream.destroy();
      throw new Error("Google Drive did not honor the requested byte range.");
    }
  } catch (error) {
    console.error("Google Drive stream could not be opened:", error instanceof Error ? error.name : "unknown error");
    await releaseDownloadTicket(ticketHash).catch(() => undefined);
    return errorResponse("The file could not be opened for delivery. Please try again before the authorization expires.", 502);
  }

  const range = parsedRange.kind === "range" ? parsedRange : null;
  const shouldConsume = !range || range.end === size - 1;
  const source = Readable.toWeb(media.stream) as ReadableStream<Uint8Array>;
  const reader = source.getReader();
  let finalized = false;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await reader.read();
        if (result.done) {
          finalized = true;
          if (shouldConsume) {
            try {
              await markDownloadTicketConsumed(ticketHash);
            } catch {
              console.error("Download ticket completion could not be persisted.");
            }
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
    "Accept-Ranges": "bytes",
  });
  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
  } else {
    headers.set("Content-Length", String(size));
  }

  return new NextResponse(body, { status: range ? 206 : 200, headers });
}

export async function GET(request: NextRequest) {
  return streamAuthorizedFile(request);
}

export async function POST(request: NextRequest) {
  return streamAuthorizedFile(request);
}
