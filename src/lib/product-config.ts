/**
 * Product Configuration
 *
 * Single-source-of-truth for all products. No database needed.
 * To add a new product, just add an entry to the PRODUCTS array.
 */

export interface ProductConfig {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  coverImage: string;
  category: string;
  isActive: boolean;
  googleDriveFileId: string;
  fileName: string;
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: "the-endtimes-prophetic-guide",
    title: "THE ENDTIMES PROPHETIC GUIDE",
    slug: "the-endtimes-prophetic-guide",
    description:
      "A prophetic and teaching material by Prophet Gabriel Christ Alorgo that emphasizes understanding the endtimes prophecies of the Bible. Contains useful guidelines for understanding the Bible in a more prophetic and accurate way through the revelations of the Spirit and backed by scriptures.",
    price: 15000, // GHS 150.00
    currency: "GHS",
    coverImage: "/images/EPMBook.jpg",
    category: "book",
    isActive: true,
    googleDriveFileId: "1IUQPZkxKHx9yE_jZ_7WboLxcDrOQF7T9",
    fileName: "THE_ENDTIMES_PROPHETIC_GUIDE.pdf",
  },
];

/** Find a product by ID */
export function getProductById(id: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Get all active products */
export function getActiveProducts(): ProductConfig[] {
  return PRODUCTS.filter((p) => p.isActive);
}
