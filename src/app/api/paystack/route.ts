import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/product-config";

/**
 * Paystack Payment Initialization
 *
 * Initializes a Paystack transaction. Product data comes from
 * product-config.ts — no database needed.
 *
 * For book purchases, includes a callback_url so Paystack
 * redirects back to the site after payment.
 * Paystack appends ?trxref=REFERENCE to the callback_url.
 */

interface PaystackInitPayload {
  email: string;
  amount?: number;
  fullName?: string;
  productId?: string;
  type?: "book" | "donation";
}

export async function POST(request: NextRequest) {
  try {
    const body: PaystackInitPayload = await request.json();

    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured. Please contact the ministry directly." },
        { status: 503 }
      );
    }

    // Resolve product and amount
    let productTitle = "Donation";
    let amount = body.amount;
    let currency = "GHS";
    let productId = body.productId || "";

    if (body.productId) {
      const product = getProductById(body.productId);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: "Product not found or unavailable." },
          { status: 404 }
        );
      }
      productTitle = product.title;
      amount = product.price;
      currency = product.currency;
    }

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least GHS 1.00" },
        { status: 400 }
      );
    }

    // Build Paystack custom fields
    const customFields: { display_name: string; variable_name: string; value: string }[] = [];
    if (body.fullName) {
      customFields.push({ display_name: "Full Name", variable_name: "full_name", value: body.fullName });
    }
    if (productId) {
      customFields.push({ display_name: "Product ID", variable_name: "product_id", value: productId });
    }
    customFields.push({ display_name: "Product", variable_name: "product_title", value: productTitle });
    customFields.push({ display_name: "Payment Type", variable_name: "payment_type", value: body.type || "book" });

    // For book purchases, redirect back to site after payment
    // Paystack will append ?trxref=REFERENCE to this URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const callbackUrl = body.type === "book" && baseUrl ? baseUrl + "/" : undefined;

    // Call Paystack
    const paystackBody: Record<string, unknown> = {
      email: body.email,
      amount,
      currency,
      metadata: { custom_fields: customFields },
    };

    if (callbackUrl) {
      paystackBody.callback_url = callbackUrl;
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackBody),
    });

    if (!paystackRes.ok) {
      const errText = await paystackRes.text();
      console.error("Paystack API error:", errText);
      return NextResponse.json(
        { error: "Failed to initialize payment. Please try again." },
        { status: 502 }
      );
    }

    const data = await paystackRes.json();

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
