"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Search, Star } from "lucide-react";
import { addToCart, useCart } from "@/lib/cart";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";
import { availableValues, buildOptionGroups, findVariant, inStock, optionNames, selectionOf } from "@/lib/variants";

const money = (n) => (n === null || n === undefined ? "" : `₹${Math.round(n).toLocaleString("en-IN")}`);

const COLOR_HEX = { black: "#1C1B1F", white: "#FFFFFF", red: "#B3244B", blue: "#2563EB", green: "#16A34A", yellow: "#EAB308", purple: "#9333EA", pink: "#EC4899", gray: "#6B7280", grey: "#6B7280", navy: "#1E3A8A", beige: "#F5F5DC", brown: "#78350F", maroon: "#800000", teal: "#0D9488", orange: "#EA580C" };

const isColorLabel = (l) => l.toLowerCase().includes("color") || l.toLowerCase().includes("colour");
const isSizeLabel = (l) => l.toLowerCase().includes("size");

// ---- derived helpers (colour of a variant, image list for it)
function colorOf(product, v) {
  if (!v) return null;
  if (product.option1Name && isColorLabel(product.option1Name) && v.option1) return v.option1.trim();
  if (product.option2Name && isColorLabel(product.option2Name) && v.option2) return v.option2.trim();
  if (product.option3Name && isColorLabel(product.option3Name) && v.option3) return v.option3.trim();
  if (v.option2?.trim()) return v.option2.trim();
  if (v.title && v.title.includes("/")) {
    const p = v.title.split("/").map((x) => x.trim());
    if (p[1]) return p[1];
  }
  return v.option1?.trim() ? v.option1.trim() : null;
}
const imgList = (arr) => (Array.isArray(arr) ? arr.map((r) => (typeof r === "string" ? r.trim() : r && typeof r.url === "string" ? r.url.trim() : "")).filter(Boolean) : []);
function colorNames(product) {
  const seen = new Set();
  const out = [];
  for (const v of product.variants ?? []) {
    const c = colorOf(product, v);
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      out.push(c);
    }
  }
  return out;
}
function galleryFor(product, variant) {
  const base = imgList(product.images);
  const color = colorOf(product, variant);
  const uniq = (list) => {
    const s = new Set();
    return list.filter((x) => x && !s.has(x) && (s.add(x), true));
  };
  if (color) {
    const byObj = [];
    if (Array.isArray(product.images)) for (const r of product.images) if (r && typeof r === "object" && typeof r.color === "string" && r.color.toLowerCase().trim() === color.toLowerCase() && typeof r.url === "string") byObj.push(r.url.trim());
    if (byObj.length) return [...new Set(byObj)];
    const fromVariants = [];
    if (variant?.imageUrl) fromVariants.push(variant.imageUrl);
    for (const v of product.variants ?? []) {
      const c = colorOf(product, v);
      if (c && c.toLowerCase() === color.toLowerCase() && v.imageUrl && !fromVariants.includes(v.imageUrl)) fromVariants.push(v.imageUrl);
    }
    const names = colorNames(product);
    if (names.length > 1 && base.length >= names.length && base.length % names.length === 0) {
      const per = Math.floor(base.length / names.length);
      const idx = names.findIndex((n) => n.toLowerCase() === color.toLowerCase());
      if (idx !== -1) {
        const slice = base.slice(idx * per, (idx + 1) * per);
        if (slice.length) return slice;
      }
    }
    if (fromVariants.length) return fromVariants;
  }
  const out = [];
  if (variant?.imageUrl) out.push(variant.imageUrl);
  if (product.imageUrl) out.push(product.imageUrl);
  if (product.featuredImageUrl) out.push(product.featuredImageUrl);
  out.push(...base);
  return uniq(out);
}
function swatchImage(product, color) {
  const v = (product.variants ?? []).find((x) => colorOf(product, x)?.toLowerCase() === color.toLowerCase() && x.imageUrl);
  if (v?.imageUrl) return v.imageUrl;
  const base = imgList(product.images);
  const names = colorNames(product);
  if (names.length > 1 && base.length >= names.length && base.length % names.length === 0) {
    const per = Math.floor(base.length / names.length);
    const idx = names.findIndex((n) => n.toLowerCase() === color.toLowerCase());
    if (idx !== -1) return base[idx * per] ?? null;
  }
  return null;
}

