"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, MapPin, Plus, Search, X } from "lucide-react";
import { pincodeFrom, saveLocation, useDeliveryLocation } from "@/lib/delivery";

// Stand-in for the original's Places search (needs the backend): a few common localities
const PLACES = [
  { label: "Andheri West, Mumbai, Maharashtra", secondaryLabel: "Mumbai", pincode: "400058" },
  { label: "Bandra West, Mumbai, Maharashtra", secondaryLabel: "Mumbai", pincode: "400050" },
  { label: "Connaught Place, New Delhi, Delhi", secondaryLabel: "New Delhi", pincode: "110001" },
  { label: "Saket, New Delhi, Delhi", secondaryLabel: "New Delhi", pincode: "110017" },
  { label: "Koramangala, Bengaluru, Karnataka", secondaryLabel: "Bengaluru", pincode: "560034" },
  { label: "Indiranagar, Bengaluru, Karnataka", secondaryLabel: "Bengaluru", pincode: "560038" },
  { label: "Banjara Hills, Hyderabad, Telangana", secondaryLabel: "Hyderabad", pincode: "500034" },
  { label: "T Nagar, Chennai, Tamil Nadu", secondaryLabel: "Chennai", pincode: "600017" },
  { label: "Salt Lake, Kolkata, West Bengal", secondaryLabel: "Kolkata", pincode: "700091" },
  { label: "Koregaon Park, Pune, Maharashtra", secondaryLabel: "Pune", pincode: "411001" },
  { label: "Navrangpura, Ahmedabad, Gujarat", secondaryLabel: "Ahmedabad", pincode: "380009" },
  { label: "C Scheme, Jaipur, Rajasthan", secondaryLabel: "Jaipur", pincode: "302001" },
];

