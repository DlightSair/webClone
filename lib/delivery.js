"use client";

// Delivery location store (original key + event names kept)
import { useMemo, useSyncExternalStore } from "react";

const KEY = "parqis_delivery_location";
export const DELIVERY_EVENT = "parqis:delivery-location";

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

function parse(raw) {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw);
    if (!t || typeof t !== "object" || Array.isArray(t)) return null;
    if (t.kind === "location") {
      const label = str(t.label);
      if (!label) return null;
      return { kind: "location", label, pincode: str(t.pincode), latitude: typeof t.latitude === "number" ? t.latitude : undefined, longitude: typeof t.longitude === "number" ? t.longitude : undefined };
    }
    if (t.kind === "address" && t.address) {
      const a = t.address;
      const { id, name, phone, line1, city, state, pincode } = { id: str(a.id), name: str(a.name), phone: str(a.phone), line1: str(a.line1), city: str(a.city), state: str(a.state), pincode: str(a.pincode) };
      if (!(id && name && phone && line1 && city && state && pincode)) return null;
      return {
        kind: "address",
        address: { id, label: str(a.label), labelType: a.labelType === "work" || a.labelType === "other" ? a.labelType : "home", customLabel: str(a.customLabel), name, phone, line1, line2: str(a.line2), city, state, pincode },
      };
    }
  } catch {}
  return null;
}

export function saveLocation(loc) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {}
  window.dispatchEvent(new Event(DELIVERY_EVENT));
}
export function clearLocation() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(DELIVERY_EVENT));
}

const subscribe = (cb) => {
  window.addEventListener(DELIVERY_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(DELIVERY_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const snapshot = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function useDeliveryLocation() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return useMemo(() => parse(raw), [raw]);
}

const titleCase = (s) => s.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());

// header label
export function locationLabel(loc) {
  if (!loc) return "Select an address";
  if (loc.kind === "location") return titleCase(loc.label);
  return [loc.address.label?.trim() || loc.address.customLabel?.trim(), titleCase(loc.address.city), loc.address.pincode].filter(Boolean).join(" ");
}

export function pincodeFrom(text) {
  return text.match(/\b[1-9][0-9]{5}\b/)?.[0] ?? null;
}
