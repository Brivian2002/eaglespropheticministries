import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/product-config";

/**
 * Products API — returns hardcoded product list. No database.
 */
export async function GET() {
  const products = getActiveProducts().map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    price: p.price,
    currency: p.currency,
    coverImage: p.coverImage,
    category: p.category,
    isActive: p.isActive,
  }));

  return NextResponse.json({ products });
}