export default function DeliverySheet({ open, onOpenChange }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useDeliveryLocation();
  const [screen, setScreen] = useState("select");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panel = useRef(null);
  const close = () => onOpenChange(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setScreen("select");
    setQuery("");
    setError(null);
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  const q = query.trim();
  const results = q.length >= 3 ? PLACES.filter((p) => `${p.label} ${p.pincode}`.toLowerCase().includes(q.toLowerCase())) : [];
  const pick = (p) => {
    saveLocation({ kind: "location", label: p.label, pincode: p.pincode ?? pincodeFrom(p.label) });
    close();
  };
  const locate = () => {
    if (!navigator.geolocation) {
      setError("Current location is not available in this browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLocation({ kind: "location", label: "Current Location", pincode: null, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
        close();
      },
      () => {
        setLocating(false);
        setError("Location permission was denied.");
      },
      { enableHighAccuracy: false, timeout: 1e4, maximumAge: 3e5 }
    );
  };
  const full = screen === "search";
  const title = screen === "search" ? "Find Your Location" : "Select Delivery Address";
  void current;

  return createPortal(
    <div className="mobile-bottom-sheet-backdrop fixed inset-0 isolate z-[50] bg-black/40 md:flex md:items-start md:justify-center md:px-4 md:pt-[72px]" onClick={close}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-selector-title"
        onClick={(e) => e.stopPropagation()}
        className={`mobile-bottom-sheet fixed z-10 overflow-y-auto bg-white px-4 pb-8 pt-5 shadow-2xl outline-none md:static md:flex md:h-auto md:max-h-[calc(100vh-96px)] md:w-[min(680px,calc(100vw-32px))] md:flex-col md:overflow-hidden md:rounded-[18px] md:border md:border-[#E7D7DE] md:px-8 md:pb-0 md:pt-8 ${full ? "inset-0 h-[100dvh] max-h-[100dvh] rounded-none" : "inset-x-0 bottom-0 h-[88dvh] max-h-[88dvh] rounded-t-[28px]"}`}
      >
        {!full && (
          <button type="button" className="mx-auto mb-4 block h-4 w-[80px] cursor-grab touch-none rounded-full active:cursor-grabbing md:hidden" aria-label="Dismiss address selector" onClick={close}>
            <span className="mx-auto block h-1.5 w-[54px] rounded-full bg-[#B7B7B7]" />
          </button>
        )}
        <div className="mb-5 flex shrink-0 items-center justify-between gap-4 border-b border-[#D1D1D1] pb-5">
          <div>
            <h2 id="address-selector-title" className="text-[24px] font-medium leading-tight text-black md:text-[28px]">
              {title}
            </h2>
            {screen === "select" && <p className="mt-2 text-[14px] text-black md:text-[15px]">Choose where you&apos;d like your order delivered.</p>}
          </div>
          <button type="button" onClick={close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2D7DB] text-[#5A4B50]" aria-label="Close address selector">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="md:dialog-overlay-scrollbar md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-8 md:pr-2">
          {error && <div className="mb-4 rounded-[8px] border border-[#E7A9BA] bg-[#FFF5F7] px-3 py-2 text-[13px] font-medium text-[#B3244B]">{error}</div>}
          {screen === "search" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#D06F89]" />
                <input
                  value={query}
                  onChange={(e) => {
                    setError(null);
                    setQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results[0]) pick(results[0]);
                  }}
                  className="h-[56px] w-full rounded-[5px] border border-[#B8B8B8] bg-white pl-14 pr-4 text-[16px] outline-none placeholder:text-[#555555] focus:border-[#B3244B]"
                  placeholder="Search for area, street name..."
                  autoFocus
                />
              </div>
              {q.length > 0 && q.length < 3 && <p className="text-[12px] leading-5 text-[#777777]">Type at least 3 characters to search.</p>}
              {results.length > 0 && (
                <div className="overflow-hidden rounded-[5px] border border-[#D8C6CE] bg-white">
                  {results.map((p) => (
                    <button key={p.label} type="button" onClick={() => pick(p)} className="flex w-full items-start gap-3 border-b border-[#EFE2E7] px-4 py-3 text-left last:border-b-0 hover:bg-[#FFF6F9]">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#B3244B]" />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold leading-5 text-black">{p.label}</span>
                        {p.secondaryLabel && <span className="mt-1 block text-[12px] leading-4 text-[#777777]">{p.secondaryLabel}</span>}
                        {p.pincode && !p.label.includes(p.pincode) && <span className="mt-1 block text-[12px] text-[#777777]">PIN {p.pincode}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {q.length >= 3 && results.length === 0 && <p className="text-[13px] text-[#777777]">No matching locations found.</p>}
              <p className="text-[12px] leading-5 text-[#777777]">Select a result to add a full delivery address.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setScreen("search");
                }}
                className="flex h-[52px] w-full items-center gap-4 rounded-[5px] border border-[#B8B8B8] px-4 text-left text-[14px] text-[#333333]"
              >
                <Search className="h-6 w-6 text-[#D06F89]" />
                <span>Search for area, street name...</span>
              </button>
              <button type="button" onClick={locate} disabled={locating} className="flex h-[60px] w-full items-center gap-4 rounded-[5px] border border-[#B8B8B8] px-4 text-left text-[15px] font-medium text-[#B3244B] disabled:opacity-60">
                <img src="/cart/crosshair.svg" alt="" className="h-5 w-5 ml-0.5" />
                <span className="flex-1">{locating ? "Finding location..." : "Use Current Location"}</span>
                <ChevronRight className="h-5 w-5 text-[#8A737B]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
                }}
                className="flex h-[52px] w-full items-center gap-4 rounded-[5px] border border-[#B8B8B8] px-4 text-left text-[15px] font-medium text-[#B3244B]"
              >
                <Plus className="h-6 w-6 text-[#D06F89]" />
                <span>Add new address</span>
              </button>
              <div className="pt-5">
                <h3 className="text-[18px] font-semibold text-black">All Addresses</h3>
                <div className="mt-4 rounded-[8px] border border-[#E7A9BA] bg-[#FFF8FA] p-4">
                  <p className="text-[14px] font-semibold text-black">
                    <Link href="/auth/login" className="text-[#B3244B] underline-offset-2 hover:underline">
                      Sign in
                    </Link>{" "}
                    to use saved addresses.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
