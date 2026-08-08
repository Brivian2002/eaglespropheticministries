import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/download-token";

/**
 * Download Stream API
 *
 * Verifies a signed token and proxies the file from Google Drive
 * using the PUBLIC download URL. No Service Account needed.
 *
 * The Google Drive File ID is NEVER exposed to the client —
 * it lives inside the signed token only.
 */
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Missing download token." },
        { status: 400 }
      );
    }

    const payload = verifyDownloadToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          error:
            "This download link is invalid or has expired. Please contact the ministry at eaglespropheticministries@gmail.com.",
        },
        { status: 403 }
      );
    }

    const fileId = payload.fileId;
    if (!fileId) {
      return NextResponse.json(
        { error: "File not available. Please contact the ministry." },
        { status: 503 }
      );
    }

    const fileName = payload.fileName || "THE_ENDTIMES_PROPHETIC_GUIDE.pdf";

    console.log(`\u2705 Downloading: ${fileName} (ref: ${payload.reference})`);

    // Fetch from Google Drive public download URL (no Service Account needed)
    const driveUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
    const driveResponse = await fetch(driveUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!driveResponse.ok) {
      console.error(`Google Drive returned ${driveResponse.status}`);
      return NextResponse.json(
        { error: "Could not fetch the file. Please try again or contact the ministry." },
        { status: 502 }
      );
    }

    const contentType =
      driveResponse.headers.get("content-type") || "application/pdf";
    const contentLength = driveResponse.headers.get("content-length");

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    // Stream the response body directly to the client
    return new NextResponse(driveResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download stream error:", error);
    return NextResponse.json(
      { error: "An error occurred during download. Please try again or contact the ministry." },
      { status: 500 }
    );
  }
}
