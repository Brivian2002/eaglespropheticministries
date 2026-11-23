import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";

const mocks = vi.hoisted(() => ({
  getProductById: vi.fn(),
  isProductDeliveryReady: vi.fn(),
  getDownloadTicketProductId: vi.fn(),
  claimDownloadTicket: vi.fn(),
  markDownloadTicketConsumed: vi.fn(),
  releaseDownloadTicket: vi.fn(),
  hashDownloadToken: vi.fn(),
  isValidDownloadToken: vi.fn(),
  getGoogleDriveFileSize: vi.fn(),
  openGoogleDriveMediaStream: vi.fn(),
  parseByteRange: vi.fn(),
  isStagingVerificationBuild: vi.fn(),
}));

vi.mock("@/lib/product-config", () => ({
  getProductById: mocks.getProductById,
  isProductDeliveryReady: mocks.isProductDeliveryReady,
}));
vi.mock("@/lib/download-ticket-store", () => ({
  getDownloadTicketProductId: mocks.getDownloadTicketProductId,
  claimDownloadTicket: mocks.claimDownloadTicket,
  markDownloadTicketConsumed: mocks.markDownloadTicketConsumed,
  releaseDownloadTicket: mocks.releaseDownloadTicket,
}));
vi.mock("@/lib/download-token", () => ({
  hashDownloadToken: mocks.hashDownloadToken,
  isValidDownloadToken: mocks.isValidDownloadToken,
}));
vi.mock("@/lib/google-drive", () => ({
  getGoogleDriveFileSize: mocks.getGoogleDriveFileSize,
  openGoogleDriveMediaStream: mocks.openGoogleDriveMediaStream,
}));
vi.mock("@/lib/byte-range", () => ({ parseByteRange: mocks.parseByteRange }));
vi.mock("@/lib/staging", () => ({ isStagingVerificationBuild: mocks.isStagingVerificationBuild }));

import { NextRequest } from "next/server";
import { GET } from "./route";

const product = {
  id: "sample-product",
  title: "Sample PDF",
  fileName: "sample.pdf",
  googleDriveFileId: "private-drive-id",
};

function makeRequest(range?: string) {
  return new NextRequest("https://example.test/api/download/stream", {
    headers: {
      cookie: "epm_download_auth=valid-token",
      ...(range ? { range } : {}),
    },
  });
}

