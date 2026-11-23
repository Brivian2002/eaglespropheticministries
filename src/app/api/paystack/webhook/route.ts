import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", secretKey).update(rawBody).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "hex");
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }
  if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: unknown; data?: { reference?: unknown } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = typeof event.data?.reference === "string" ? event.data.reference : "unknown";
    console.info("Verified Paystack success notification received:", reference);
  }

  // Download fulfillment remains in the verify endpoint, which checks Paystack's API.
  return NextResponse.json({ received: true });
}
