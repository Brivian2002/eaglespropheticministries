import type { ProductConfig } from "@/lib/product-config";

export interface PaystackTransaction {
  status?: unknown;
  reference?: unknown;
  amount?: unknown;
  currency?: unknown;
  metadata?: unknown;
}

export interface PaystackEnvelope {
  status?: unknown;
  data?: PaystackTransaction;
}

function extractProductId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;

  if (typeof record.product_id === "string") return record.product_id;
  if (!Array.isArray(record.custom_fields)) return null;

  const field = record.custom_fields.find((item) => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return candidate.variable_name === "product_id";
  }) as Record<string, unknown> | undefined;

  return typeof field?.value === "string" ? field.value : null;
}

/** Returns a product only when the verified transaction is an exact paid match. */
export function resolveVerifiedProduct(
  transaction: PaystackTransaction | undefined,
  requestedReference: string,
  products: readonly ProductConfig[],
): ProductConfig | null {
  if (!transaction) return null;
  if (transaction.status !== "success") return null;
  if (transaction.reference !== requestedReference) return null;
  if (!Number.isInteger(transaction.amount)) return null;

  const productId = extractProductId(transaction.metadata);
  if (!productId) return null;

  const product = products.find((candidate) => candidate.id === productId && candidate.isActive);
  if (!product) return null;
  if (transaction.amount !== product.price) return null;
  if (transaction.currency !== product.currency) return null;

  return product;
}

export async function verifyPaystackProductPurchase(
  reference: string,
  secretKey: string,
  products: readonly ProductConfig[],
  fetcher: typeof fetch = fetch,
): Promise<ProductConfig | null> {
  const response = await fetcher(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    },
  );

  let payload: PaystackEnvelope | null = null;
  try {
    payload = (await response.json()) as PaystackEnvelope;
  } catch {
    return null;
  }

  if (!response.ok || payload?.status !== true) return null;
  return resolveVerifiedProduct(payload.data, reference, products);
}
