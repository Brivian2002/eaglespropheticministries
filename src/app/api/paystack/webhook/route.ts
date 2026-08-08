import { NextRequest, NextResponse } from "next/server";

/**
 * Paystack Webhook Handler
 *
 * Logs successful payments. The actual download flow is now:
 * Paystack redirects customer to site → frontend calls /api/download/verify
 * → verifies with Paystack API → issues signed token → auto-download.
 *
 * No database needed. No token created here.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.warn("Paystack webhook: PAYSTACK_SECRET_KEY not configured.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verify HMAC-SHA512 signature
    const crypto = await import("crypto");
    const hash = crypto.createHmac("sha512", secretKey).update(body).digest("hex");
    if (hash !== signature) {
      console.error("Paystack webhook: invalid signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, amount, customer, metadata } = event.data;
      const email = customer?.email;
      const customFields = metadata?.custom_fields || [];
      const getField = (name: string) =>
        customFields.find((f: { variable_name: string }) => f.variable_name === name)?.value;

      console.log(
        "✅ Payment Successful! Ref: " + reference +
        " Amount: " + (amount / 100).toFixed(2) + " GHS" +
        " Customer: " + email +
        " Product: " + (getField("product_title") || "N/A") +
        " Type: " + (getField("payment_type") || "book")
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
