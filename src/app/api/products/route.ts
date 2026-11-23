import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/product-config";

export const dynamic = "force-dynamic";

/** Public storefront catalogue; server file identifiers are deliberately omitted. */
export async function GET() {
  const products = getActiveProducts().map((product) => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price,
    currency: product.currency,
    coverImage: product.coverImage,
    category: product.category,
    contents: product.contents,
    fulfillmentNote: product.fulfillmentNote,
    purchasable: Boolean(
      product.googleDriveFileId &&
      process.env.DATABASE_URL &&
      process.env.PAYSTACK_SECRET_KEY,
    ),
  }));

  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "no-store, private, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
