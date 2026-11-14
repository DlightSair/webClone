"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock, Play, Search, User, X } from "lucide-react";
import { AddressButton } from "../Header";
import ProductGridCard from "../ProductGridCard";
import QuickAddSheet from "../QuickAddSheet";
import { SectionTitle } from "../home/Sections";
import { addToCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import {
  MIN_QUERY, PAGE_SIZE, PRICE, SORTS, SORT_LABELS, TRENDING,
  addHistory, bestSellers, emptyFilters, newState, pairedWith, parseParams, readHistory, removeHistory, runSearch, searchReels, searchUrl, suggest, suggestionUrl, toQueryString,
} from "@/lib/search";

const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const num = (n) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

/* ---------- suggestions + input ---------- */

function SuggestionList({ query, results, onSelect }) {
  const q = query.trim();
  if (q.length < MIN_QUERY) return <p className="px-3 py-5 text-[13px] text-[#74707A]">Type at least {MIN_QUERY} characters to search.</p>;
  if (results.length === 0) {
    return (
      <div className="px-3 py-5">
        <p className="text-[13px] font-semibold text-[#1C1B1F]">No suggestions yet.</p>
        <Link href={searchUrl(newState(q))} onClick={onSelect} className="mt-2 inline-flex cursor-pointer text-[13px] font-bold text-[#A0146C]">
          Search for {q}
        </Link>
      </div>
    );
  }
  return (
    <div className="divide-y divide-[#F3EEF1]">
      {results.map((s, i) => (
        <Link key={`${s.type}-${s.value}-${i}`} href={suggestionUrl(s.type, s.label, s.value, s.brandId)} onClick={onSelect} className="flex cursor-pointer items-center justify-between gap-3 rounded-[6px] px-3 py-3 transition hover:bg-[#FFF6F9]">
          <span className="truncate text-[14px] text-[#1C1B1F]">{s.label}</span>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#8B8594]" />
        </Link>
      ))}
    </div>
  );
}

function SearchInput({ initialValue = "", placeholder = "Search for products, creators...", inputClassName }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [focus, setFocus] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const input = useRef(null);
  const overlayInput = useRef(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!overlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => overlayInput.current?.focus(), 0);
    const esc = (e) => e.key === "Escape" && setOverlay(false);
    document.addEventListener("keydown", esc);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [overlay]);

  useEffect(() => {
    if (!focus && !overlay) return;
    const t = window.setTimeout(() => setResults(suggest(value, 8)), 220);
    return () => window.clearTimeout(t);
  }, [focus, overlay, value]);

  const submit = (e) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) {
      setFocus(false);
      setOverlay(false);
      router.push("/search");
      return;
    }
    if (t.length < MIN_QUERY) return;
    addHistory(t);
    setFocus(false);
    setOverlay(false);
    router.push(searchUrl(newState(t)));
  };

  return (
    <div className="min-w-0">
      <form onSubmit={submit} className="relative">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74707A]" />
          <input
            ref={input}
            type="search"
            name="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {
              setFocus(true);
              if (window.matchMedia("(max-width: 767px)").matches) setOverlay(true);
            }}
            onBlur={() => window.setTimeout(() => setFocus(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setFocus(false);
                input.current?.blur();
              }
            }}
            placeholder={placeholder}
            aria-label="Search products and creators"
            className={inputClassName ?? "h-10 w-full rounded-[4px] border border-[#C8C5D0] bg-white pl-9 pr-3 text-[12px] outline-none"}
            autoComplete="off"
          />
        </label>
        {focus && value.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 hidden rounded-[8px] border border-[#E4DDE0] bg-white p-2 shadow-[0_18px_42px_rgba(28,27,31,0.16)] md:block" onMouseDown={(e) => e.preventDefault()}>
            <SuggestionList query={value} results={results} onSelect={() => setFocus(false)} />
          </div>
        )}
      </form>
      {overlay &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-white md:hidden" role="dialog" aria-modal="true" aria-label="Search">
            <div className="flex h-full flex-col">
              <form onSubmit={submit} className="border-b border-[#E4DDE0] px-4 py-3">
                <div className="flex items-center gap-3">
                  <label className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#74707A]" />
                    <input ref={overlayInput} type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label="Search products and creators" className="h-11 w-full rounded-[5px] border border-[#C8C5D0] bg-white pl-10 pr-3 text-[12px] outline-none" autoComplete="off" />
                  </label>
                  <button type="button" onClick={() => setOverlay(false)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E4DDE0] text-[#74707A]" aria-label="Close search">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </form>
              <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
                <SuggestionList query={value} results={results} onSelect={() => setOverlay(false)} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ---------- sort + filter ---------- */

function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-8 w-full items-center justify-between gap-2 rounded-[4px] border border-[#C8C5D0] bg-white px-3 text-[12px] text-[#1C1B1F]">
        <span className="truncate">Sort by</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#74707A] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[8px] border border-[#E4DDE0] bg-white py-1 shadow-[0_18px_42px_rgba(28,27,31,0.16)]">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer px-3 py-2.5 text-left text-[13px] transition hover:bg-[#FFF6F9] ${value === s ? "font-bold text-[#A0146C]" : "text-[#1C1B1F]"}`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const THUMB =
  "pointer-events-none absolute h-8 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-[20px] [&::-moz-range-thumb]:w-[20px] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#A0146C] [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#A0146C] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-runnable-track]:h-0 [&::-moz-range-track]:h-0";

function PriceSlider({ min, max, valueMin, valueMax, onChange }) {
  const span = max - min || 1;
  const a = ((valueMin - min) / span) * 100;
  const b = ((valueMax - min) / span) * 100;
  return (
    <div className="px-1 pt-2">
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#E4DDE0]" />
        <div className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#A0146C]" style={{ left: `${a}%`, width: `${Math.max(b - a, 0)}%` }} />
        <input type="range" min={min} max={max} value={valueMin} onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax), valueMax)} className={THUMB} style={{ zIndex: valueMin > max - 0.05 * span ? 5 : 3 }} aria-label="Minimum price" />
        <input type="range" min={min} max={max} value={valueMax} onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin))} className={THUMB} style={{ zIndex: 4 }} aria-label="Maximum price" />
      </div>
    </div>
  );
}

