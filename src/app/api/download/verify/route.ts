import { NextRequest, NextResponse } from "next/server";
import { getActiveProducts, isProductDeliveryReady } from "@/lib/product-config";
import { issueDownloadTicket } from "@/lib/download-ticket-store";
import { verifyPaystackProductPurchase } from "@/lib/paystack-verification";
import { isPreviewDeployment, isStagingVerificationBuild } from "@/lib/staging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, private, max-age=0",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
}

export async function GET(request: NextRequest) {
  if (isStagingVerificationBuild() || isPreviewDeployment()) {
    return NextResponse.json(
      { error: "Live payment verification is disabled on staging and preview deployments." },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  const reference = request.nextUrl.searchParams.get("reference")?.trim();
  if (!reference || reference.length > 128 || !/^[A-Za-z0-9_-]+$/.test(reference)) {
    return NextResponse.json(
      { error: "A valid payment reference is required." },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Secure payment verification is temporarily unavailable." },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  try {
    const product = await verifyPaystackProductPurchase(
      reference,
      secretKey,
      getActiveProducts().filter(isProductDeliveryReady),
    );

    if (!product) {
      return NextResponse.json(
        { error: "Payment could not be confirmed for this bookstore item. No download was issued." },
        { status: 402, headers: noStoreHeaders() },
      );
    }

    if (!isProductDeliveryReady(product)) {
      return NextResponse.json(
        { error: "The purchased file is not configured for secure delivery. Please contact the ministry." },
        { status: 503, headers: noStoreHeaders() },
      );
    }

    const ttlSeconds = product.category === "android-app-bundle" ? 2 * 60 * 60 : 15 * 60;
    const issued = await issueDownloadTicket(reference, product.id, ttlSeconds);
    if (!issued) {
      return NextResponse.json(
        { error: "This payment's download authorization is already in use or has been fulfilled." },
        { status: 409, headers: noStoreHeaders() },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        ticket: issued.token,
        productTitle: product.title,
        expiresAt: issued.expiresAt,
      },
      { headers: noStoreHeaders() },
    );
    response.cookies.set("epm_download_auth", issued.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/download",
      expires: new Date(issued.expiresAt),
    });
    return response;
  } catch (error) {
    console.error("Secure download verification failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json(
      { error: "Secure download preparation is temporarily unavailable. Please contact the ministry." },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}
