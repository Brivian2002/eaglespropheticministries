import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveProducts: vi.fn(),
  isProductDeliveryReady: vi.fn(),
  issueDownloadTicket: vi.fn(),
  verifyPaystackProductPurchase: vi.fn(),
  isPreviewDeployment: vi.fn(),
  isStagingVerificationBuild: vi.fn(),
}));

vi.mock("@/lib/product-config", () => ({
  getActiveProducts: mocks.getActiveProducts,
  isProductDeliveryReady: mocks.isProductDeliveryReady,
}));
vi.mock("@/lib/download-ticket-store", () => ({
  issueDownloadTicket: mocks.issueDownloadTicket,
}));
vi.mock("@/lib/paystack-verification", () => ({
  verifyPaystackProductPurchase: mocks.verifyPaystackProductPurchase,
}));
vi.mock("@/lib/staging", () => ({
  isPreviewDeployment: mocks.isPreviewDeployment,
  isStagingVerificationBuild: mocks.isStagingVerificationBuild,
}));

import { NextRequest } from "next/server";
import { GET } from "./route";

const pdf = {
  id: "the-endtimes-prophetic-guide-pdf",
  title: "Guide PDF",
  category: "pdf",
  googleDriveFileId: "test-private-drive-id",
};
const android = {
  id: "the-endtimes-prophetic-guide-android-app",
  title: "Android app bundle",
  category: "android-app-bundle",
  googleDriveFileId: "test-private-apk-id",
};

const originalSecret = process.env.PAYSTACK_SECRET_KEY;

function request(reference?: string) {
  const url = new URL("https://bookstore.test/api/download/verify");
  if (reference !== undefined) url.searchParams.set("reference", reference);
  return new NextRequest(url);
}

function setReady(ids: string[]) {
  mocks.isProductDeliveryReady.mockImplementation((product: { id: string }) => ids.includes(product.id));
}

describe("GET /api/download/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = "sk_test_mock_only";
    vi.stubEnv("NODE_ENV", "production");
    mocks.getActiveProducts.mockReturnValue([pdf, android]);
    mocks.isPreviewDeployment.mockReturnValue(false);
    mocks.isStagingVerificationBuild.mockReturnValue(false);
    setReady([pdf.id]);
    mocks.verifyPaystackProductPurchase.mockResolvedValue(pdf);
    mocks.issueDownloadTicket.mockResolvedValue({
      token: "opaque-test-ticket-token",
      expiresAt: "2026-11-23T20:00:00.000Z",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = originalSecret;
  });

  it("rejects malformed references before contacting the payment verifier", async () => {
    const response = await GET(request("../bad reference"));
    expect(response.status).toBe(400);
    expect(mocks.verifyPaystackProductPurchase).not.toHaveBeenCalled();
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
  });

  it("blocks live payment verification on the staging branch", async () => {
    mocks.isStagingVerificationBuild.mockReturnValue(true);
    const response = await GET(request("mock_ref_stage"));
    expect(response.status).toBe(503);
    expect(mocks.verifyPaystackProductPurchase).not.toHaveBeenCalled();
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("fails closed when the payment-verification key is absent", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const response = await GET(request("mock_ref_001"));
    expect(response.status).toBe(503);
    expect(mocks.verifyPaystackProductPurchase).not.toHaveBeenCalled();
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
  });

  it("does not issue a ticket when Paystack does not confirm payment", async () => {
    mocks.verifyPaystackProductPurchase.mockResolvedValue(null);
    const response = await GET(request("mock_ref_002"));
    expect(response.status).toBe(402);
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).not.toHaveProperty("ticket");
  });

  it("does not issue an Android ticket when the release gate is closed", async () => {
    setReady([pdf.id]);
    mocks.verifyPaystackProductPurchase.mockResolvedValue(android);
    const response = await GET(request("mock_ref_003"));
    expect(mocks.verifyPaystackProductPurchase).toHaveBeenCalledWith(
      "mock_ref_003",
      "sk_test_mock_only",
      [pdf],
    );
    expect(response.status).toBe(503);
    expect(mocks.issueDownloadTicket).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("issues a short-lived PDF ticket only after verified payment and sets a strict HttpOnly cookie", async () => {
    const response = await GET(request("mock_ref_004"));
    expect(response.status).toBe(200);
    expect(mocks.verifyPaystackProductPurchase).toHaveBeenCalledWith(
      "mock_ref_004",
      "sk_test_mock_only",
      [pdf],
    );
    expect(mocks.issueDownloadTicket).toHaveBeenCalledWith("mock_ref_004", pdf.id, 15 * 60);
    const body = await response.json();
    expect(body).toMatchObject({ success: true, ticket: "opaque-test-ticket-token", productTitle: pdf.title });
    expect(JSON.stringify(body)).not.toContain("test-private-drive-id");
    expect(JSON.stringify(body)).not.toContain("test-private-apk-id");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=strict");
    expect(cookie).toContain("Path=/api/download");
    expect(cookie).toContain("Secure");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("sets the Android authorization lifetime to two hours when the release is ready", async () => {
    setReady([android.id]);
    mocks.getActiveProducts.mockReturnValue([android]);
    mocks.verifyPaystackProductPurchase.mockResolvedValue(android);
    const response = await GET(request("mock_ref_005"));
    expect(response.status).toBe(200);
    expect(mocks.issueDownloadTicket).toHaveBeenCalledWith("mock_ref_005", android.id, 2 * 60 * 60);
  });

  it("does not return a cookie when the payment reference already has a fulfilled ticket", async () => {
    mocks.issueDownloadTicket.mockResolvedValue(null);
    const response = await GET(request("mock_ref_006"));
    expect(response.status).toBe(409);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
