import { NextResponse } from "next/server";
import { getActiveProducts, isProductDeliveryReady } from "@/lib/product-config";
import { isPreviewDeployment, isStagingVerificationBuild } from "@/lib/staging";

export const dynamic = "force-dynamic";

/** Public storefront catalogue; server file identifiers are deliberately omitted. */
export async function GET() {
  const checkoutDisabled = isStagingVerificationBuild() || isPreviewDeployment();
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
    releaseReady: product.category !== "android-app-bundle" || process.env.EPM_ANDROID_APP_RELEASE_READY === "true",
    purchasable: !checkoutDisabled && Boolean(
      isProductDeliveryReady(product) &&
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
