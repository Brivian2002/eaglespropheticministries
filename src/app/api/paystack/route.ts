import { NextRequest, NextResponse } from "next/server";
import { getProductById, isProductDeliveryReady } from "@/lib/product-config";
import { ensureDownloadTicketSchema } from "@/lib/download-ticket-store";
import { getSafeDatabaseErrorSummary } from "@/lib/safe-database-error";
import { isPreviewDeployment, isStagingVerificationBuild } from "@/lib/staging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PaystackInitPayload {
  email?: string;
  amount?: number;
  fullName?: string;
  productId?: string;
  type?: "book" | "donation";
}

export async function POST(request: NextRequest) {
  try {
    if (isStagingVerificationBuild() || isPreviewDeployment()) {
      return NextResponse.json(
        { error: "Checkout is disabled on staging and preview deployments. No payment was started." },
        { status: 503 },
      );
    }
    const body = (await request.json()) as PaystackInitPayload;
    const email = body.email?.trim();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment gateway is not configured for this deployment." },
        { status: 503 },
      );
    }

    const paymentType = body.type ?? (body.productId ? "book" : "donation");
    let productTitle = "Donation";
    let amount = body.amount;
    let productId = "";

    if (paymentType === "book") {
      if (!body.productId) {
        return NextResponse.json({ error: "Choose a bookstore item." }, { status: 400 });
      }
      const product = getProductById(body.productId);
      if (!product) {
        return NextResponse.json({ error: "Product not found or unavailable." }, { status: 404 });
      }
      if (!product.googleDriveFileId) {
        return NextResponse.json(
          { error: "This bookstore item is not configured for secure delivery yet." },
          { status: 503 },
        );
      }
      if (!isProductDeliveryReady(product)) {
        return NextResponse.json(
          { error: "The Android app is review-only until a production-signed release is available. No payment was started." },
          { status: 503 },
        );
      }
      try {
        await ensureDownloadTicketSchema();
      } catch (error) {
        console.error("Secure fulfillment schema initialization failed.", getSafeDatabaseErrorSummary(error));
        return NextResponse.json(
          { error: "Secure fulfillment is not ready, so no payment was started." },
          { status: 503 },
        );
      }
      productTitle = product.title;
      amount = product.price;
      productId = product.id;
    } else if (paymentType === "donation") {
      if (body.productId) {
        return NextResponse.json({ error: "Donations cannot include a bookstore product." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported payment type." }, { status: 400 });
    }

    if (!Number.isInteger(amount) || !amount || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least GHS 1.00." }, { status: 400 });
    }

    const currency = "GHS";
    const customFields: { display_name: string; variable_name: string; value: string }[] = [];
    if (body.fullName?.trim()) {
      customFields.push({
        display_name: "Full Name",
        variable_name: "full_name",
        value: body.fullName.trim().slice(0, 100),
      });
    }
    if (productId) {
      customFields.push({ display_name: "Product ID", variable_name: "product_id", value: productId });
      customFields.push({ display_name: "Product", variable_name: "product_title", value: productTitle });
    }
    customFields.push({ display_name: "Payment Type", variable_name: "payment_type", value: paymentType });

    const callbackBase = process.env.VERCEL_ENV === "production"
      ? "https://eaglespropheticministries.vercel.app"
      : request.nextUrl.origin;
    const paystackBody: Record<string, unknown> = {
      email,
      amount,
      currency,
      metadata: {
        payment_type: paymentType,
        product_id: productId || undefined,
        product_title: productTitle,
        custom_fields: customFields,
      },
    };
    if (paymentType === "book") paystackBody.callback_url = `${callbackBase}/bookstore`;

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackBody),
      cache: "no-store",
    });

    const payload = await paystackResponse.json().catch(() => null);
    const authorizationUrl = payload?.data?.authorization_url;
    const reference = payload?.data?.reference;
    if (
      !paystackResponse.ok ||
      payload?.status !== true ||
      typeof authorizationUrl !== "string" ||
      typeof reference !== "string"
    ) {
      console.error("Paystack initialization was rejected:", paystackResponse.status);
      return NextResponse.json(
        { error: "Payment could not be initialized. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, authorization_url: authorizationUrl, reference });
  } catch (error) {
    console.error("Paystack initialization failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