/* ---------- header ---------- */

function DetailHeader() {
  const router = useRouter();
  const wishlist = useWishlist();
  const { totalQty } = useCart();
  return (
    <header className="border-b border-[#E4DDE0] bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-[12px]">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74707A]" />
          <input readOnly onFocus={() => router.push("/search")} placeholder="Search for products, creators..." className="h-9 w-full rounded-[4px] border border-[#C8C5D0] pl-9 pr-3 text-[13px] outline-none" />
        </div>
        <div className="flex gap-4">
          <Link href="/wishlist" className="relative cursor-pointer transition hover:opacity-85 active:scale-95">
            <img alt="Wishlist" width={20} height={20} className="h-[20px] w-[20px] object-contain" src="/profile/profile-like.svg" />
            {wishlist.length > 0 && <span className="absolute -right-[1px] top-[1px] border border-[1.5px] border-white size-[7px] rounded-full bg-[#A92645]" />}
          </Link>
          <Link href="/cart" aria-label={`Cart, ${totalQty} items`} className="group relative flex h-5 w-5 items-center justify-center text-[#5A5562] transition hover:text-[#A0146C] cursor-pointer hover:opacity-85 active:scale-95">
            <img alt="Cart" width={20} height={20} className="h-[19px] w-[19px] mt-1 object-contain" src="/shop/shop-cart.svg" />
            {totalQty > 0 && <span className="absolute flex h-3 min-w-3 items-center justify-center rounded-full bg-[#A92645] px-0.5 text-[8px] font-bold leading-none text-white right-0 top-0">{totalQty > 99 ? "99+" : totalQty}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- gallery ---------- */

function Gallery({ product, variant }) {
  const images = useMemo(() => galleryFor(product, variant), [product, variant]);
  const [idx, setIdx] = useState(0);
  const wishlist = useWishlist();
  const wished = wishlist.includes(product.id);
  const touch = useRef({ s: null, e: null });
  const multi = images.length > 1;
  const current = images[Math.min(idx, Math.max(images.length - 1, 0))] ?? null;
  return (
    <section className="relative bg-[#EFEDEA]">
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E3DD] touch-pan-y"
        onTouchStart={(e) => (touch.current.s = e.touches[0].clientX)}
        onTouchMove={(e) => (touch.current.e = e.touches[0].clientX)}
        onTouchEnd={() => {
          const { s, e } = touch.current;
          if (!s || !e) return;
          const d = s - e;
          if (d > 40 && multi) setIdx((i) => (i + 1) % images.length);
          else if (d < -40 && multi) setIdx((i) => (i - 1 + images.length) % images.length);
          touch.current = { s: null, e: null };
        }}
      >
        {current ? (
          <button type="button" className="block h-full w-full cursor-zoom-in" aria-label="Open image gallery">
            <img src={current} alt={product.title} className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8B8594]">No image available</div>
        )}
        <div className="absolute bottom-9 right-4 z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigator.share?.({ title: product.title, url: location.href }).catch(() => {})}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <span className="flex size-[40px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 pl-[0.5px] pt-[1px]">
              <img src="/shop/shop-share.svg" alt="Share" className="size-[25px] mr-0.5 object-contain" />
            </span>
          </button>
          <button type="button" onClick={() => toggleWishlist(product.id)} className="group flex flex-col items-center gap-1 cursor-pointer">
            <span className="flex size-[40px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 pl-[0.5px] pt-[1px]">
              <img src={wished ? "/shop/shop-heart-filled.svg" : "/shop/shop-heart.svg"} alt="Wishlist" className="size-[26px] object-contain" />
            </span>
          </button>
        </div>
      </div>
      {multi && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 ">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => setIdx(i)} className={`h-2 cursor-pointer rounded-full transition-all ${idx === i ? "w-2 bg-white" : "w-2 bg-white/50"}`} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- colours + options ---------- */

function ColorSwatch({ option }) {
  return (
    <>
      <span className={`block aspect-square overflow-hidden rounded-[4px] border ${option.isCurrent ? "border-[#B3244B]" : "border-[#E1DDE1]"}`}>
        {option.imageUrl ? <img src={option.imageUrl} alt={option.color ?? "Colour option"} className="h-full w-full object-cover" /> : <span className="block h-full w-full bg-[#F2EEF1]" />}
      </span>
      <span className="mt-1 block truncate text-[10px] font-medium text-[#47464F]">{option.color ?? "Colour"}</span>
    </>
  );
}

function ColourLinks({ options }) {
  if (!options || options.length <= 1) return null;
  const current = options.find((o) => o.isCurrent)?.color;
  return (
    <div>
      <p className="mb-2 text-[15px] font-semibold text-[#1C1B1F]">
        Colours: <span className="font-medium">{current ?? ""}</span>
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
        {options.map((o) =>
          o.isCurrent ? (
            <div key={o.productId} aria-current="true" className="w-[72px] shrink-0 text-left">
              <ColorSwatch option={o} />
            </div>
          ) : (
            <Link key={o.productId} href={`/shop/${o.productId}`} prefetch={false} className="w-[72px] shrink-0 text-left">
              <ColorSwatch option={o} />
            </Link>
          )
        )}
      </div>
    </div>
  );
}

function VariantOptions({ product, selectedVariant, onSelect, disabled }) {
  const names = useMemo(() => optionNames(product), [product]);
  const groups = useMemo(() => buildOptionGroups(product.variants, names), [product.variants, names]);
  const [selection, setSelection] = useState(() => selectionOf(selectedVariant));
  if (groups.length === 0) return null;
  const pick = (key, value) => {
    const next = { ...selection, [key]: value };
    const v = findVariant(product.variants, next);
    setSelection(next);
    if (v) onSelect(v);
  };
  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const avail = availableValues(product.variants, selection, g.key);
        const values = isSizeLabel(g.label)
          ? (() => {
              const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
              return [...g.values].sort((a, b) => {
                const x = order.indexOf(a.toUpperCase());
                const y = order.indexOf(b.toUpperCase());
                return x !== -1 || y !== -1 ? (x === -1 ? 999 : x) - (y === -1 ? 999 : y) : a.localeCompare(b, undefined, { numeric: true });
              });
            })()
          : g.values;
        return (
          <div key={g.key}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[15px] font-semibold text-[#1C1B1F]">
                {g.label}s: <span className="font-medium">{selection[g.key] ?? values[0]}</span>
              </p>
            </div>
            {isColorLabel(g.label) ? (
              <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                {values.map((val) => {
                  const chosen = selection[g.key] === val;
                  const off = disabled || !avail.includes(val);
                  const hex = COLOR_HEX[val.toLowerCase()] ?? "#F2EEF1";
                  const img = swatchImage(product, val);
                  return (
                    <button key={val} type="button" disabled={off} onClick={() => pick(g.key, val)} className="w-[72px] shrink-0 text-left disabled:opacity-45">
                      <span
                        className={`block aspect-square rounded-[4px] border overflow-hidden ${chosen ? "border-[#B3244B]" : "border-[#E1DDE1]"}`}
                        style={{
                          backgroundColor: hex,
                          backgroundImage: img || hex !== "#F2EEF1" ? undefined : "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)",
                          backgroundSize: "14px 14px",
                          backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
                        }}
                      >
                        {img ? <img src={img} alt={val} className="h-full w-full object-cover" /> : null}
                      </span>
                      <span className="mt-1 block truncate text-[10px] font-medium text-[#47464F]">{val}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2.5">
                {values.map((val) => {
                  const chosen = selection[g.key] === val;
                  const off = disabled || !avail.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={off}
                      onClick={() => pick(g.key, val)}
                      className={`h-8 rounded-[4px] border text-[12px] font-semibold transition disabled:cursor-not-allowed ${chosen ? "border-[#B3244B] bg-[#B3244B] text-white" : "border-[#D7D0D5] bg-white text-[#47464F] hover:border-[#B3244B]"} ${off ? "border-dashed bg-[#FAFAFA] text-[#C6C1C6] hover:border-[#D7D0D5]" : ""}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- details / ratings / videos ---------- */

const HIDDEN_ATTR = /(color.?(family|grouping.?code|images)|colorway.?images|manufactur|mfg|packed|item.?weight|weight.?grams|gst|hsn|gtin|vendor.?sku|^sku$|stock.?quantity|inventory|^mrp$|selling.?price|compare.?at|product.?(title|description|id)|short.?description|full.?description|^upid$)/i;
const titleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
const lastCrumb = (s) => {
  const t = s.trim();
  if (!t) return "";
  const p = t.split(/[/>]/).map((x) => x.trim()).filter(Boolean);
  return p.length ? p[p.length - 1] : t;
};

function detailRows(p) {
  const rows = [];
  if (p.vendor) rows.push({ label: "Brand", value: p.vendor });
  const cat = p.category || p.productType;
  if (cat) rows.push({ label: "Article", value: lastCrumb(cat) });
  if (p.attributes && typeof p.attributes === "object") {
    for (const [k, v] of Object.entries(p.attributes)) {
      if (HIDDEN_ATTR.test(k.trim().replace(/[_\s-]+/g, " "))) continue;
      if (typeof v !== "string" || !v.trim() || ["null", "undefined"].includes(v.trim().toLowerCase())) continue;
      const label = titleCase(k);
      if (HIDDEN_ATTR.test(label) || rows.some((r) => r.label.toLowerCase() === label.toLowerCase())) continue;
      rows.push({ label, value: v.trim().split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : "")).join(" ") });
    }
  }
  if (Array.isArray(p.tags)) {
    for (const tag of p.tags) {
      if (typeof tag !== "string" || !tag.includes(":")) continue;
      const [k, ...rest] = tag.split(":");
      const label = titleCase(k.trim());
      const value = rest.join(":").trim();
      if (!label || !value || value.toLowerCase() === "null" || HIDDEN_ATTR.test(k) || rows.some((r) => r.label.toLowerCase() === label.toLowerCase())) continue;
      rows.push({ label, value: value.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : "")).join(" ") });
    }
  }
  if (p.upid && !rows.some((r) => r.label.toLowerCase() === "product id")) rows.push({ label: "Product ID", value: p.upid });
  return rows;
}

function Details({ product }) {
  const [open, setOpen] = useState(false);
  const rows = detailRows(product);
  const cat = product.category || product.productType;
  return (
    <section className="px-4">
      <div className="bg-[#FAFAFA] px-4 py-4 rounded-sm">
        <h2 className="text-[16px] font-semibold text-[#1C1B1F]">Product Details</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
          {rows.map((r) => (
            <div key={r.label}>
              <h3 className="text-[14px] font-semibold text-[#1C1B1F] font-['DM_Sans']">{r.label}</h3>
              <p className="mt-0.5 text-[13px] text-black/60 font-['DM_Sans']">{r.value}</p>
            </div>
          ))}
        </div>
        {open && (
          <div className="mt-5 space-y-4  ">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1B1F]">Description</h3>
              <p className="mt-2 text-[13px] leading-5 text-[#74707A]">{product.description ?? "No description is available for this product yet."}</p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1B1F]">Additional Info</h3>
              <p className="mt-2 text-[13px] leading-5 text-[#74707A]">
                {[product.vendor ? `Brand: ${product.vendor}` : null, cat ? `Article: ${lastCrumb(cat)}` : null, product.returnWindowDays > 0 ? `${product.returnWindowDays}-day returns` : null].filter(Boolean).join(" · ") || "More details will be added soon."}
              </p>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-5 flex w-full items-center justify-between text-[13px] font-semibold text-[#1C1B1F]">
          Additional Details
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className="pt-3" />
    </section>
  );
}

function Ratings({ product }) {
  if (product.rating === undefined || product.ratingCount === undefined || product.reviewCount === undefined) return null;
  return (
    <section className="px-4">
      <h2 className="text-[16px] font-semibold text-[#1C1B1F]">Ratings &amp; Reviews</h2>
      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[5px] bg-[#CFE3D5] text-center text-[#47564C]">
        <div className="flex h-12 items-center justify-center gap-1 border-r border-[#B4CEBD] text-[18px] font-bold text-[#1C1B1F]">
          {product.rating !== undefined ? Number(product.rating).toFixed(1) : "-"}
          <Star className="h-4 w-4 fill-black text-black" />
        </div>
        <div className="flex h-12 flex-col items-center justify-center border-r border-[#B4CEBD] text-[12px] leading-4">
          <span className="font-semibold">{product.ratingCount}</span>Ratings
        </div>
        <div className="flex h-12 flex-col items-center justify-center text-[12px] leading-4">
          <span className="font-semibold">{product.reviewCount}</span>Reviews
        </div>
      </div>
    </section>
  );
}

function VideoReviews({ product }) {
  if (!product.videoReviews || product.videoReviews.length === 0) return null;
  return (
    <section className="px-4">
      <h2 className="text-[16px] font-semibold text-[#1C1B1F]">Video Reviews</h2>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {product.videoReviews.map((v) => (
          <div key={v.id}>
            <video className="aspect-[3/4] w-full rounded-[4px] bg-[#EFEDEA] object-cover" src={v.mediaUrl} poster={v.thumbnailUrl ?? undefined} controls preload="metadata" />
            <div className="mt-2 flex items-center gap-2">
              {v.creator.avatarUrl ? (
                <img src={v.creator.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4D9D2] text-[#B3244B]">{(v.creator.displayName || v.creator.username)[0]}</span>
              )}
              <span className="text-[12px] font-medium text-[#1C1B1F]">{v.creator.displayName || v.creator.username}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- rails ---------- */

function RailCard({ product }) {
  const wishlist = useWishlist();
  const wished = wishlist.includes(product.id);
  const [added, setAdded] = useState(false);
  const img = product.imageUrl ?? product.featuredImageUrl;
  const v = (product.variants ?? []).find(inStock) ?? null;
  const sale = v?.price !== undefined && !Number.isNaN(Number.parseFloat(v.price)) ? Number.parseFloat(v.price) : product.price ?? null;
  const compare = typeof (v?.compareAtPrice ?? product.compareAtPrice) === "number" ? v?.compareAtPrice ?? product.compareAtPrice : Number.parseFloat(v?.compareAtPrice ?? product.compareAtPrice) || null;
  const disc = sale !== null && compare !== null && compare > sale ? Math.round(((compare - sale) / compare) * 100) : v?.discountPercent ?? product.discountPercent ?? null;
  const brand = product.vendor?.trim() || product.attributes?.Brand?.trim() || "PARQIS";
  return (
    <Link href={`/shop/${product.id}`} className="block w-[131px] shrink-0">
      <div className="relative aspect-[67/97] rounded-bl-[4px] rounded-br-[4px] rounded-tl-[14px] rounded-tr-[4px] bg-[#F4F0ED]">
        {img ? <img src={img} alt={product.title} className="h-full w-full rounded-bl-[4px] rounded-br-[4px] rounded-tl-[14px] rounded-tr-[4px] object-cover" /> : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute left-0 top-0 z-30 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
        >
          <img alt="Wishlist" className="size-[18px] object-contain transition-transform duration-200 active:scale-95" src={wished ? "/shop/shop-heart-filled.svg" : "/shop/shop-heart.svg"} />
        </button>
        {product.rating != null && product.rating > 0 && (
          <span className="absolute -bottom-2 left-0 z-10 inline-flex items-center gap-1 rounded-full bg-[#B5D2A2] px-2 py-0.5 text-[10px] font-semibold text-[#1B7307] shadow-xs">
            <Star className="h-2.5 w-2.5 fill-[#1B7307] text-[#1B7307]" />
            {product.rating.toFixed(1)}
          </span>
        )}
        <button
          type="button"
          disabled={!v}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!v) return;
            addToCart(product, v);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
          aria-label={added ? `Product ${product.title} added to cart` : `Add ${product.title} to cart`}
          className="absolute bottom-[0px] right-[0px] z-30 flex size-[28px] items-center justify-center rounded-full bg-white/80 backdrop-blur-[2px] text-[#A92645] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer disabled:opacity-45"
        >
          <img alt="Add to cart" loading="lazy" width={14} height={14} className="h-[13px] w-[13px] object-contain" src="/add-to-cart.svg" />
        </button>
      </div>
      <div className="mt-3">
        <p className="line-clamp-1 text-sm font-bold text-[#1C1B1F]">{product.title}</p>
        <p className="line-clamp-1 text-xs text-[#74707A]">{brand}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="text-sm font-bold text-[#1C1B1F]">{money(sale)}</span>
          {compare && sale !== null && compare > sale && <span className="text-xs text-[#8B8594] line-through">{money(compare)}</span>}
          {disc && disc > 0 && <span className="text-xs font-semibold text-[#0CB72E]">{disc}%</span>}
        </div>
      </div>
    </Link>
  );
}

function Rail({ title, products, product }) {
  if (products.length === 0) return null;
  const q = (() => {
    const t = product.productType?.trim() || product.category?.trim();
    return t ? lastCrumb(t) : product.vendor || "";
  })();
  return (
    <section className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1C1B1F]">{title}</h2>
        <Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#B3244B]">
          View more
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar">
        {products.map((p, i) => (
          <RailCard key={`${title}-${p.id}-${i}`} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ---------- bottom bar ---------- */

function BuyBar({ status, isOutOfStock, unavailablePrice, salePrice, canBuy, busy, onBuyNow, onAddToCart }) {
  return (
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-[60] w-full max-w-[430px] -translate-x-1/2 rounded-[50px] bg-white/10 backdrop-blur-sm px-[14px] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_22px_rgba(28,27,31,0.08)]">
      {status && (
        <p className="mb-2 text-center text-[12px] font-medium text-[#B3244B]" role="status">
          {status}
        </p>
      )}
      {isOutOfStock ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-3">
          <div className="min-w-0">
            <p className="text-[18px] font-bold text-[#1C1B1F]">Out of stock</p>
            {unavailablePrice !== null && (
              <p className="text-[11px] text-[#8B8594]">
                <span>{money(unavailablePrice)}</span>
                <span className="block whitespace-nowrap">inclusive of all taxes</span>
              </p>
            )}
          </div>
          <button type="button" className="inline-flex items-center justify-center gap-1.5 h-12 w-full rounded-[4px] bg-[#B3244B] text-base font-medium text-white">
            Notify me
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onBuyNow} disabled={!canBuy || busy} className="h-12 cursor-pointer rounded-[4px] bg-[#B3244B] text-base font-medium text-white disabled:cursor-not-allowed disabled:bg-[#C8C5D0]">
            {busy ? "Starting..." : `Buy now @ ${money(salePrice)}`}
          </button>
          <button type="button" onClick={onAddToCart} disabled={!canBuy || busy} className="h-12 cursor-pointer rounded-[4px] border border-[#B3244B] text-base font-medium text-[#B3244B] disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Adding..." : "Add To Cart"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- main ---------- */

export default function ProductDetail({ product }) {
  const router = useRouter();
  const [variant, setVariant] = useState(() => product.variants.find(inStock) ?? product.variants[0] ?? null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const priceOf = (v, fallback) => {
    if (v?.price !== undefined) {
      const n = Number.parseFloat(v.price);
      if (!Number.isNaN(n)) return n;
    }
    return fallback ?? null;
  };
  const sale = priceOf(variant, product.price ?? undefined);
  const compare = (() => {
    const r = variant?.compareAtPrice ?? product.compareAtPrice;
    if (typeof r === "number") return r;
    if (typeof r === "string") {
      const n = Number.parseFloat(r);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  })();
  const discount = sale !== null && compare !== null && compare > sale ? Math.round(((compare - sale) / compare) * 100) : variant?.discountPercent ?? product.discountPercent ?? null;
  const canBuy = inStock(variant);
  const outOfStock = !product.variants.some(inStock);
  const rails = product.productRails ?? [];

  const add = () => {
    if (!variant || !inStock(variant)) {
      setStatus("This product is out of stock.");
      return false;
    }
    addToCart(product, variant);
    return true;
  };
  const onAdd = () => {
    setStatus(null);
    setBusy(true);
    if (add()) setStatus("Added to cart");
    setBusy(false);
  };
  const onBuy = () => {
    setBusy(true);
    setStatus(null);
    if (add()) router.push("/cart");
    setBusy(false);
  };

  return (
    <div className="overflow-x-clip bg-white pb-24">
      <div className="mx-auto w-full max-w-6xl">
        <DetailHeader />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-0">
          <Gallery key={colorOf(product, variant) ?? "none"} product={product} variant={variant} />
          <div className="space-y-6 bg-white">
            <section className="px-4 pt-3">
              {product.expressShipping && <span className="inline-flex rounded-[3px] bg-[#CFE9D7] px-2 py-0.5 text-[11px] font-bold text-[#50815C]">Express Shipping</span>}
              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-[20px] font-semibold leading-tight text-black font-['DM_Sans']">{product.vendor || product.attributes?.Brand || "PARQIS"}</h1>
                  <p className="mt-0.5 line-clamp-1 text-[12px] font-normal text-black/60 font-['DM_Sans']">{product.title}</p>
                </div>
                <div className="shrink-0 text-right">
                  {outOfStock ? (
                    <p className="text-[16px] font-semibold text-black font-['DM_Sans']">Out of stock</p>
                  ) : (
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-[24px] font-semibold text-black font-['DM_Sans']">{money(sale)}</span>
                      {discount && discount > 0 && <span className="text-[14px] font-light text-green-600 font-['DM_Sans']">{discount}%</span>}
                    </div>
                  )}
                  {compare && sale !== null && compare > sale ? (
                    <div className="text-[10px] font-light text-black/50 font-['DM_Sans']">
                      <span>MRP </span>
                      <span className="line-through">{money(compare)}</span>
                      <span> Inc. of all taxes</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-light text-black/50 font-['DM_Sans']">
                      <span>Inc. of all taxes</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="px-4">
              {product.colorOptions && product.colorOptions.length > 1 && (
                <div className="mb-5">
                  <ColourLinks options={product.colorOptions} />
                </div>
              )}
              <VariantOptions product={product} selectedVariant={variant} onSelect={setVariant} disabled={outOfStock} />
              {status && <p className="mt-3 text-[13px] font-medium text-[#B3244B]">{status}</p>}
            </section>
            <Details product={product} />
            <Ratings product={product} />
            <VideoReviews product={product} />
          </div>
        </div>
        <div className="mt-8 space-y-8">
          {rails.map((r) => (
            <Rail key={r.title} title={r.title} products={r.products} product={product} />
          ))}
        </div>
      </div>
      <BuyBar status={status} isOutOfStock={outOfStock} unavailablePrice={sale ?? compare} salePrice={sale} canBuy={canBuy} busy={busy} onBuyNow={onBuy} onAddToCart={onAdd} />
    </div>
  );
}
