import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";

let cache;
function products() {
  cache ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", "products.json"), "utf8"));
  return cache;
}

const num = (v) => {
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

// the raw API payload names the variant list `product_variants`
const variantsOf = (p) =>
  (p.product_variants ?? p.variants ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    discountPercent: v.discountPercent,
    option1: v.option1,
    option2: v.option2,
    option3: v.option3,
    imageUrl: v.imageUrl,
    inStock: v.inStock,
  }));

// slim product used inside rails (keeps the client payload small)
const railProduct = (p) => ({
  id: p.id,
  title: p.title,
  vendor: p.vendor,
  featuredImageUrl: p.featuredImageUrl,
  imageUrl: p.featuredImageUrl,
  price: num(p.price),
  compareAtPrice: num(p.compareAtPrice),
  discountPercent: p.discountPercent ?? null,
  rating: p.rating ?? null,
  attributes: p.attributes?.Brand ? { Brand: p.attributes.Brand } : undefined,
  productType: p.productType,
  variants: variantsOf(p),
});

function normalize(raw) {
  const { product_variants, recentlyViewedProducts, productRails, ...rest } = raw;
  return {
    ...rest,
    price: num(raw.price),
    compareAtPrice: num(raw.compareAtPrice),
    imageUrl: raw.featuredImageUrl,
    variants: variantsOf(raw),
    productRails: (productRails ?? []).map((r) => ({ title: r.title, products: (r.products ?? []).map(railProduct) })),
  };
}

export function generateStaticParams() {
  return Object.keys(products()).map((id) => ({ id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = products()[id];
  if (!p) return {};
  return { title: `${p.title} | ${p.vendor || "PARQIS"}`, description: p.description?.slice(0, 160) };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const raw = products()[id];
  if (!raw) notFound();
  return <ProductDetail product={normalize(raw)} />;
}
