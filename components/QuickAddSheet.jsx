"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import VariantSelector from "./VariantSelector";
import { addToCart, selectOnly } from "@/lib/cart";
import { inStock, optionNames as namesOf } from "@/lib/variants";

const price = (v) => Number.parseFloat(v.price) || 0;
const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// Does this product need an option choice before it can be added?
export function needsOptions(variants) {
  return !(variants.length <= 1) && variants.some((v) => (v.option1 && v.option1 !== "Default" && v.option1 !== "Default Title") || !!v.option2 || !!v.option3);
}

export default function QuickAddSheet({ product, initialVariantId, open, onClose, mode = "add", onSuccess, transparentOverlay = false }) {
  const router = useRouter();
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const stocked = useMemo(() => variants.filter(inStock), [variants]);
  const names = useMemo(() => {
    const n = namesOf(product);
    return Object.keys(n).length > 0 ? n : { option1: "Color", option2: "Size" };
  }, [product]);
  const withOptions = useMemo(() => needsOptions(variants), [variants]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected((initialVariantId ? stocked.find((v) => v.id === initialVariantId) : null) ?? (withOptions ? null : stocked[0] ?? variants[0] ?? null));
    setError(null);
  }, [open, product.id, initialVariantId, withOptions, stocked, variants]);
  useEffect(() => setMounted(true), []);

  const sale = selected ? price(selected) : product.price;
  const compare = (selected && Number.parseFloat(selected.compareAtPrice ?? "")) || product.compareAtPrice;
  const discount = sale !== null && compare && compare > sale ? Math.round(((compare - sale) / compare) * 100) : product.discountPercent;
  const canAdd = useMemo(() => {
    if (withOptions) return !!(selected && inStock(selected));
    const v = selected ?? stocked[0] ?? null;
    return !!(v && inStock(v));
  }, [withOptions, selected, stocked]);

  if (!open || !mounted) return null;

  const submit = () => {
    const v = withOptions ? selected : selected ?? stocked[0] ?? null;
    if (!v || !inStock(v)) {
      setError(withOptions ? "Select a size to continue." : "This product is unavailable.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      addToCart(product, v);
      onSuccess?.(v);
      if (mode === "buy") {
        selectOnly(v.id);
        onClose();
        router.push("/cart/checkout");
        return;
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to cart.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex items-end justify-center transition-opacity animate-in fade-in duration-200 ${transparentOverlay ? "bg-transparent backdrop-blur-none" : "bg-black/60 backdrop-blur-xs"}`} onClick={onClose}>
      <div className="w-full max-w-md px-4 py-4.5 bg-white rounded-t-[20px] shadow-[0px_-14px_26px_-6px_rgba(0,0,0,0.08)] flex flex-col gap-3.5 overflow-hidden dark:bg-zinc-900 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-[5px]">
            {sale !== null && <span className="text-black text-base text-[16px] font-medium dark:text-zinc-100">{inr(sale)}</span>}
            {compare && sale !== null && compare > sale && <span className="text-black/50 text-[10px] font-medium line-through dark:text-zinc-400">{inr(compare)}</span>}
            {discount && discount > 0 ? (
              <div className="px-1.5 py-0.5 bg-[#A92645] rounded-xs flex items-center justify-center">
                <span className="text-white text-[6px] font-normal uppercase">{discount}% OFF</span>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="size-6 bg-gray-200 rounded-full flex justify-center items-center text-black/60 transition hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-300" aria-label="Close modal">
            <X className="size-3.5" />
          </button>
        </div>
        {withOptions ? <VariantSelector variants={variants} optionNames={names} selectedVariant={selected} onSelectVariant={setSelected} onOpenSizeGuide={() => setGuide(true)} /> : null}
        {error && <p className="text-[12px] font-medium text-[#C41E5A]">{error}</p>}
        <button
          type="button"
          disabled={!canAdd || busy}
          onClick={submit}
          className={`mt-1 w-full h-11 rounded-sm flex justify-center items-center gap-2.5 text-base font-medium transition ${canAdd && !busy ? "bg-[#A92645] text-white hover:bg-[#8e1f3a] active:scale-[0.99] cursor-pointer" : "bg-[#E5E5E5] text-[#555555] cursor-not-allowed"}`}
        >
          {mode === "buy" ? (busy ? "Starting…" : "Buy Now") : busy ? "Adding…" : "Add to Cart"}
        </button>
        {guide && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Size Guide</h4>
                <button type="button" onClick={() => setGuide(false)} className="rounded-full p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                      <th className="py-2">Size</th>
                      <th className="py-2">Bust (in)</th>
                      <th className="py-2">Waist (in)</th>
                      <th className="py-2">Hip (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800">
                    {[["XS", 32, 25, 35], ["S", 34, 27, 37], ["M", 36, 29, 39], ["L", 38, 31, 41], ["XL", 40, 33, 43]].map(([s, b, w, h]) => (
                      <tr key={s}>
                        <td className="py-2 font-bold">{s}</td>
                        <td>{b}</td>
                        <td>{w}</td>
                        <td>{h}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setGuide(false)} className="mt-5 w-full rounded-lg bg-zinc-900 py-2.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
