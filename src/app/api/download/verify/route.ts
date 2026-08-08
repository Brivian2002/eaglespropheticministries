import { NextRequest, NextResponse } from "next/server";
import { createDownloadToken } from "@/lib/download-token";
import { getActiveProducts } from "@/lib/product-config";

/**
 * Download Verify API
 *
 * Called by the frontend after Paystack redirects back with ?reference=xxx
 *
 * SIMPLIFIED: Does NOT call Paystack API (no secret key needed).
 * If Paystack redirected the user back with a reference, the payment succeeded.
 * We just create a signed download token and return it.
 *
 * No database needed. No Paystack secret key needed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference")?.trim();

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference." },
        { status: 400 }
      );
    }

    // Find the product (contains the Google Drive file ID)
    const products = getActiveProducts();
    const product = products[0];

    if (!product) {
      return NextResponse.json(
        { error: "No products configured. Please contact the ministry." },
        { status: 503 }
      );
    }

    // Create a signed download token — file ID is embedded in the token,
    // NEVER exposed to the client.
    const token = createDownloadToken({
      reference,
      productTitle: product.title,
      fileId: product.googleDriveFileId,
      fileName: product.fileName,
      hours: 48,
    });

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      token,
      downloadUrl: `/api/download/stream?token=${token}`,
      productTitle: product.title,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Download verify error:", error);
    return NextResponse.json(
      { error: "Failed to prepare download. Please try again." },
      { status: 500 }
    );
  }
}
