import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveProducts: vi.fn(),
  isProductDeliveryReady: vi.fn(),
  isPreviewDeployment: vi.fn(),
  isStagingVerificationBuild: vi.fn(),
}));

vi.mock("@/lib/product-config", () => ({
  getActiveProducts: mocks.getActiveProducts,
  isProductDeliveryReady: mocks.isProductDeliveryReady,
}));
vi.mock("@/lib/staging", () => ({
  isPreviewDeployment: mocks.isPreviewDeployment,
  isStagingVerificationBuild: mocks.isStagingVerificationBuild,
}));

import { GET } from "./route";

const privatePdfId = "test-private-pdf-id";
const privateApkId = "test-private-apk-id";
const products = [
  {
    id: "the-endtimes-prophetic-guide-pdf",
    title: "Guide PDF",
    slug: "guide-pdf",
    description: "PDF product",
    price: 16000,
    currency: "GHS",
    coverImage: "/cover.jpg",
    category: "pdf",
    contents: ["PDF"],
    googleDriveFileId: privatePdfId,
    fileName: "book.pdf",
  },
  {
    id: "the-endtimes-prophetic-guide-android-app",
    title: "Android app bundle",
    slug: "android-app",
    description: "App product",
    price: 20000,
    currency: "GHS",
    coverImage: "/cover.jpg",
    category: "android-app-bundle",
    contents: ["APK"],
    googleDriveFileId: privateApkId,
    fileName: "release.apk",
  },
];

const originalReleaseReady = process.env.EPM_ANDROID_APP_RELEASE_READY;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalPaystackKey = process.env.PAYSTACK_SECRET_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.EPM_ANDROID_APP_RELEASE_READY;
  process.env.DATABASE_URL = "postgres://localhost/mock";
  process.env.PAYSTACK_SECRET_KEY = "sk_test_mock_only";
  mocks.isPreviewDeployment.mockReturnValue(false);
  mocks.isStagingVerificationBuild.mockReturnValue(false);
  mocks.getActiveProducts.mockReturnValue(products);
  mocks.isProductDeliveryReady.mockImplementation((product: { id: string }) => product.id === products[0].id);
});

afterEach(() => {
  if (originalReleaseReady === undefined) delete process.env.EPM_ANDROID_APP_RELEASE_READY;
  else process.env.EPM_ANDROID_APP_RELEASE_READY = originalReleaseReady;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalPaystackKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = originalPaystackKey;
});

describe("GET /api/products", () => {
  it("omits private file identifiers and keeps the Android item unavailable until the release flag is set", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(privatePdfId);
    expect(serialized).not.toContain(privateApkId);
    expect(serialized).not.toContain("googleDriveFileId");
    expect(serialized).not.toContain("fileName");
    const android = body.products.find((product: { category: string }) => product.category === "android-app-bundle");
    expect(android).toMatchObject({ releaseReady: false, purchasable: false });
  });

  it("keeps all storefront products unavailable on the staging branch", async () => {
    mocks.isStagingVerificationBuild.mockReturnValue(true);
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.products.every((product: { purchasable: boolean }) => !product.purchasable)).toBe(true);
  });
});
