import { NextRequest, NextResponse } from "next/server";
import { getDownloadTicketState } from "@/lib/download-ticket-store";
import { hashDownloadToken, isValidDownloadToken } from "@/lib/download-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: Record<string, string>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response({ error: "Invalid authorization." }, 400);
  }
  const ticket = body && typeof body === "object" && "ticket" in body && typeof body.ticket === "string"
    ? body.ticket
    : "";
  if (!isValidDownloadToken(ticket)) {
    return response({ error: "Invalid authorization." }, 400);
  }

  try {
    const state = await getDownloadTicketState(hashDownloadToken(ticket));
    if (!state) return response({ error: "Authorization not found." }, 404);
    return response({ state });
  } catch {
    return response({ error: "Download status is temporarily unavailable." }, 503);
  }
}