const DEFAULT_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free size"];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const digits = (s) => {
  const t = s.replace(/[^\d]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

function FilterSheetInner({ onClose, onApply, draftFilters, brands, sizes, priceFacet }) {
  const [tab, setTab] = useState("price");
  const [draft, setDraft] = useState(draftFilters);
  const startMin = draftFilters.minPrice ?? PRICE.defaultMin;
  const startMax = draftFilters.maxPrice ?? PRICE.defaultMax;
  const [lo, setLo] = useState(startMin);
  const [hi, setHi] = useState(startMax);
  const [loText, setLoText] = useState(String(startMin));
  const [hiText, setHiText] = useState(String(startMax));
  const [editLo, setEditLo] = useState(false);
  const [editHi, setEditHi] = useState(false);
  const touched = useRef(false);
  const sizeList = useMemo(() => (sizes.length > 0 ? sizes.map((s) => s.value) : DEFAULT_SIZES), [sizes]);
  const cl = (v) => clamp(v, PRICE.min, PRICE.max);
  const setRange = (a, b) => {
    touched.current = true;
    const x = cl(a);
    const y = cl(b);
    const l = Math.min(x, y);
    const h = Math.max(x, y);
    setLo(l);
    setHi(h);
    setLoText(String(l));
    setHiText(String(h));
  };
  const box = "h-10 min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[#1C1B1F] outline-none text-center";
  const checkbox = (on) => (
    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition ${on ? "border-[#A0146C] bg-[#A0146C] text-white" : "border-[#C8C5D0] bg-white"}`}>{on ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}</div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close filters" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl md:rounded-[24px]">
        <div className="border-b border-[#F0EBEF] px-5 py-4">
          <h2 className="text-[18px] font-bold text-[#1C1B1F]">Filter by</h2>
        </div>
        <div className="flex min-h-0 flex-1">
          <aside className="w-[110px] shrink-0 border-r border-[#F0EBEF] bg-white">
            {["price", "size", "brand"].map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`w-full px-5 py-4 text-left text-[14px] capitalize transition ${tab === t ? "font-bold text-[#A0146C] underline decoration-[#A0146C] decoration-2 underline-offset-4" : "text-[#1C1B1F] font-normal"}`}>
                {t}
              </button>
            ))}
          </aside>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAF8F9] px-5 py-4">
            {tab === "price" && (
              <div className="space-y-5">
                <p className="text-[14px] font-semibold text-[#1C1B1F]">Select price range</p>
                {priceFacet ? (
                  <p className="text-[12px] text-[#74707A]">
                    Available in results: {inr(priceFacet.min)} – {inr(priceFacet.max)}
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 text-[14px] text-[#1C1B1F]">Min</span>
                    <div className="flex h-10 min-w-0 flex-1 items-center rounded-[8px] border border-[#E5E0E3] bg-white px-2.5 shadow-sm focus-within:border-[#A0146C]">
                      <span className="shrink-0 text-[13px] text-[#74707A]">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editLo ? loText : num(lo)}
                        onFocus={() => {
                          setEditLo(true);
                          setLoText(String(lo));
                        }}
                        onChange={(e) => {
                          touched.current = true;
                          setLoText(e.target.value);
                        }}
                        onBlur={() => {
                          const n = digits(loText);
                          if (n == null) setLoText(String(lo));
                          else setRange(n, hi);
                          setEditLo(false);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className={box}
                      />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 text-[14px] text-[#1C1B1F]">Max</span>
                    <div className="flex h-10 min-w-0 flex-1 items-center rounded-[8px] border border-[#E5E0E3] bg-white px-2.5 shadow-sm focus-within:border-[#A0146C]">
                      <span className="shrink-0 text-[13px] text-[#74707A]">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editHi ? hiText : num(hi)}
                        onFocus={() => {
                          setEditHi(true);
                          setHiText(String(hi));
                        }}
                        onChange={(e) => {
                          touched.current = true;
                          setHiText(e.target.value);
                        }}
                        onBlur={() => {
                          const n = digits(hiText);
                          if (n == null) setHiText(String(hi));
                          else setRange(lo, n);
                          setEditHi(false);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className={box}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <PriceSlider min={PRICE.min} max={PRICE.max} valueMin={clamp(lo, PRICE.min, PRICE.max)} valueMax={clamp(hi, PRICE.min, PRICE.max)} onChange={setRange} />
                  <div className="flex items-center justify-between pt-1 text-[12px] text-[#74707A]">
                    <span>{inr(PRICE.labelMin)}</span>
                    <span>{inr(PRICE.labelMax)}+</span>
                  </div>
                </div>
              </div>
            )}
            {tab === "size" && (
              <div className="space-y-4">
                <p className="text-[14px] font-semibold text-[#1C1B1F]">Select Size</p>
                <div className="divide-y divide-[#F0EAEF]/60">
                  {sizeList.map((s) => {
                    const on = draft.sizes.includes(s);
                    return (
                      <label key={s} onClick={() => setDraft((d) => ({ ...d, sizes: d.sizes.includes(s) ? d.sizes.filter((x) => x !== s) : [...d.sizes, s] }))} className="flex cursor-pointer items-center justify-between py-3 transition hover:opacity-80">
                        <span className="text-[14px] font-medium text-[#1C1B1F]">{s}</span>
                        {checkbox(on)}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {tab === "brand" && (
              <div className="space-y-4">
                <p className="text-[14px] font-semibold text-[#1C1B1F]">Select Preferred Brands</p>
                <div className="divide-y divide-[#F0EAEF]/60">
                  {brands.length === 0 ? (
                    <p className="text-[13px] text-[#74707A]">No brands available for this search.</p>
                  ) : (
                    brands.map((b) => {
                      const on = draft.brandIds.includes(b.id);
                      return (
                        <label key={b.id} onClick={() => setDraft((d) => ({ ...d, brandIds: d.brandIds.includes(b.id) ? d.brandIds.filter((x) => x !== b.id) : [...d.brandIds, b.id] }))} className="flex cursor-pointer items-center justify-between py-3 transition hover:opacity-80">
                          <span className="text-[14px] font-medium text-[#1C1B1F]">{b.name}</span>
                          {checkbox(on)}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[#F0EBEF] bg-white px-5 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-[8px] border border-[#A0146C] bg-white text-[15px] font-semibold text-[#A0146C] transition hover:bg-[#FDF3F8]">
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              const a = cl(digits(loText) ?? lo);
              const b = cl(digits(hiText) ?? hi);
              const l = Math.min(a, b);
              const h = Math.max(a, b);
              const had = draftFilters.minPrice != null || draftFilters.maxPrice != null;
              const use = touched.current || had;
              onApply({ ...draft, minPrice: use ? l : null, maxPrice: use ? h : null });
            }}
            className="h-11 rounded-[8px] bg-[#A0146C] text-[15px] font-semibold text-white transition hover:bg-[#8F125F]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSheet({ open, draftFilters, ...rest }) {
  return open ? <FilterSheetInner key={JSON.stringify(draftFilters)} draftFilters={draftFilters} {...rest} /> : null;
}

/* ---------- rails ---------- */

function ProductsRail({ title, products, viewMoreHref }) {
  if (products.length === 0) return null;
  return (
    <section className="py-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold text-[#1C1B1F]">{title}</h2>
        {viewMoreHref ? (
          <Link href={viewMoreHref} className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#A0146C]">
            View more
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-1 pb-1">
        {products.map((p) => (
          <div key={p.id} className="w-[168px] shrink-0">
            <ProductGridCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ReelCard({ reel }) {
  const name = reel.creatorName ?? reel.creatorHandle;
  return (
    <div className="w-[155px] shrink-0">
      <Link href={`/reels?reel=${encodeURIComponent(reel.id)}`} className="group relative block aspect-[9/16] w-full overflow-hidden bg-[#1C1B1F] shadow-sm">
        {reel.thumbnailUrl ? <img src={reel.thumbnailUrl} alt={reel.caption ?? name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="h-full w-full bg-gradient-to-b from-[#3A3340] to-[#1C1B1F]" />}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/40 backdrop-blur-md text-white shadow-md transition group-hover:scale-110">
            <Play className="h-5 w-5 fill-current translate-x-0.5" />
          </div>
        </div>
      </Link>
      <Link href={`/creator/${encodeURIComponent(reel.creatorHandle)}`} className="mt-2 flex items-center gap-2 px-0.5 transition hover:opacity-80">
        {reel.creatorAvatar ? (
          <img src={reel.creatorAvatar} alt={name} className="h-6 w-6 shrink-0 rounded-full object-cover border border-[#E5E0E3]" />
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5D7DE] text-[#A0146C] border border-[#E5E0E3]">
            <User className="h-3.5 w-3.5" />
          </div>
        )}
        <span className="truncate text-[12px] font-semibold text-[#1C1B1F]">{name}</span>
      </Link>
    </div>
  );
}

function ReelsRail({ reels }) {
  if (reels.length === 0) return null;
  return (
    <section className="py-2.5">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold text-[#1C1B1F]">Creator picks</h2>
        <Link href="/trends" className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#A0146C]">
          View more
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="hide-scrollbar flex gap-3.5 overflow-x-auto px-1 pb-2 scroll-smooth touch-pan-x">
        {reels.map((r) => (
          <ReelCard key={r.id} reel={r} />
        ))}
      </div>
    </section>
  );
}

function PairedRail({ title, items, viewMoreHref = "/search", className }) {
  const router = useRouter();
  const [sheet, setSheet] = useState(null);
  const [done, setDone] = useState({});
  const [toast, setToast] = useState(null);
  const timers = useRef(new Map());
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  if (items.length === 0) return null;
  const ok = (p) => () => {
    setDone((d) => ({ ...d, [p.id]: true }));
    setToast(`"${p.title}" added to cart`);
    clearTimeout(timers.current.get("toast"));
    timers.current.set("toast", setTimeout(() => setToast(null), 2500));
    clearTimeout(timers.current.get(p.id));
    timers.current.set(p.id, setTimeout(() => setDone((d) => ({ ...d, [p.id]: false })), 2000));
  };
  return (
    <section className={className ?? "mt-4"}>
      <SectionTitle title={title} onViewMore={() => router.push(viewMoreHref)} />
      <div className="mt-2.5 flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        {items.map((p, i) => {
          const v = p.variants?.[0];
          const img = v?.imageUrl ?? p.featuredImageUrl;
          const price = Number(v?.price ?? p.price ?? 0);
          return (
            <article key={`${p.id}-${i}`} onClick={() => router.push(`/shop/${p.id}`)} className="w-[109px] shrink-0 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 ">
              <div className="relative overflow-hidden rounded-bl-[4px] rounded-br-[16px] rounded-tl-[4px] rounded-tr-[4px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                {img && <img src={img} alt={p.title} className="h-[128px] w-full object-cover" />}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!done[p.id]) setSheet(p);
                  }}
                  aria-label={done[p.id] ? `${p.title} added to cart` : `Add ${p.title} to cart`}
                  className="absolute bottom-[0px] right-[0px] z-30 flex size-[28px] items-center justify-center rounded-full bg-white/80 backdrop-blur-[2px] text-[#A92645] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
                >
                  {done[p.id] ? <Check className="h-3.5 w-3.5 text-[#A92645]" strokeWidth={2.5} /> : <img src="/add-to-cart.svg" alt="Add to cart" width={14} height={14} className="h-[13px] w-[13px] object-contain" />}
                </button>
              </div>
              <div className="flex flex-col space-y-2 pt-2">
                <p className="mt-1 line-clamp-2 text-sm leading-[1.15] text-[#4A4640]">{p.title}</p>
                <p className="text-sm font-semibold text-black">
                  ₹{price.toLocaleString()}
                  {p.compareAtPrice && p.compareAtPrice > price && (
                    <>
                      {" "}
                      <span className="font-light text-black/50 line-through">₹{p.compareAtPrice.toLocaleString()}</span>
                    </>
                  )}
                  {p.discountPercent && (
                    <>
                      {" "}
                      <span className="font-light text-sm text-[#0CB72E]">{p.discountPercent}% OFF</span>
                    </>
                  )}
                </p>
                {p.rating && (
                  <div className="flex items-center gap-[6px]">
                    <span className="flex h-[15px] w-[37px] items-center justify-center rounded-[25px] bg-[#B5D2A2] text-[10px] text-[#1B7307]">★ {p.rating}</span>
                    {p.reviewCount && <span className="text-[10px] font-light text-[#767676]">({p.reviewCount})</span>}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {sheet && <QuickAddSheet open product={sheet} mode="add" onClose={() => setSheet(null)} onSuccess={ok(sheet)} />}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-28 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1C1B1F] px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0CB72E]">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
          <span className="max-w-[200px] truncate text-[13px] font-medium text-white">{toast}</span>
        </div>
      )}
    </section>
  );
}

/* ---------- results ---------- */

function Results({ state }) {
  const key = toQueryString(state);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE_SIZE);
  const sentinel = useRef(null);
  const { items } = useMemo(() => runSearch(state), [state]);
  const best = useMemo(() => bestSellers(), []);
  const paired = useMemo(() => pairedWith(), []);
  const reels = useMemo(() => searchReels(), []);

  useEffect(() => {
    setLoading(true);
    setShown(PAGE_SIZE);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [key]);

  const visible = items.slice(0, shown);
  const more = shown < items.length;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more || loading) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setShown((n) => n + PAGE_SIZE), { rootMargin: "240px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, loading, shown]);

  const blocks = useMemo(() => {
    const out = [];
    let i = 0;
    let n = 0;
    let best_ = false;
    let pair_ = false;
    while (i < visible.length) {
      out.push({ type: "products", items: visible.slice(i, i + 4) });
      i += 4;
      n += 1;
      if (n === 1) {
        out.push({ type: "reels", items: reels });
        if (best.length > 0) {
          out.push({ type: "best_sellers", items: best });
          best_ = true;
        }
      }
      if (n === 2 && paired.length > 0) {
        out.push({ type: "paired_with", items: paired });
        pair_ = true;
      }
    }
    if (!best_ && visible.length > 0 && best.length > 0) out.push({ type: "best_sellers", items: best });
    if (!pair_ && visible.length > 0 && paired.length > 0) out.push({ type: "paired_with", items: paired });
    return out;
  }, [visible, reels, best, paired]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-[8px] bg-[#EEE8EC]" />
            <div className="mt-2 h-3 rounded bg-[#EEE8EC]" />
            <div className="mt-1 h-3 w-2/3 rounded bg-[#EEE8EC]" />
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-[12px] border border-dashed border-[#C8C5D0] p-8 text-center">
          <p className="text-[15px] font-semibold text-[#1C1B1F]">No products found</p>
          <p className="mt-2 text-[13px] text-[#74707A]">Try another keyword or adjust your filters.</p>
        </div>
        <ProductsRail title="Best Sellers" products={best} viewMoreHref="/categories/best-sellers" />
        <PairedRail title="Best paired with" items={paired} className="mt-0" />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.type === "products" ? (
          <div key={`p-${i}`} className="grid grid-cols-2 gap-3 px-1">
            {b.items.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        ) : b.type === "reels" ? (
          <ReelsRail key={`r-${i}`} reels={b.items} />
        ) : b.type === "best_sellers" ? (
          <ProductsRail key={`b-${i}`} title="Best Sellers" products={b.items} viewMoreHref="/categories/best-sellers" />
        ) : (
          <PairedRail key={`pw-${i}`} title="Best paired with" items={b.items} className="mt-0 px-1" />
        )
      )}
      <div ref={sentinel} className="h-1" />
    </div>
  );
}

/* ---------- page ---------- */

export default function SearchExperience() {
  const router = useRouter();
  const sp = useSearchParams();
  const wishlist = useWishlist();
  const state = useMemo(() => parseParams(sp), [sp]);
  const [recent, setRecent] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setRecent(readHistory()), []);

  const go = useCallback(
    (s) => {
      if (s.q.trim()) setRecent(addHistory(s.q));
      router.push(searchUrl(s));
    },
    [router]
  );
  const activeFilters = state.filters.brandIds.length + state.filters.sizes.length + +(state.filters.minPrice != null || state.filters.maxPrice != null) + +!!state.filters.category;
  const facets = useMemo(() => (filtersOpen && state.q ? runSearch({ ...state, filters: emptyFilters() }).facets : { brands: [], sizes: [], price: null }), [filtersOpen, state]);

  if (!state.q) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = String(new FormData(e.currentTarget).get("search") ?? "").trim();
            if (t.length < MIN_QUERY) return;
            go(newState(t));
          }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#74707A]" />
          <input type="search" name="search" placeholder="Search for products, creators..." autoFocus className="h-12 w-full rounded-[8px] border border-[#C8C5D0] bg-white pl-11 pr-4 text-[12px] text-[#1C1B1F] outline-none" />
        </form>
        {recent.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#74707A]">Recent</p>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {recent.map((q) => (
                <div key={q} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#C8C5D0] bg-white px-3 py-2">
                  <button type="button" onClick={() => go(newState(q))} className="inline-flex items-center gap-2 text-[13px] text-[#1C1B1F]">
                    <Clock className="h-3.5 w-3.5 text-[#74707A]" />
                    {q}
                  </button>
                  <button type="button" onClick={() => setRecent(removeHistory(q))} className="text-[#8B8594]" aria-label={`Remove ${q}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#74707A]">Trending</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {TRENDING.map((q) => (
              <button key={q} type="button" onClick={() => go(newState(q))} className="shrink-0 rounded-full border border-[#E4DDE0] bg-[#FFF6F9] px-3 py-2 text-[13px] font-medium text-[#A0146C]">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="sticky top-0 z-40 border-b border-[#EEE8EC] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mb-2.5 flex items-center justify-between">
          <AddressButton className="text-black/60 hover:bg-gray-100" />
          <div className="flex items-center gap-4">
            <Link href="/wishlist" className="relative cursor-pointer transition hover:opacity-85 active:scale-95">
              <img alt="Wishlist" width={20} height={20} className="h-[19px] w-[19px] object-contain" src="/profile/profile-like.svg" />
              {wishlist.length > 0 && <span className="absolute -right-[1px] top-[1px] border border-[1.5px] border-white size-[7px] rounded-full bg-[#A92645]" />}
            </Link>
            <Link href="/profile" className="flex items-center justify-center rounded-full text-[#1C1B1F] transition hover:bg-[#F3EEF1]" aria-label="Profile">
              <img alt="User" width={20} height={20} className="h-[21px] w-[21px] object-contain" src="/profile/profile-user.svg" />
            </Link>
          </div>
        </div>
        <SearchInput key={state.q} initialValue={state.q} placeholder="Search for products, creators..." inputClassName="h-9 w-full rounded-[4px] border border-[#C8C5D0] bg-white pl-10 pr-3 text-[12px] outline-none" />
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[4px] border border-[#C8C5D0] bg-white text-[12px] text-[#1C1B1F] transition hover:border-[#A0146C]">
            <img alt="Filter" width={18} height={18} className="h-[15px] w-[15px] object-contain" src="/search/mingcute_filter-line.svg" />
            Filters
            {activeFilters > 0 ? <span className="rounded-full bg-[#A0146C] px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilters}</span> : null}
          </button>
          <SortMenu value={state.sort} onChange={(sort) => go({ ...state, sort })} />
        </div>
      </div>
      <div className="px-4 py-4">
        <Results state={state} />
      </div>
      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        draftFilters={state.filters}
        brands={facets.brands}
        sizes={facets.sizes}
        priceFacet={facets.price}
        onApply={(filters) => {
          setFiltersOpen(false);
          go({ ...state, filters });
        }}
      />
    </div>
  );
}
