import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";

const mocks = vi.hoisted(() => ({
  getProductById: vi.fn(),
  isProductDeliveryReady: vi.fn(),
  claimDownloadTicket: vi.fn(),
  markDownloadTicketConsumed: vi.fn(),
  releaseDownloadTicket: vi.fn(),
  hashDownloadToken: vi.fn(),
  isValidDownloadToken: vi.fn(),
  getGoogleDriveFileSize: vi.fn(),
  openGoogleDriveMediaStream: vi.fn(),
  parseByteRange: vi.fn(),
}));

vi.mock("@/lib/product-config", () => ({
  getProductById: mocks.getProductById,
  isProductDeliveryReady: mocks.isProductDeliveryReady,
}));
vi.mock("@/lib/download-ticket-store", () => ({
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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isValidDownloadToken.mockReturnValue(true);
    mocks.hashDownloadToken.mockReturnValue("hashed-ticket");
    mocks.claimDownloadTicket.mockResolvedValue({ productId: product.id });
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
    expect(mocks.openGoogleDriveMediaStream).toHaveBeenCalledWith("private-drive-id", "bytes=5-9");
    expect(mocks.markDownloadTicketConsumed).not.toHaveBeenCalled();
  });

  it("consumes the short-lived authorization after the final byte range completes", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "range", start: 1020, end: 1023 });
    const response = await GET(makeRequest("bytes=1020-1023"));
    expect(response.status).toBe(206);
    expect(await response.text()).toBe("last");
    expect(mocks.markDownloadTicketConsumed).toHaveBeenCalledWith("hashed-ticket");
  });

  it("rejects an unsatisfiable range without opening the private file", async () => {
    mocks.parseByteRange.mockReturnValueOnce({ kind: "invalid" });
    const response = await GET(makeRequest("bytes=1024-"));
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */1024");
    expect(mocks.openGoogleDriveMediaStream).not.toHaveBeenCalled();
    expect(mocks.releaseDownloadTicket).toHaveBeenCalledWith("hashed-ticket");
  });
});
