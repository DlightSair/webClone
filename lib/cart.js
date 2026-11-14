"use client";

// Minimal local cart store (the original used a backend guest cart).
import { useSyncExternalStore } from "react";

const KEY = "parqis:cart";
let items = [];
const listeners = new Set();

function load() {
  try {
    items = JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    items = [];
  }
}
let loaded = false;
function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    load();
  }
}
function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

const slimVariant = (v) => ({ id: v.id, title: v.title, price: v.price, compareAtPrice: v.compareAtPrice, discountPercent: v.discountPercent, option1: v.option1, option2: v.option2, option3: v.option3, imageUrl: v.imageUrl, inStock: v.inStock, inventoryQty: v.inventoryQty });
const num = (v) => {
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

export function addToCart(product, variant, qty = 1) {
  ensure();
  const id = variant?.id ?? product.id;
  const existing = items.find((i) => i.variantId === id);
  if (existing) items = items.map((i) => (i.variantId === id ? { ...i, qty: i.qty + qty } : i));
  else {
    const price = num(variant?.price ?? product.price) ?? 0;
    const compare = num(variant?.compareAtPrice ?? product.compareAtPrice);
    items = [
      ...items,
      {
        variantId: id,
        productId: product.id,
        title: product.title,
        vendor: product.vendor ?? null,
        price,
        compareAtPrice: compare && compare > price ? compare : null,
        discountPercent: variant?.discountPercent ?? product.discountPercent ?? null,
        imageUrl: variant?.imageUrl ?? product.imageUrl ?? product.featuredImageUrl ?? null,
        label: variant ? [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" · ") : "",
        option1: variant?.option1 ?? null,
        option2: variant?.option2 ?? null,
        option3: variant?.option3 ?? null,
        option1Name: product.option1Name ?? null,
        option2Name: product.option2Name ?? null,
        option3Name: product.option3Name ?? null,
        inventoryQty: typeof variant?.inventoryQty === "number" ? variant.inventoryQty : undefined,
        rating: product.rating ?? null,
        reviewCount: product.reviewCount ?? null,
        variants: (product.variants ?? product.product_variants ?? []).map(slimVariant),
        qty,
      },
    ];
  }
  emit();
}
// swap the variant of an existing line (cart "Size" selector)
export function changeVariant(oldVariantId, variant) {
  ensure();
  const line = items.find((i) => i.variantId === oldVariantId);
  if (!line || !variant) return;
  const price = num(variant.price) ?? line.price;
  const compare = num(variant.compareAtPrice);
  const next = {
    ...line,
    variantId: variant.id,
    price,
    compareAtPrice: compare && compare > price ? compare : null,
    discountPercent: variant.discountPercent ?? line.discountPercent,
    imageUrl: variant.imageUrl ?? line.imageUrl,
    label: [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" · "),
    option1: variant.option1 ?? null,
    option2: variant.option2 ?? null,
    option3: variant.option3 ?? null,
    inventoryQty: typeof variant.inventoryQty === "number" ? variant.inventoryQty : undefined,
  };
  const dup = items.find((i) => i.variantId === variant.id && i.variantId !== oldVariantId);
  items = dup ? items.filter((i) => i.variantId !== oldVariantId).map((i) => (i.variantId === variant.id ? { ...i, qty: i.qty + line.qty } : i)) : items.map((i) => (i.variantId === oldVariantId ? next : i));
  emit();
}

/* ---- checkout selection (original: sessionStorage "parqis_checkout_selection") ---- */
const SEL_KEY = "parqis_checkout_selection";
export function readSelection() {
  try {
    const raw = window.sessionStorage.getItem(SEL_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.map(String) : null;
  } catch {
    return null;
  }
}
export function writeSelection(ids) {
  try {
    window.sessionStorage.setItem(SEL_KEY, JSON.stringify(ids));
  } catch {}
}
export function selectOnly(variantId) {
  writeSelection([variantId]);
}
export function setQty(variantId, qty) {
  ensure();
  items = items.map((i) => (i.variantId === variantId ? { ...i, qty } : i)).filter((i) => i.qty > 0);
  emit();
}
export function removeFromCart(variantId) {
  ensure();
  items = items.filter((i) => i.variantId !== variantId);
  emit();
}

const subscribe = (cb) => {
  ensure();
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => {
  ensure();
  return items;
};
const empty = [];

export function useCart() {
  const list = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  return { items: list, totalQty: list.reduce((n, i) => n + i.qty, 0), subtotal: list.reduce((n, i) => n + i.qty * i.price, 0) };
}
