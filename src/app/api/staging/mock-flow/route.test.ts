import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProductById: vi.fn(),
  getActiveProducts: vi.fn(),
  isProductDeliveryReady: vi.fn(),
  getGoogleDriveFileSize: vi.fn(),
  issueDownloadTicket: vi.fn(),
  getDownloadTicketState: vi.fn(),
  deleteStagingTestTicket: vi.fn(),
  hashDownloadToken: vi.fn(),
  isStagingVerificationBuild: vi.fn(),
  streamDownload: vi.fn(),
}));

vi.mock("@/lib/product-config", () => ({
  getProductById: mocks.getProductById,
  getActiveProducts: mocks.getActiveProducts,
  isProductDeliveryReady: mocks.isProductDeliveryReady,
}));
vi.mock("@/lib/google-drive", () => ({
  getGoogleDriveFileSize: mocks.getGoogleDriveFileSize,
}));
vi.mock("@/lib/download-ticket-store", () => ({
  issueDownloadTicket: mocks.issueDownloadTicket,
  getDownloadTicketState: mocks.getDownloadTicketState,
  deleteStagingTestTicket: mocks.deleteStagingTestTicket,
}));
vi.mock("@/lib/download-token", () => ({
  hashDownloadToken: mocks.hashDownloadToken,
}));
vi.mock("@/lib/staging", () => ({
  isStagingVerificationBuild: mocks.isStagingVerificationBuild,
}));
vi.mock("@/app/api/download/stream/route", () => ({
  GET: mocks.streamDownload,
}));

import { NextRequest } from "next/server";
import { GET } from "./route";

const android = {
  id: "the-endtimes-prophetic-guide-android-app",
  title: "Android app bundle",
  category: "android-app-bundle",
  price: 20000,
  currency: "GHS",
  isActive: true,
  googleDriveFileId: "test-private-apk-id",
  fileName: "private-test.apk",
};

function request() {
  return new NextRequest("https://staging.example.vercel.app/api/staging/mock-flow");
}

describe("GET /api/staging/mock-flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_CLIENT_EMAIL", "staging-reader@example.iam.gserviceaccount.com");
    mocks.isStagingVerificationBuild.mockReturnValue(true);
    mocks.getProductById.mockReturnValue(android);
    mocks.getActiveProducts.mockReturnValue([android]);
    mocks.isProductDeliveryReady.mockReturnValue(true);
    mocks.getGoogleDriveFileSize.mockResolvedValue(100);
    mocks.issueDownloadTicket.mockResolvedValue({
      token: "ephemeral-test-ticket",
      expiresAt: "2026-11-23T20:00:00.000Z",
    });
    mocks.getDownloadTicketState.mockResolvedValue("consumed");
    mocks.deleteStagingTestTicket.mockResolvedValue(undefined);
    mocks.hashDownloadToken.mockReturnValue("hashed-test-token");
    mocks.streamDownload
      .mockResolvedValueOnce(new Response(new Uint8Array([7]), { status: 206 }))
      .mockResolvedValueOnce(new Response(null, { status: 410 }));
  });

  it("runs only on the staging branch", async () => {
    mocks.isStagingVerificationBuild.mockReturnValue(false);
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(mocks.getGoogleDriveFileSize).not.toHaveBeenCalled();
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
  });

  it("mock-verifies, streams one byte from private Drive, consumes the ticket, blocks replay, and cleans up", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await GET(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      mockPaymentVerified: true,
      ticketIssued: true,
      privateDriveRead: true,
      ticketConsumed: true,
      replayBlocked: true,
      cleanupCompleted: true,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.getGoogleDriveFileSize).toHaveBeenCalledWith(android.googleDriveFileId);
    expect(mocks.issueDownloadTicket).toHaveBeenCalledWith(expect.stringMatching(/^staging-mock-/), android.id, 600, 99);
    expect(mocks.streamDownload).toHaveBeenCalledTimes(2);
    const streamRequest = mocks.streamDownload.mock.calls[0][0] as NextRequest;
    expect(streamRequest.headers.get("range")).toBe("bytes=99-99");
    expect(streamRequest.cookies.get("epm_download_auth")?.value).toBe("ephemeral-test-ticket");
    const reference = mocks.issueDownloadTicket.mock.calls[0][0];
    expect(mocks.deleteStagingTestTicket).toHaveBeenCalledWith(reference);
    expect(mocks.hashDownloadToken).toHaveBeenCalledWith("ephemeral-test-ticket");
    expect(mocks.getDownloadTicketState).toHaveBeenCalledWith("hashed-test-token");
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("test-private-apk-id");
    expect(serialized).not.toContain("private-test.apk");
    expect(serialized).not.toContain("ephemeral-test-ticket");
  });

  it("returns sanitized Drive denial details without exposing the private file ID or credential", async () => {
    mocks.getGoogleDriveFileSize.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: {
            code: 403,
            status: "PERMISSION_DENIED",
            message: `Permission denied for ${android.googleDriveFileId}. Bearer test_access_token`,
          },
        },
      },
    });

    const response = await GET(request());
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.driveAccessDiagnostic).toEqual({
      serviceAccountEmail: "staging-reader@example.iam.gserviceaccount.com",
      httpStatus: 403,
      apiStatus: "PERMISSION_DENIED",
      message: "Permission denied for [redacted file ID]. Bearer [redacted]",
    });
    expect(JSON.stringify(body)).not.toContain(android.googleDriveFileId);
    expect(JSON.stringify(body)).not.toContain("test_access_token");
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
  });

  it("propagates a sanitized media-stream denial and does not retry or replay a failed read", async () => {
    const diagnostic = {
      serviceAccountEmail: "staging-reader@example.iam.gserviceaccount.com",
      httpStatus: 403,
      apiStatus: "PERMISSION_DENIED",
      message: "Permission denied for [redacted file ID].",
    };
    mocks.streamDownload.mockReset();
    mocks.streamDownload.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "The file could not be opened.", driveAccessDiagnostic: diagnostic }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(request());
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.driveAccessDiagnostic).toEqual(diagnostic);
    expect(body.privateDriveRead).toBe(false);
    expect(body.replayBlocked).toBe(false);
    expect(mocks.streamDownload).toHaveBeenCalledTimes(1);
    expect(mocks.deleteStagingTestTicket).toHaveBeenCalledTimes(1);
  });
});
