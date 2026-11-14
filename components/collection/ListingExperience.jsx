"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, ChevronDown, X } from "lucide-react";
import ProductGridCard from "../ProductGridCard";
import PlayButton from "../PlayButton";
import { useWishlist } from "@/lib/wishlist";

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount_desc", label: "Discount" },
  { value: "newest", label: "Newest" },
];

function ReelRail({ reels, title }) {
  if (!reels || reels.length === 0) return null;
  return (
    <section className="py-2.5">
      {title && (
        <div className="mb-2.5 px-1">
          <h2 className="text-[15px] font-bold text-[#1C1B1F]">{title}</h2>
        </div>
      )}
      <div className="hide-scrollbar flex gap-3.5 overflow-x-auto px-1 pb-2 scroll-smooth touch-pan-x">
        {reels.map((r) => {
          const name = r.creatorName ?? r.creatorHandle;
          return (
            <div key={r.id} className="w-[155px] shrink-0">
              <Link href={`/trends?reel=${encodeURIComponent(r.id)}`} className="group relative block aspect-[9/16] w-full overflow-hidden bg-[#1C1B1F] shadow-sm">
                {r.thumbnailUrl ? (
                  <img src={r.thumbnailUrl} alt={r.caption ?? name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-b from-[#3A3340] to-[#1C1B1F]" />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <PlayButton className="scale-50 transition-transform duration-200 group-hover:scale-[0.55]" />
                </div>
              </Link>
              <div className="mt-2.5 flex items-center gap-2 ">
                {r.creatorAvatar ? (
                  <img src={r.creatorAvatar} alt={name} loading="lazy" className="h-8 w-8 rounded-full object-cover ring-1 ring-black/5" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE8EC] text-[#74707A]" />
                )}
                <span className="truncate text-xs text-black">{name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FilterSheet({ open, onClose, brands, priceFacet, draft, onApply }) {
  const [local, setLocal] = useState(draft);
  if (!open) return null;
  const toggleBrand = (id) => setLocal((s) => ({ ...s, brandIds: s.brandIds.includes(id) ? s.brandIds.filter((b) => b !== id) : [...s.brandIds, id] }));
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1C1B1F]">Filters</h3>
          <button type="button" onClick={onClose} aria-label="Close filters">
            <X className="h-5 w-5" />
          </button>
        </div>
        {brands.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] font-semibold text-[#1C1B1F]">Brand</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBrand(b.id)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${local.brandIds.includes(b.id) ? "border-[#A0146C] bg-[#FDF3F8] text-[#A0146C]" : "border-[#C8C5D0] text-[#1C1B1F]"}`}
                >
                  {b.name} ({b.count})
                </button>
              ))}
            </div>
          </div>
        )}
        {priceFacet && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] font-semibold text-[#1C1B1F]">Price (₹)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={String(priceFacet.min)}
                value={local.minPrice ?? ""}
                onChange={(e) => setLocal((s) => ({ ...s, minPrice: e.target.value === "" ? null : Number(e.target.value) }))}
                className="h-9 w-full rounded-[4px] border border-[#C8C5D0] px-2 text-[12px]"
              />
              <span className="text-[12px] text-[#74707A]">to</span>
              <input
                type="number"
                placeholder={String(priceFacet.max)}
                value={local.maxPrice ?? ""}
                onChange={(e) => setLocal((s) => ({ ...s, maxPrice: e.target.value === "" ? null : Number(e.target.value) }))}
                className="h-9 w-full rounded-[4px] border border-[#C8C5D0] px-2 text-[12px]"
              />
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => setLocal({ brandIds: [], sizes: [], minPrice: null, maxPrice: null, category: null })} className="h-10 flex-1 rounded-[4px] border border-[#C8C5D0] text-[13px] text-[#1C1B1F]">
            Clear
          </button>
          <button type="button" onClick={() => onApply(local)} className="h-10 flex-1 rounded-[4px] bg-[#A0146C] text-[13px] font-semibold text-white">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingExperience({ collection, initialPage, reels = [], rails = [], placementMode = "manual", defaultSortBy = "price_asc", pinned = [] }) {
  const wishlist = useWishlist();
  const [products] = useState(initialPage.products);
  const initialSort = placementMode === "auto" && defaultSortBy ? { price_asc: "price_asc", price_desc: "price_desc", discount: "discount_desc", newest: "newest" }[defaultSortBy] ?? "relevance" : "relevance";
  const [sort, setSort] = useState(initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ brandIds: [], sizes: [], minPrice: null, maxPrice: null, category: null });
  const [toast, setToast] = useState(null);

  const brands = useMemo(() => {
    const m = {};
    for (const p of products) {
      const b = p.vendor || p.attributes?.Brand;
      if (!b) continue;
      m[b] ??= { id: b, name: b, count: 0 };
      m[b].count++;
    }
    return Object.values(m);
  }, [products]);

  const priceFacet = useMemo(() => {
    const ps = products.map((p) => p.price).filter((x) => typeof x === "number" && x > 0);
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null;
  }, [products]);

  const visible = useMemo(() => {
    let list = [...products];
    if (filters.brandIds.length) {
      const set = new Set(filters.brandIds.map((b) => b.toLowerCase()));
      list = list.filter((p) => set.has((p.vendor || p.attributes?.Brand || "").toLowerCase()));
    }
    if (filters.minPrice != null) list = list.filter((p) => (p.price ?? 0) >= filters.minPrice);
    if (filters.maxPrice != null) list = list.filter((p) => (p.price ?? 0) <= filters.maxPrice);
    if (sort === "price_asc") list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === "price_desc") list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "discount_desc") list.sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
    else if (sort === "newest") list.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    if (pinned?.length) {
      const first = [];
      const used = new Set();
      for (const pin of pinned) {
        const hit = list.find((p) => !used.has(p.id) && (p.id.toLowerCase() === String(pin).toLowerCase() || p.upid === String(pin)));
        if (hit) {
          used.add(hit.id);
          first.push(hit);
        }
      }
      list = [...first, ...list.filter((p) => !used.has(p.id))];
    }
    return list;
  }, [products, filters, sort, pinned]);

  const blocks = useMemo(() => {
    if (!rails || rails.length === 0 || reels.length === 0) return [{ type: "products", items: visible, key: "all-products" }];
    const byId = new Map(reels.map((r) => [r.id.toLowerCase(), r]));
    const sorted = [...rails].sort((a, b) => a.insertAfter - b.insertAfter);
    const out = [];
    let at = 0;
    sorted.forEach((rail, i) => {
      const end = Math.min(visible.length, 2 * rail.insertAfter);
      if (end > at) {
        out.push({ type: "products", items: visible.slice(at, end), key: `products-chunk-${at}` });
        at = end;
      }
      const rs = rail.videoIds.map((v) => byId.get(v.toLowerCase())).filter(Boolean);
      if (rs.length) out.push({ type: "rail", reels: rs, key: `rail-${i}` });
    });
    if (at < visible.length) out.push({ type: "products", items: visible.slice(at), key: `products-chunk-${at}` });
    return out;
  }, [visible, rails, reels]);

  const activeFilterCount = filters.brandIds.length + filters.sizes.length + (filters.minPrice != null || filters.maxPrice != null ? 1 : 0);
  const sortLabel = SORTS.find((s) => s.value === sort && s.value !== "relevance")?.label ?? "Sort by";

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-40 bg-white/95 px-4 pt-3 pb-2 border-b border-[#EEE8EC] backdrop-blur-md">
        <div className="mb-2.5 flex items-center justify-between">
          <button type="button" className="mt-1 flex min-w-0 items-center rounded-[8px] py-1 text-left text-[12px] font-semibold transition md:mt-0 md:max-w-[240px] md:px-2 md:text-[13px] text-black/60 hover:bg-gray-100" aria-label="Select delivery address">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Select an address</span>
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-4 text-black">
            <Link href="/wishlist" className="relative cursor-pointer transition hover:opacity-85 active:scale-95" aria-label="Wishlist">
              <img alt="Wishlist" width={20} height={20} className="h-[19px] w-[19px] object-contain" src="/profile/profile-like.svg" />
              {wishlist.length > 0 && <span className="absolute -right-[1px] top-[1px] border-[1.5px] border-white h-[7px] w-[7px] rounded-full bg-[#A92645]" />}
            </Link>
            <Link href="/profile" className="flex items-center justify-center rounded-full text-[#1C1B1F] transition hover:bg-[#F3EEF1]" aria-label="Profile">
              <img alt="User" width={20} height={20} className="h-[21px] w-[21px] object-contain" src="/profile/profile-user.svg" />
            </Link>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[4px] border border-[#C8C5D0] bg-white text-[12px] text-[#1C1B1F] transition hover:border-[#A0146C]">
            <img alt="Filter" width={18} height={18} className="h-[15px] w-[15px] object-contain" src="/search/mingcute_filter-line.svg" />
            Filters
            {activeFilterCount > 0 ? <span className="rounded-full bg-[#A0146C] px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span> : null}
          </button>
          <div className="relative min-w-0 flex-1">
            <button type="button" onClick={() => setSortOpen((o) => !o)} className="flex h-8 w-full items-center justify-between gap-2 rounded-[4px] border border-[#C8C5D0] bg-white px-3 text-[12px] text-[#1C1B1F]">
              <span className="truncate">{sortLabel}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-[#74707A] transition ${sortOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {sortOpen && (
              <ul className="absolute left-0 right-0 top-9 z-50 overflow-hidden rounded-[4px] border border-[#C8C5D0] bg-white shadow-lg">
                {SORTS.map((s) => (
                  <li key={s.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setSort(s.value);
                        setSortOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-[12px] hover:bg-[#FDF3F8] ${sort === s.value ? "font-semibold text-[#A0146C]" : "text-[#1C1B1F]"}`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>
      <div className="px-3.5 py-3">
        {visible.length !== 0 ? (
          <div className="space-y-6">
            {blocks.map((b) =>
              b.type === "products" ? (
                b.items.length === 0 ? null : (
                  <div key={b.key} className="grid grid-cols-2 gap-x-3 gap-y-4">
                    {b.items.map((p) => (
                      <ProductGridCard
                        key={p.id}
                        product={p}
                        onAdded={(pr) => {
                          setToast(`"${pr.title}" added to cart`);
                          setTimeout(() => setToast(null), 2500);
                        }}
                      />
                    ))}
                  </div>
                )
              ) : (
                <ReelRail key={b.key} reels={b.reels} />
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C8C5D0]/50 p-12 text-center bg-[#FCF8FD]/30 my-6">
            <p className="text-[14px] font-semibold text-[#1C1B1F]">No products found</p>
            <p className="text-[12px] text-[#74707A] mt-1">Try adjusting your filters or search keywords.</p>
            {activeFilterCount > 0 && (
              <button type="button" onClick={() => setFilters({ brandIds: [], sizes: [], minPrice: null, maxPrice: null, category: null })} className="mt-4 inline-flex items-center rounded-xl bg-[#A0146C] px-4 py-2 text-[12px] font-semibold text-white">
                Clear filters
              </button>
            )}
          </div>
        )}
        <div className="h-1" aria-hidden="true" />
        <div className="py-4 text-center text-sm text-[#74707A]" aria-live="polite" />
      </div>
      <FilterSheet key={String(filtersOpen)} open={filtersOpen} onClose={() => setFiltersOpen(false)} draft={filters} brands={brands} priceFacet={priceFacet} onApply={(f) => (setFilters(f), setFiltersOpen(false))} />
      {toast && (
        <div role="status" className="fixed bottom-28 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-[#1C1B1F] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          <span className="max-w-[240px] truncate block">{toast}</span>
        </div>
      )}
    </div>
  );
}
