"use client";

// Local wishlist store (the original used the signed-in backend wishlist).
import { useSyncExternalStore } from "react";

const KEY = "parqis:wishlist";
const AT_KEY = "parqis:wishlist-at";
let ids = [];
let at = {};
let entries = [];
let loaded = false;
const listeners = new Set();

const rebuild = () => {
  entries = ids.map((id) => ({ id, at: at[id] ?? null }));
};

function ensure() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      ids = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      at = JSON.parse(window.localStorage.getItem(AT_KEY) || "{}");
    } catch {
      ids = [];
      at = {};
    }
    rebuild();
  }
}
function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.localStorage.setItem(AT_KEY, JSON.stringify(at));
  } catch {}
  rebuild();
  listeners.forEach((l) => l());
}

export function toggleWishlist(id) {
  ensure();
  if (ids.includes(id)) {
    ids = ids.filter((x) => x !== id);
    const { [id]: _drop, ...rest } = at;
    at = rest;
  } else {
    ids = [...ids, id];
    at = { ...at, [id]: new Date().toISOString() };
  }
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
// [{ id, at }] - `at` is the ISO time the item was added
export function useWishlistEntries() {
  return useSyncExternalStore(subscribe, () => (ensure(), entries), () => empty);
}
