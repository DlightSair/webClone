"use client";

// Local wishlist store (the original used the signed-in backend wishlist).
import { useSyncExternalStore } from "react";

const KEY = "parqis:wishlist";
let ids = [];
let loaded = false;
const listeners = new Set();

function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      ids = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    } catch {
      ids = [];
    }
  }
}
function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  listeners.forEach((l) => l());
}

export function toggleWishlist(id) {
  ensure();
  ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  emit();
}

const subscribe = (cb) => {
  ensure();
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const empty = [];
export function useWishlist() {
  return useSyncExternalStore(subscribe, () => (ensure(), ids), () => empty);
}
