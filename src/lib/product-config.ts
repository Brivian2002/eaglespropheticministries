import "server-only";

/**
 * Server-only catalog for local Paystack sales. File IDs must never be exposed
 * to the browser or returned from the products API.
 */
export interface ProductConfig {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: "GHS";
  coverImage: string;
  category: "pdf" | "android-app-bundle";
  isActive: boolean;
  googleDriveFileId?: string;
  fileName: string;
  contents: string[];
  fulfillmentNote?: string;
}

const PRODUCTS: ProductConfig[] = [
  {
    id: "the-endtimes-prophetic-guide-pdf",
    title: "THE ENDTIMES PROPHETIC GUIDE — PDF only",
    slug: "the-endtimes-prophetic-guide-pdf",
    description:
      "A digital PDF edition of Prophet Gabriel Christ Alorgo’s teaching on understanding biblical end-times prophecies.",
    price: 16000,
    currency: "GHS",
    coverImage: "/images/EPMBook.jpg",
    category: "pdf",
    isActive: true,
    googleDriveFileId: process.env.GOOGLE_DRIVE_FILE_ID,
    fileName: "THE_ENDTIMES_PROPHETIC_GUIDE.pdf",
    contents: ["Full book in PDF format"],
  },
  {
    id: "the-endtimes-prophetic-guide-android-app",
    title: "Android app bundle — book PDF + audiobook",
    slug: "the-endtimes-prophetic-guide-android-app",
    description:
      "The Android app bundle contains both the complete book PDF and its audiobook inside the app for reading and listening.",
    price: 20000,
    currency: "GHS",
    coverImage: "/images/EPMBook.jpg",
    category: "android-app-bundle",
    isActive: true,
    googleDriveFileId: process.env.EPM_ANDROID_APP_FILE_ID,
    fileName: "EaglesPropheticMinistries-review.apk",
    contents: ["Android app", "Complete book PDF inside the app", "Audiobook inside the app"],
    fulfillmentNote:
      "Customer release pending: the current APK is debug-signed for review and is not available for purchase. Approximately 1.06 GB.",
  },
];

export function getProductById(id: string): ProductConfig | undefined {
  return PRODUCTS.find((product) => product.id === id && product.isActive);
}

/** Fails closed unless every paid item has its private file and is approved for sale. */
export function isProductDeliveryReady(product: ProductConfig): boolean {
  if (!product.googleDriveFileId) return false;
  if (product.category === "android-app-bundle" && process.env.EPM_ANDROID_APP_RELEASE_READY !== "true") {
    return false;
  }
  return true;
}

export function getActiveProducts(): ProductConfig[] {
  return PRODUCTS.filter((product) => product.isActive);
}
