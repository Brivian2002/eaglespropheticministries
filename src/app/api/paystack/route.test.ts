import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProductById: vi.fn(),
  isProductDeliveryReady: vi.fn(),
  ensureDownloadTicketSchema: vi.fn(),
  getSafeDatabaseErrorSummary: vi.fn(),
  isPreviewDeployment: vi.fn(),
  isStagingVerificationBuild: vi.fn(),
}));

vi.mock("@/lib/product-config", () => ({
  getProductById: mocks.getProductById,
  isProductDeliveryReady: mocks.isProductDeliveryReady,
}));
vi.mock("@/lib/download-ticket-store", () => ({
  ensureDownloadTicketSchema: mocks.ensureDownloadTicketSchema,
}));
vi.mock("@/lib/safe-database-error", () => ({
  getSafeDatabaseErrorSummary: mocks.getSafeDatabaseErrorSummary,
}));
vi.mock("@/lib/staging", () => ({
  isPreviewDeployment: mocks.isPreviewDeployment,
  isStagingVerificationBuild: mocks.isStagingVerificationBuild,
}));

import { NextRequest } from "next/server";
import { POST } from "./route";

const android = {
  id: "the-endtimes-prophetic-guide-android-app",
  title: "Android app bundle",
  category: "android-app-bundle",
  googleDriveFileId: "test-private-apk-id",
};
const originalSecret = process.env.PAYSTACK_SECRET_KEY;
const originalDatabaseUrl = process.env.DATABASE_URL;

function request() {
  return new NextRequest("https://bookstore.test/api/paystack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "book",
      productId: android.id,
      email: "buyer@example.test",
    }),
  });
}

describe("POST /api/paystack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = "sk_test_mock_only";
    process.env.DATABASE_URL = "postgres://localhost/mock";
    mocks.getProductById.mockReturnValue(android);
    mocks.isProductDeliveryReady.mockReturnValue(false);
    mocks.isPreviewDeployment.mockReturnValue(false);
    mocks.isStagingVerificationBuild.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = originalSecret;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("keeps Android checkout closed without initializing Paystack or touching the ticket store", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("No payment was started") });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.ensureDownloadTicketSchema).not.toHaveBeenCalled();
  });

  it("blocks every checkout request on the staging branch before touching Paystack or the database", async () => {
    mocks.isStagingVerificationBuild.mockReturnValue(true);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("No payment was started") });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.ensureDownloadTicketSchema).not.toHaveBeenCalled();
  });
});
