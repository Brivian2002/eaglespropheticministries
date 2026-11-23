import { NextResponse } from "next/server";
import { ensureDownloadTicketSchema } from "@/lib/download-ticket-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(ready: boolean, status: number) {
  return NextResponse.json(
    { ready },
    {
      status,
      headers: {
        "Cache-Control": "no-store, private, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}

/** Checks the ticket store only; it never calls Paystack or creates a transaction. */
export async function GET() {
  try {
    await ensureDownloadTicketSchema();
    return response(true, 200);
  } catch (error) {
    const candidate = error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code || "")
      : "";
    const safeCode = /^(?:[A-Z0-9]{5}|E[A-Z0-9]{2,8})$/.test(candidate) ? candidate : "unclassified";
    console.error("Fulfillment readiness schema check failed.", { databaseCode: safeCode });
    return response(false, 503);
  }
}
