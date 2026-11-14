// Combined product catalog built from the captured data (see scripts note in PLAN.md).
// The original resolved these through backend APIs; the wishlist and search pages use it instead.
import raw from "@/src/data/catalog.json";

export const catalog = raw;
const byId = new Map(raw.map((p) => [p.id, p]));

export const getProduct = (id) => byId.get(id) ?? null;

// products captured from rails have no variant list: give them one default variant so they can be added
export function withVariants(p) {
  if (p.variants.length > 0) return p;
  return {
    ...p,
    imageUrl: p.featuredImageUrl,
    variants: [{ id: p.id, title: "Default Title", price: String(p.price ?? 0), compareAtPrice: p.compareAtPrice, discountPercent: p.discountPercent, option1: null, option2: null, option3: null, imageUrl: p.featuredImageUrl, inStock: true }],
  };
}

export const isInStock = (p) => p.variants.length === 0 || p.variants.some((v) => v.inStock);
