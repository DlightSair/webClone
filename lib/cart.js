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

export function addToCart(product, variant, qty = 1) {
  ensure();
  const id = variant?.id ?? product.id;
  const existing = items.find((i) => i.variantId === id);
  if (existing) existing.qty += qty;
  else items = [...items, { variantId: id, productId: product.id, title: product.title, price: Number(variant?.price ?? product.price ?? 0), imageUrl: variant?.imageUrl ?? product.imageUrl ?? null, label: variant ? [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" · ") : "", qty }];
  items = [...items];
  emit();
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
