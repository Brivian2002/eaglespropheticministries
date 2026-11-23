import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { GET as streamDownload } from "@/app/api/download/stream/route";
import {
  deleteStagingTestTicket,
  getDownloadTicketState,
  issueDownloadTicket,
} from "@/lib/download-ticket-store";
import { hashDownloadToken } from "@/lib/download-token";
import { getGoogleDriveFileSize } from "@/lib/google-drive";
import { getActiveProducts, getProductById, isProductDeliveryReady } from "@/lib/product-config";
import { isStagingVerificationBuild } from "@/lib/staging";
import { verifyPaystackProductPurchase } from "@/lib/paystack-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANDROID_PRODUCT_ID = "the-endtimes-prophetic-guide-android-app";
const MOCK_SECRET = "staging-mock-only-not-a-credential";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getSanitizedDriveFailure(error: unknown, fileId: string) {
  const root = asRecord(error);
  const apiResponse = asRecord(root?.response);
  const payload = asRecord(apiResponse?.data);
  const apiError = asRecord(payload?.error);
  const candidateStatus = apiResponse?.status ?? apiError?.code;
  const httpStatus =
    typeof candidateStatus === "number" && Number.isInteger(candidateStatus) && candidateStatus >= 100 && candidateStatus <= 599
      ? candidateStatus
      : null;
  const apiStatus = typeof apiError?.status === "string" ? apiError.status.slice(0, 64) : null;
  const providerMessage = typeof apiError?.message === "string" ? apiError.message : "Google Drive metadata request failed.";
  const message = providerMessage
    .replaceAll(fileId, "[redacted file ID]")
    .replace(/-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----/g, "[redacted credential]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, "[redacted credential]")
    .replace(/([?&](?:access_token|token|key)=)[^&\s]*/gi, "$1[redacted]")
    .slice(0, 500);

  return { httpStatus, apiStatus, message };
}

/**
 * One-request, branch-only smoke test. Paystack is replaced with an injected
 * mock and the ticket store uses ephemeral memory on this branch. The only
 * external service accessed is Drive metadata/media with the existing
 * read-only service identity.
 */
export async function GET(request: NextRequest) {
  if (!isStagingVerificationBuild()) return response({ error: "Not found." }, 404);

  const product = getProductById(ANDROID_PRODUCT_ID);
  if (!product?.googleDriveFileId || !isProductDeliveryReady(product)) {
    return response({ success: false, error: "Private Android source is not configured for staging." }, 503);
  }

  const reference = `staging-mock-${randomUUID()}`;
  let mockPaymentVerified = false;
  let ticketIssued = false;
  let privateDriveRead = false;
  let ticketConsumed = false;
  let replayBlocked = false;
  let cleanupCompleted = true;
  let driveAccessDiagnostic: {
    serviceAccountEmail: string | null;
    httpStatus: number | null;
    apiStatus: string | null;
    message: string;
  } | null = null;

  try {
    const fetcher: typeof fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : input.toString();
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      const expectedUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
      if (url !== expectedUrl || headers.get("authorization") !== `Bearer ${MOCK_SECRET}`) {
        return new Response(JSON.stringify({ status: false }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          status: true,
          data: {
            status: "success",
            reference,
            amount: product.price,
            currency: product.currency,
            metadata: { product_id: product.id },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const readyProducts = getActiveProducts().filter(isProductDeliveryReady);
    const verified = await verifyPaystackProductPurchase(reference, MOCK_SECRET, readyProducts, fetcher);
    if (!verified || verified.id !== product.id) throw new Error("Mock verification failed.");
    mockPaymentVerified = true;

    let size: number;
    try {
      size = await getGoogleDriveFileSize(product.googleDriveFileId);
    } catch (error) {
      driveAccessDiagnostic = {
        serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || null,
        ...getSanitizedDriveFailure(error, product.googleDriveFileId),
      };
      throw error;
    }
    const issued = await issueDownloadTicket(reference, product.id, 10 * 60, size - 1);
    if (!issued) throw new Error("Mock ticket issuance failed.");
    ticketIssued = true;
    cleanupCompleted = false;

    const streamRequest = new NextRequest(new URL("/api/download/stream", request.url), {
      headers: {
        cookie: `epm_download_auth=${issued.token}`,
        range: `bytes=${size - 1}-${size - 1}`,
      },
    });
    const streamResponse = await streamDownload(streamRequest);
    const streamedBytes = await streamResponse.arrayBuffer();
    privateDriveRead = streamResponse.status === 206 && streamedBytes.byteLength === 1;
    ticketConsumed = (await getDownloadTicketState(hashDownloadToken(issued.token))) === "consumed";
    const replayResponse = await streamDownload(streamRequest);
    replayBlocked = replayResponse.status === 410;
  } catch {
    // Keep internal IDs, credentials, Drive metadata, and provider errors out of the response.
  } finally {
    if (ticketIssued) {
      try {
        await deleteStagingTestTicket(reference);
        cleanupCompleted = true;
      } catch {
        cleanupCompleted = false;
      }
    }
  }

  const success =
    mockPaymentVerified && ticketIssued && privateDriveRead && ticketConsumed && replayBlocked && cleanupCompleted;
  return response(
    {
      success,
      mockPaymentVerified,
      ticketIssued,
      privateDriveRead,
      ticketConsumed,
      replayBlocked,
      cleanupCompleted,
      ...(driveAccessDiagnostic ? { driveAccessDiagnostic } : {}),
    },
    success ? 200 : 502,
  );
}
