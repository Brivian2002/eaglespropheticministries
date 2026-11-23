import { NextResponse } from "next/server";
import { ensureDownloadTicketSchema } from "@/lib/download-ticket-store";
import { getSafeDatabaseErrorSummary } from "@/lib/safe-database-error";

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
    console.error("Fulfillment readiness schema check failed.", getSafeDatabaseErrorSummary(error));
    return response(false, 503);
  }
}
