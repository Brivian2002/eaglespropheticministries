import { describe, expect, it, vi } from "vitest";
import { resolveVerifiedProduct, verifyPaystackProductPurchase } from "./paystack-verification";
import type { ProductConfig } from "./product-config";

const product: ProductConfig = {
  id: "the-endtimes-prophetic-guide-pdf",
  title: "The Endtimes Prophetic Guide — PDF only",
  slug: "the-endtimes-prophetic-guide-pdf",
  description: "PDF book",
  price: 16000,
  currency: "GHS",
  coverImage: "/images/EPMBook.jpg",
  category: "pdf",
  isActive: true,
  googleDriveFileId: "private-test-file-id",
  fileName: "guide.pdf",
  contents: ["Full book in PDF format"],
};

const validTransaction = {
  status: "success",
  reference: "paystack_test_reference_123",
  amount: 16000,
  currency: "GHS",
  metadata: { product_id: product.id },
};

const reference = "paystack_test_reference_123";

describe("Paystack purchase verification (mock data only)", () => {
  it("accepts only a successful transaction that exactly matches the product", () => {
    expect(resolveVerifiedProduct(validTransaction, reference, [product])).toEqual(product);
  });

  it("rejects a non-successful transaction status", () => {
    expect(resolveVerifiedProduct({ ...validTransaction, status: "pending" }, reference, [product])).toBeNull();
    expect(resolveVerifiedProduct({ ...validTransaction, status: "failed" }, reference, [product])).toBeNull();
  });

  it("rejects an amount mismatch", () => {
    expect(resolveVerifiedProduct({ ...validTransaction, amount: 15999 }, reference, [product])).toBeNull();
  });

  it("rejects a currency mismatch", () => {
    expect(resolveVerifiedProduct({ ...validTransaction, currency: "USD" }, reference, [product])).toBeNull();
  });

  it("rejects a reference mismatch", () => {
    expect(resolveVerifiedProduct(validTransaction, "different_reference", [product])).toBeNull();
  });

  it("rejects an unknown or mismatched product id", () => {
    expect(resolveVerifiedProduct({ ...validTransaction, metadata: { product_id: "unknown-item" } }, reference, [product])).toBeNull();
    expect(resolveVerifiedProduct({ ...validTransaction, metadata: {} }, reference, [product])).toBeNull();
  });

  it("requires Paystack's API envelope and transaction to both report success", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: true, data: validTransaction }), { status: 200 }),
    );
    await expect(verifyPaystackProductPurchase(reference, "sk_test_mock_only", [product], fetcher)).resolves.toEqual(product);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toContain(encodeURIComponent(reference));
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get("authorization")).toBe("Bearer sk_test_mock_only");
  });

  it("rejects an unsuccessful Paystack API envelope even if transaction data claims success", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: false, data: validTransaction }), { status: 200 }),
    );
    await expect(verifyPaystackProductPurchase(reference, "sk_test_mock_only", [product], fetcher)).resolves.toBeNull();
  });
});