describe("GET /api/download/stream", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_CLIENT_EMAIL", "staging-reader@example.iam.gserviceaccount.com");
    mocks.isStagingVerificationBuild.mockReturnValue(false);
    mocks.isValidDownloadToken.mockReturnValue(true);
    mocks.hashDownloadToken.mockReturnValue("hashed-ticket");
    mocks.getDownloadTicketProductId.mockResolvedValue(product.id);
    mocks.claimDownloadTicket.mockResolvedValue({ productId: product.id, leaseId: "lease-1" });
    mocks.getProductById.mockReturnValue(product);
    mocks.isProductDeliveryReady.mockReturnValue(true);
    mocks.getGoogleDriveFileSize.mockResolvedValue(1024);
    mocks.markDownloadTicketConsumed.mockResolvedValue(undefined);
    mocks.releaseDownloadTicket.mockResolvedValue(undefined);
    mocks.parseByteRange.mockReturnValue({ kind: "none" });
    mocks.openGoogleDriveMediaStream.mockImplementation(async (_fileId: string, range?: string) => ({
      stream: Readable.from([Buffer.from(range?.includes("1020") ? "last" : "chunk")]),
      contentType: "application/pdf",
      status: range ? 206 : 200,
    }));
  });

  it("returns a private partial response with the requested range", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 5, end: 9 });
    const response = await GET(makeRequest("bytes=5-9"));
    expect(response.status).toBe(206);
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-range")).toBe("bytes 5-9/1024");
    expect(response.headers.get("content-length")).toBe("5");
    expect(await response.text()).toBe("chunk");
    expect(mocks.claimDownloadTicket).toHaveBeenCalledWith("hashed-ticket", 5, 9, 1024);
    expect(mocks.openGoogleDriveMediaStream).toHaveBeenCalledWith("private-drive-id", "bytes=5-9");
    expect(mocks.releaseDownloadTicket).toHaveBeenCalledWith("hashed-ticket", "lease-1", 10);
    expect(mocks.markDownloadTicketConsumed).not.toHaveBeenCalled();
  });

  it("consumes the short-lived authorization after the final byte range completes", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 1020, end: 1023 });
    const response = await GET(makeRequest("bytes=1020-1023"));
    expect(response.status).toBe(206);
    expect(await response.text()).toBe("last");
    expect(mocks.markDownloadTicketConsumed).toHaveBeenCalledWith("hashed-ticket", "lease-1", 1024);
  });

  it("rejects an unsatisfiable range without opening the private file", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "invalid" });
    const response = await GET(makeRequest("bytes=1024-"));
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */1024");
    expect(mocks.openGoogleDriveMediaStream).not.toHaveBeenCalled();
    expect(mocks.claimDownloadTicket).not.toHaveBeenCalled();
    expect(mocks.releaseDownloadTicket).not.toHaveBeenCalled();
  });

  it("rejects a parallel claim before opening the file", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 0, end: 10 });
    mocks.claimDownloadTicket.mockResolvedValueOnce(null);
    const response = await GET(makeRequest("bytes=0-10"));
    expect(response.status).toBe(409);
    expect(mocks.openGoogleDriveMediaStream).not.toHaveBeenCalled();
  });

  it("persists the next sequential offset when a client resumes after cancellation", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 20, end: 29 });
    const response = await GET(makeRequest("bytes=20-29"));
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    await reader!.read();
    await reader!.cancel();
    expect(mocks.releaseDownloadTicket).toHaveBeenCalledWith("hashed-ticket", "lease-1", 25);
  });

  it("returns sanitized provider details for a staging media denial", async () => {
    mocks.isStagingVerificationBuild.mockReturnValue(true);
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 5, end: 9 });
    mocks.openGoogleDriveMediaStream.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          error: {
            code: 403,
            status: "PERMISSION_DENIED",
            message: "Permission denied for private-drive-id. Bearer test_access_token",
          },
        },
      },
    });

    const response = await GET(makeRequest("bytes=5-9"));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.driveAccessDiagnostic).toEqual({
      serviceAccountEmail: "staging-reader@example.iam.gserviceaccount.com",
      httpStatus: 403,
      apiStatus: "PERMISSION_DENIED",
      message: "Permission denied for [redacted file ID]. Bearer [redacted]",
    });
    expect(JSON.stringify(body)).not.toContain("private-drive-id");
    expect(JSON.stringify(body)).not.toContain("test_access_token");
  });

  it("keeps provider details out of non-staging stream failures", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 5, end: 9 });
    mocks.openGoogleDriveMediaStream.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { error: { status: "PERMISSION_DENIED", message: "Permission denied for private-drive-id." } },
      },
    });

    const response = await GET(makeRequest("bytes=5-9"));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.driveAccessDiagnostic).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("private-drive-id");
  });

  it("sanitizes a provider error emitted while reading the private media stream", async () => {
    mocks.isStagingVerificationBuild.mockReturnValue(true);
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 1023, end: 1023 });
    const providerError = Object.assign(new Error("Drive media stream failed"), {
      response: {
        status: 403,
        data: {
          error: {
            code: 403,
            status: "PERMISSION_DENIED",
            message: "Permission denied for private-drive-id. Bearer test_access_token",
          },
        },
      },
    });
    const failingStream = Readable.from((async function* () {
      throw providerError;
    })());
    mocks.openGoogleDriveMediaStream.mockResolvedValueOnce({
      stream: failingStream,
      contentType: "application/pdf",
      status: 206,
    });

    const response = await GET(makeRequest("bytes=1023-1023"));
    let streamError: unknown;
    try {
      await response.arrayBuffer();
    } catch (error) {
      streamError = error;
    }
    expect(streamError).toBeInstanceOf(Error);
    const failure = JSON.parse((streamError as Error).message);
    expect(failure.driveAccessDiagnostic).toEqual({
      serviceAccountEmail: "staging-reader@example.iam.gserviceaccount.com",
      httpStatus: 403,
      apiStatus: "PERMISSION_DENIED",
      message: "Permission denied for [redacted file ID]. Bearer [redacted]",
    });
    expect(JSON.stringify(failure)).not.toContain("private-drive-id");
    expect(JSON.stringify(failure)).not.toContain("test_access_token");
  });
});
