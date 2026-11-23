import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { GET as streamDownload } from "@/app/api/download/stream/route";
import {
  deleteStagingTestTicket,
  getDownloadTicketState,
  issueDownloadTicket,
} from "@/lib/download-ticket-store";
import {
  getSanitizedGoogleDriveFailure,
  type GoogleDriveFailureDiagnostic,
} from "@/lib/google-drive-diagnostics";
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

function asDriveDiagnostic(value: unknown): GoogleDriveFailureDiagnostic | null {
  if (!value || typeof value !== "object") return null;
  const diagnostic = (value as { driveAccessDiagnostic?: unknown }).driveAccessDiagnostic;
  if (!diagnostic || typeof diagnostic !== "object") return null;
  const candidate = diagnostic as Partial<GoogleDriveFailureDiagnostic>;
  if (
    !(typeof candidate.serviceAccountEmail === "string" || candidate.serviceAccountEmail === null) ||
    !(typeof candidate.httpStatus === "number" || candidate.httpStatus === null) ||
    !(typeof candidate.apiStatus === "string" || candidate.apiStatus === null) ||
    typeof candidate.message !== "string"
  ) return null;
  return candidate as GoogleDriveFailureDiagnostic;
}

function asDriveDiagnosticFromStreamError(error: unknown): GoogleDriveFailureDiagnostic | null {
  if (!(error instanceof Error)) return null;
  try {
    return asDriveDiagnostic(JSON.parse(error.message));
  } catch {
    return null;
  }
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
      driveAccessDiagnostic = getSanitizedGoogleDriveFailure(error, product.googleDriveFileId);
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
    if (streamResponse.status >= 400) {
      const errorBody = await streamResponse.clone().json().catch(() => null);
      driveAccessDiagnostic = asDriveDiagnostic(errorBody) ?? driveAccessDiagnostic;
    }
    let streamedBytes = new ArrayBuffer(0);
    try {
      streamedBytes = await streamResponse.arrayBuffer();
    } catch (error) {
      driveAccessDiagnostic = asDriveDiagnosticFromStreamError(error) ?? driveAccessDiagnostic;
    }
    privateDriveRead = streamResponse.status === 206 && streamedBytes.byteLength === 1;
    ticketConsumed = (await getDownloadTicketState(hashDownloadToken(issued.token))) === "consumed";
    if (privateDriveRead && ticketConsumed) {
      const replayResponse = await streamDownload(streamRequest);
      replayBlocked = replayResponse.status === 410;
    }
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
