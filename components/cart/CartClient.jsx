"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, LoaderCircle, Star } from "lucide-react";
import { addToCart, changeVariant, readSelection, removeFromCart, setQty, useCart, writeSelection } from "@/lib/cart";
import { useDeliveryLocation } from "@/lib/delivery";
import { optionNames as namesOf } from "@/lib/variants";
import { inStock } from "@/lib/variants";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";
import DeliverySheet from "../DeliverySheet";
import QuickAddSheet, { needsOptions } from "../QuickAddSheet";
import VariantSelector from "../VariantSelector";
import recommended from "@/src/data/recommended.json";

const inr = (v) => {
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
};

/* ---- line helpers (ported from the original cart item module) ---- */
const isAvailable = (e) => e.available !== false && (typeof e.availableQty === "number" ? e.availableQty > 0 : typeof e.inventoryQty !== "number" || e.inventoryQty > 0);
const maxQty = (e) => (e.available === false ? 0 : typeof e.availableQty === "number" ? Math.max(0, e.availableQty) : typeof e.inventoryQty === "number" ? Math.max(0, e.inventoryQty) : 99);
const stockText = (e) => {
  if (!isAvailable(e)) return { text: "Out of Stock", tone: "out" };
  const q = maxQty(e);
  return q <= 3 ? { text: `Only ${q} left!`, tone: "low" } : { text: "In Stock", tone: "ok" };
};
const optionLabel = (e) => {
  const o = [e.option1, e.option2, e.option3].filter(Boolean);
  return o.length > 0 ? o.join(" · ") : e.variantTitle ?? "";
};
const sizeOf = (e) => {
  const list = [
    { name: e.option1Name, value: e.option1 },
    { name: e.option2Name, value: e.option2 },
    { name: e.option3Name, value: e.option3 },
  ];
  for (const o of list) if ((o.name?.toLowerCase() ?? "").includes("size") && o.value) return o.value;
  for (const o of list) if (o.value) return o.value;
  return null;
};
const toLine = (i) => ({
  id: i.variantId,
  productId: i.productId,
  title: i.title,
  imageUrl: i.imageUrl ?? "",
  priceInr: i.price,
  compareAtPriceInr: i.compareAtPrice ?? null,
  discountPercent: i.discountPercent ?? null,
  qty: i.qty,
  variantTitle: i.label || undefined,
  vendor: i.vendor,
  option1: i.option1,
  option2: i.option2,
  option3: i.option3,
  option1Name: i.option1Name,
  option2Name: i.option2Name,
  option3Name: i.option3Name,
  inventoryQty: i.inventoryQty,
  rating: i.rating,
  reviewCount: i.reviewCount,
  variants: i.variants ?? [],
});

/* ---------- empty ---------- */

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center min-h-[60vh]">
      <div className="relative w-[200px] h-[200px]">
        <img src="/cart/empty_cart_cat.svg" alt="Cart is empty" className="w-full h-full object-contain" />
      </div>
      <h2 className="mt-4 text-[20px] font-bold ">Cart is empty</h2>
      <p className="mt-1.5 text-[12px]">
        Looks like you haven&apos;t added
        <br />
        anything yet
      </p>
      <Link href="/" className="mt-4 inline-flex h-[48px] min-w-[220px] items-center justify-center rounded-sm bg-[#A92645] px-8 text-[16px] font-bold text-white transition hover:bg-[#86105B] shadow-md">
        Continue Shopping
      </Link>
    </div>
  );
}

/* ---------- address strip ---------- */

function AddressStrip() {
  const [open, setOpen] = useState(false);
  const loc = useDeliveryLocation();
  const heading = !loc ? "Add delivery address" : loc.kind === "address" ? (loc.address.labelType === "work" ? "Delivering to Work" : loc.address.labelType === "other" ? `Delivering to ${loc.address.customLabel ?? "Other"}` : "Delivering to Home") : `Delivering to ${loc.label}`;
  const prefix = heading.startsWith("Delivering to ") ? { prefix: "Delivering to", value: heading.replace("Delivering to ", "") } : { prefix: "", value: heading };
  const detail = !loc ? "Select an address to see delivery options." : loc.kind === "address" ? [loc.address.line1, loc.address.line2, `${loc.address.city}, ${loc.address.state} ${loc.address.pincode}`].filter(Boolean).join(", ") : loc.pincode ? `Pincode ${loc.pincode}` : loc.label;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-sm border border-black/30 bg-white p-3.5 text-left transition hover:border-[#A0146C]/40 ">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDF3F8] text-black">
              <img src="/mingcute_location-fill.svg" alt="Location" className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-normal text-black/40">{prefix.prefix && <span>{prefix.prefix}</span>}</p>
              <p className="text-[12px] font-normal text-black">{prefix.value}</p>
              <p className="mt-1 line-clamp-2 text-[10px] font-normal leading-snug text-black">{detail}</p>
              {loc?.kind === "address" && loc.address.phone && <p className="mt-0.5 text-[10px] font-normal text-black">{loc.address.phone}</p>}
            </div>
          </div>
          <span className="flex shrink-0 items-center text-[10px] font-normal text-[#A92646] hover:underline mt-0.5">Change &gt;</span>
        </div>
      </button>
      <DeliverySheet open={open} onOpenChange={setOpen} />
    </>
  );
}

/* ---------- select-all bar ---------- */

function SelectionBar({ allSelected, someSelected, selectedCount, totalCount, onSelectAll, onClearAll, onDeleteSelected, onShare }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someSelected;
  }, [someSelected]);
  return (
    <div className="flex items-center justify-between rounded-sm bg-white">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input ref={ref} type="checkbox" checked={allSelected} onChange={(e) => (e.target.checked ? onSelectAll() : onClearAll())} className="sr-only" />
        <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-sm border transition ${allSelected ? "border-[#C41E5A] bg-[#A92645] text-white" : someSelected ? "border-[#C41E5A] bg-[#A92645] text-[#C41E5A]" : "border-[#C8C5D0] bg-white"}`}>
          {allSelected && <img src="/cart/mingcute_check-fill.svg" alt="" className="h-3 w-3 filter brightness-0 invert" />}
          {!allSelected && someSelected && <span className="h-2 w-2 rounded-xs bg-[#C41E5A]" />}
        </div>
        <span className="text-xs font-normal text-[#1C1B1F]">
          {selectedCount}/{totalCount} items Selected
        </span>
      </label>
      <div className="flex items-center">
        <button type="button" onClick={onShare} className="rounded-sm p-2 text-[#47464F] hover:bg-[#F3F3F3]" aria-label="Share selected items">
          <img src="/cart/mingcute_share-2-line.svg" alt="Share" className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDeleteSelected} disabled={selectedCount === 0} className="rounded-sm p-2 text-[#47464F] hover:bg-[#F3F3F3] disabled:opacity-40" aria-label="Delete selected items">
          <img src="/cart/Trash.svg" alt="Delete" className="h-4 w-4" />
        </button>
        <button type="button" disabled={selectedCount === 0} className="rounded-sm p-2 text-[#47464F] hover:bg-[#F3F3F3] disabled:opacity-40" aria-label="Move selected items to wishlist">
          <img src="/cart/mingcute_heart-line.svg" alt="Wishlist" className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}

/* ---------- one cart line ---------- */

function CartItem({ item, checked, onCheckedChange, onQtyChange, onRemove, onOpenVariant }) {
  const wishlist = useWishlist();
  const wished = item.productId ? wishlist.includes(item.productId) : false;
  const unavailable = !isAvailable(item);
  const stock = stockText(item);
  const cap = maxQty(item);
  const atMax = !unavailable && item.qty >= cap;
  const size = sizeOf(item);
  const label = optionLabel(item);
  const discount = item.discountPercent ?? (item.compareAtPriceInr && item.compareAtPriceInr > item.priceInr ? Math.round(((item.compareAtPriceInr - item.priceInr) / item.compareAtPriceInr) * 100) : null);
  const href = item.productId ? `/shop/${item.productId}` : null;
  const Wrap = ({ className, children }) => (href ? <Link href={href} className={className}>{children}</Link> : <div className={className}>{children}</div>);
  return (
    <article className={`relative overflow-hidden rounded-sm border border-black/30 bg-white p-3 shadow-xs transition ${checked === false || unavailable ? "border-[#E5E2EA] opacity-75" : "border-[#E5E2EA]"}`}>
      <div className="flex items-start gap-3">
        <div className={`relative flex w-[117px] aspect-[117/168] shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#F3F3F3] ${unavailable ? "opacity-60" : ""}`}>
          <label className={`absolute left-1.5 top-1.5 z-10 flex items-center ${unavailable ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
            <input type="checkbox" checked={!unavailable && (checked ?? true)} disabled={unavailable} onChange={(e) => onCheckedChange(e.target.checked)} className="sr-only" aria-label={`Select ${item.title}`} />
            <div className={`flex h-5 w-5 items-center justify-center rounded-sm transition ${!unavailable && (checked ?? true) ? "border-[#C41E5A] bg-[#A92645] text-white shadow-xs" : "border-[#C8C5D0] bg-white shadow-xs"}`}>
              {!unavailable && (checked ?? true) && <img src="/cart/mingcute_check-fill.svg" alt="" className="h-3 w-3 filter brightness-0 invert" />}
            </div>
          </label>
          <Wrap className="relative flex h-full w-full items-center justify-center">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : <div className="h-6 w-6 rounded-sm bg-gray-200" />}
            <span className="absolute inset-x-0 bottom-0 h-4 rounded-tr-sm rounded-tl-sm flex items-center justify-center gap-1 bg-[#D9D9D9] py-1 text-[10px] text-white">
              <img src="/cart/mdi_eye-outline.svg" alt="" className="h-3 w-3 filter brightness-0 invert" />
              Quick View
            </span>
          </Wrap>
        </div>
        <div className="min-w-0 flex-1">
          <Wrap className="block min-w-0 pr-8">
            <h3 className="line-clamp-1 text-sm font-semibold text-[#1C1B1F]">{item.title}</h3>
            {label && <p className="mt-0.5 line-clamp-1 text-[10px] font-normal leading-relaxed text-[#74707A]">{label}</p>}
          </Wrap>
          <button type="button" onClick={onRemove} className="absolute right-3 top-3 z-10 flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#F3F3F3] text-[#74707A] transition-all hover:bg-[#E5E2EA] hover:scale-105 active:scale-95 cursor-pointer" aria-label="Remove item">
            <img src="/cart/mingcute_close-medium-line.svg" alt="Remove" className="h-4 w-4" />
          </button>
          <div className="mt-2 flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-light text-[#1C1B1F]">Qty</span>
              <div className="inline-flex items-center rounded-full bg-[#9DBFAD] px-1.5 py-0.5">
                <button type="button" onClick={() => (item.qty === 1 ? onRemove() : onQtyChange(item.qty - 1))} className="flex h-4 w-4 items-center justify-center text-white hover:opacity-80" aria-label={item.qty === 1 ? "Remove item" : "Decrease quantity"}>
                  {item.qty === 1 ? <img src="/cart/Trash.svg" alt="Remove" className="h-3.5 w-3.5 filter brightness-0 invert" /> : <span className="text-[15px] font-bold leading-none text-white">−</span>}
                </button>
                <span className="min-w-5 text-center text-sm font-semibold text-white tracking-wide">{item.qty}</span>
                <button type="button" onClick={() => !atMax && !unavailable && onQtyChange(item.qty + 1)} disabled={atMax || unavailable} className="flex h-5 w-5 items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-80" aria-label="Increase quantity">
                  <img src="/cart/Icon.svg" alt="Plus" className="h-3 w-3 filter brightness-0 invert" />
                </button>
              </div>
            </div>
            {size && onOpenVariant && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-light text-[#1C1B1F]">Size</span>
                <button type="button" onClick={onOpenVariant} className="inline-flex items-center gap-1 rounded-sm border border-[#E5E2EA] bg-white px-1 py-0.5 text-[10px] font-normal text-[#1C1B1F] tracking-wide hover:border-[#A0146C]">
                  {size}
                  <img src="/cart/mdi_keyboard-arrow-down.svg" alt="" className="h-3.5 w-3.5 opacity-70" />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-base font-medium text-[#1C1B1F]">{inr(item.priceInr)}</span>
            {item.compareAtPriceInr && item.compareAtPriceInr > item.priceInr && <span className="text-xs font-medium text-[#9C97A6] line-through">{inr(item.compareAtPriceInr)}</span>}
            {discount && discount > 0 && <span className="rounded-[10px] bg-[#A92645] px-1.5 py-0.5 text-[10px] font-normal text-white">{discount}% Off</span>}
          </div>
          <p className={`mt-1 text-[10px] font-medium ${stock.tone === "out" ? "text-[#B3244B]" : stock.tone === "low" ? "text-[#C41E5A]" : "text-[#1F8A4C]"}`}>{stock.text}</p>
          {item.rating != null && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#B5D2A2] px-2 py-0.5 text-[10px] font-normal text-[#1B7307]">
                <svg className="h-2.5 w-2.5 fill-[#1B7307]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating}
              </span>
              {item.reviewCount != null && item.reviewCount > 0 && <span className="text-[10px] font-normal text-[#47464F]">{item.reviewCount >= 1e3 ? `${(item.reviewCount / 1e3).toFixed(2)}K+` : item.reviewCount}</span>}
            </div>
          )}
          {!unavailable && atMax && <p className="mt-1 text-xs font-normal tracking-wide text-[#A92645]">Max limit reached</p>}
        </div>
      </div>
      {item.productId && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(item.productId);
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-3 bottom-3 z-10 flex h-[25px] w-[25px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_1px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
        >
          <img alt="Wishlist" src={wished ? "/shop/shop-heart-filled.svg" : "/shop/shop-heart.svg"} className="size-[18px] object-contain transition-transform duration-200 active:scale-95" />
        </button>
      )}
    </article>
  );
}

/* ---------- order summary ---------- */

function OrderSummary({ selectedCount, subtotal }) {
  const free = subtotal > 0;
  return (
    <section className="rounded-sm border border-black/30 bg-white p-4 shadow-xs">
      <h2 className="text-[14px] font-normal text-[#1C1B1F]">Order Summary</h2>
      <div className="mt-4 space-y-3 text-[14px] font-normal">
        <div className="flex justify-between text-[#1C1B1F]">
          <span>Items ({selectedCount})</span>
          <span>{inr(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-[#1C1B1F]">
          <span className="flex items-center gap-1">
            Shipping
            <img src="/cart/mdi_eye-outline.svg" alt="" className="h-3.5 w-3.5 opacity-50 filter brightness-0" />
          </span>
          <span className="flex items-center gap-2">
            {free && subtotal > 0 && <span className="text-[14px] font-normal text-[#9C97A6] line-through">₹40</span>}
            <span className={free ? "text-[14px] font-normal text-[#1F8A4C]" : "text-[10px] font-normal text-[#1C1B1F]"}>{free ? "FREE" : inr(0)}</span>
          </span>
        </div>
        <hr className="border-t border-[#E5E2EA] border-dashed" />
        <div className="flex justify-between pt-1 text-[14px] font-normal text-[#1C1B1F]">
          <span>To Pay</span>
          <span>{inr(subtotal)}</span>
        </div>
      </div>
    </section>
  );
}

/* ---------- recommendations ---------- */

function RecCard({ product, onOpenSheet }) {
  const wishlist = useWishlist();
  const wished = wishlist.includes(product.id);
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState(0);
  const scroller = useRef(null);
  const images = useMemo(() => {
    const out = [];
    if (product.imageUrl) out.push(product.imageUrl);
    if (product.featuredImageUrl && !out.includes(product.featuredImageUrl)) out.push(product.featuredImageUrl);
    for (const s of product.images ?? []) if (s && !out.includes(s)) out.push(s);
    for (const v of product.variants ?? []) if (v.imageUrl && !out.includes(v.imageUrl)) out.push(v.imageUrl);
    return out;
  }, [product]);
  const multi = images.length > 1;
  const v = (product.variants ?? []).find(inStock) ?? null;
  const sale = v?.price !== undefined && !Number.isNaN(Number.parseFloat(v.price)) ? Number.parseFloat(v.price) : product.price ?? null;
  const cmpRaw = v?.compareAtPrice ?? product.compareAtPrice;
  const compare = typeof cmpRaw === "number" ? cmpRaw : typeof cmpRaw === "string" ? (Number.isNaN(Number.parseFloat(cmpRaw)) ? null : Number.parseFloat(cmpRaw)) : null;
  const disc = sale !== null && compare !== null && compare > sale ? Math.round(((compare - sale) / compare) * 100) : v?.discountPercent ?? product.discountPercent ?? null;
  const priceText = (n) => (n === null || Number.isNaN(n) || n <= 0 ? "" : `₹${Math.round(n).toLocaleString("en-IN")}`);
  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const variants = product.variants ?? [];
    if (variants.length > 1 && needsOptions(variants)) {
      onOpenSheet(product);
      return;
    }
    const pick = variants.find(inStock) ?? null;
    if (!pick) {
      onOpenSheet(product);
      return;
    }
    addToCart(product, pick);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  return (
    <Link href={`/shop/${product.id}`} className="group flex w-[calc(50%-6px)] shrink-0 snap-start flex-col justify-between rounded-sm bg-white transition hover:shadow-sm">
      <div className="relative w-full overflow-hidden rounded-sm bg-neutral-100">
        {images.length > 0 ? (
          <div
            ref={scroller}
            onScroll={() => {
              const el = scroller.current;
              if (!el) return;
              const { scrollLeft, clientWidth } = el;
              if (clientWidth > 0) setActive(Math.max(0, Math.min(Math.round(scrollLeft / clientWidth), images.length - 1)));
            }}
            className="no-scrollbar flex aspect-[79/97] shrink-0 snap-x snap-mandatory overflow-x-auto scroll-smooth"
          >
            {images.map((src, i) => (
              <div key={i} className="aspect-[79/97] shrink-0 snap-start">
                <img src={src} alt={`${product.title} - ${i + 1}`} className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-[79/97] items-center justify-center text-[#BBB7C5]">
            <Heart className="h-8 w-8" />
          </div>
        )}
        {multi && (
          <div className="pointer-events-auto absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const el = scroller.current;
                  if (el) {
                    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
                    setActive(i);
                  }
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`size-1 rounded-full transition-all duration-200 ${active === i ? "scale-125 bg-white shadow-xs" : "bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 z-30 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.10),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
        >
          <img alt="Wishlist" src={wished ? "/shop/shop-heart-filled.svg" : "/shop/shop-heart.svg"} className="size-[18px] object-contain transition-transform duration-200 active:scale-95" />
        </button>
        <button
          type="button"
          disabled={!v}
          onClick={onAdd}
          aria-label={added ? `Product ${product.title} added to cart` : `Add ${product.title} to cart`}
          className="absolute right-2 bottom-2 z-30 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/80 backdrop-blur-[2px] text-[#A92645] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
        >
          {added ? <Check className="h-4 w-4 text-[#A92645]" strokeWidth={2.5} /> : <img src="/add-to-cart.svg" alt="Add to cart" width={14} height={14} className="h-[13px] w-[13px] object-contain" />}
        </button>
      </div>
      <div className="mt-2 w-full px-0.5">
        <p className="line-clamp-1 text-sm font-bold text-[#1C1B1F]">{product.title}</p>
        {(product.productType ?? product.category ?? product.vendor) && <p className="line-clamp-1 text-xs text-[#74707A]">{product.productType ?? product.category ?? product.vendor}</p>}
        {product.rating != null && product.rating > 0 && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#B5D2A2] px-2 py-0.5 text-[10px] font-semibold text-[#1B7307] shadow-xs">
            <Star className="h-2.5 w-2.5 fill-[#1B7307] text-[#1B7307]" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="text-sm font-bold text-[#1C1B1F]">{priceText(sale)}</span>
          {compare !== null && sale !== null && compare > sale && <span className="text-xs text-[#8B8594] line-through">{priceText(compare)}</span>}
          {disc && disc > 0 && <span className="text-xs font-semibold text-[#0CB72E]">{disc}%</span>}
        </div>
      </div>
    </Link>
  );
}

function Recommendations({ products, loading }) {
  const [sheet, setSheet] = useState(null);
  if (!loading && products.length === 0) return null;
  return (
    <>
      <section className="mt-6 space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-[#1C1B1F]">You may also like</h2>
          <Link href="/categories" className="flex items-center gap-1 text-xs font-normal text-[#9E2A4B] transition-colors hover:text-[#851C37]">
            <span>View more</span>
            <span className="text-md font-normal">&gt;</span>
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="w-[calc(50%-6px)] shrink-0 rounded-sm space-y-2 animate-pulse">
                <div className="aspect-[79/97] w-full rounded-sm bg-[#EDE9F0]" />
                <div className="h-4 w-3/4 bg-[#EDE9F0] rounded-sm" />
                <div className="h-3 w-1/2 bg-[#EDE9F0] rounded-sm" />
                <div className="h-4 w-2/3 bg-[#EDE9F0] rounded-sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {products.map((p, i) => (
              <RecCard key={`${p.id}-${i}`} product={p} onOpenSheet={setSheet} />
            ))}
          </div>
        )}
      </section>
      {sheet && <QuickAddSheet open product={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}

/* ---------- checkout bar ---------- */

function ProceedBar({ total, disabled, loading, onProceed }) {
  const label = `(${inr(total)}) PROCEED TO CHECKOUT`;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-40 px-4">
      <div className="pointer-events-auto mx-auto max-w-[430px] rounded-sm backdrop-blur-md">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => !disabled && !loading && onProceed()}
          className="inline-flex h-[46px] w-full items-center justify-center rounded-sm px-4 text-[16px] font-semibold text-white transition disabled:cursor-not-allowed gap-2.5 bg-[#A92645] hover:bg-[#86105B] text-white disabled:bg-[#E5E5EA] disabled:text-[#9C97A6] shadow-md transition-all"
        >
          <span className="truncate text-sm font-semibold uppercase tracking-wide">{loading ? "Loading…" : label}</span>
          {!loading && <img src="/cart/forward-arrow.svg" alt="" className="h-4.5 w-4.5 shrink-0 filter brightness-0 invert" />}
        </button>
      </div>
    </div>
  );
}

/* ---------- change-variant sheet ---------- */

function VariantSheet({ item, onClose, onSelect }) {
  const variants = item?.variants ?? [];
  const stocked = variants.filter(inStock);
  const list = stocked.length > 0 ? stocked : variants;
  const names = useMemo(() => (item ? namesOf({ option1Name: item.option1Name, option2Name: item.option2Name, option3Name: item.option3Name }) : {}), [item]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!item) return;
    setSelected(variants.find((v) => v.id === item.id) ?? variants.find(inStock) ?? variants[0] ?? null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);
  if (!item) return null;
  const sale = selected ? Number.parseFloat(selected.price) || 0 : item.priceInr;
  const compare = (selected && Number.parseFloat(selected.compareAtPrice ?? "")) || item.compareAtPriceInr;
  const disc = sale !== null && compare && compare > sale ? Math.round(((compare - sale) / compare) * 100) : item.discountPercent;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px]">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-white px-5 pb-8 pt-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            {sale !== null && <span className="text-[22px] font-bold text-[#1C1B1F]">{inr(sale)}</span>}
            {compare && sale !== null && compare > sale && (
              <>
                <span className="text-[14px] text-[#9C97A6] line-through">{inr(compare)}</span>
                {disc && disc > 0 && <span className="rounded-sm bg-[#C41E5A] px-2 py-0.5 text-[11px] font-bold text-white">{disc}% OFF</span>}
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F3F3] text-[#74707A] hover:bg-[#E5E2EA]" aria-label="Close">
            <img src="/cart/mingcute_close-medium-line.svg" alt="Close" className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <VariantSelector variants={list} optionNames={names} selectedVariant={selected} onSelectVariant={setSelected} />
        </div>
        {error && <p className="mt-3 text-[13px] text-[#C41E5A]">{error}</p>}
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return setError("Select color and size to continue.");
            if (!inStock(selected)) return setError("This variant is out of stock.");
            onSelect(item.id, selected);
            onClose();
          }}
          className="mt-6 flex w-full items-center justify-center rounded-sm bg-[#A0146C] px-4 py-3.5 text-[16px] font-bold text-white transition hover:bg-[#86105B] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Select
        </button>
      </div>
    </div>
  );
}

/* ---------- page client ---------- */

export default function CartClient() {
  const router = useRouter();
  const { items: stored } = useCart();
  const lines = useMemo(() => stored.map(toLine), [stored]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [variantItem, setVariantItem] = useState(null);
  const [proceeding, setProceeding] = useState(false);
  const [recLoading, setRecLoading] = useState(true);
  const started = useRef(false);

  // original shows "Loading cart…" until the first sync completes
  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 200);
    const r = setTimeout(() => setRecLoading(false), 450);
    return () => {
      clearTimeout(t);
      clearTimeout(r);
    };
  }, []);

  // select everything on first mount (original: aB(all ids)), then keep the selection to lines that still exist
  useEffect(() => {
    if (!started.current) {
      if (lines.length === 0) return;
      started.current = true;
      const stored = readSelection();
      const ids = lines.map((l) => l.id);
      const init = stored ? stored.filter((id) => ids.includes(id)) : ids;
      const next = init.length > 0 ? init : ids;
      setSelectedIds(next);
      writeSelection(next);
      return;
    }
    setSelectedIds((cur) => {
      const ids = new Set(lines.map((l) => l.id));
      const next = cur.filter((id) => ids.has(id));
      if (next.length !== cur.length) writeSelection(next);
      return next.length === cur.length ? cur : next;
    });
  }, [lines]);

  const setSelection = (ids) => {
    setSelectedIds(ids);
    writeSelection(ids);
  };
  const selectable = lines.filter(isAvailable);
  const allSelected = selectable.length > 0 && selectedIds.length === selectable.length;
  const someSelected = selectedIds.length > 0 && !allSelected;
  const selectedLines = lines.filter((l) => selectedIds.includes(l.id));
  const subtotal = selectedLines.reduce((n, l) => n + (l.priceInr || 0) * l.qty, 0);
  const rec = useMemo(() => recommended, []);

  if (!hydrated && lines.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center py-16">
        <p className="text-[14px] text-[#74707A]">Loading cart…</p>
      </div>
    );
  }
  if (lines.length === 0) return <EmptyCart />;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Parqis cart", url });
      } catch {}
      return;
    }
    if (navigator.clipboard) await navigator.clipboard.writeText(url);
  };
  const toggle = (id) => {
    const line = lines.find((l) => l.id === id);
    if (line && !isAvailable(line)) return;
    setSelection(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };
  const proceed = () => {
    if (selectedIds.length === 0 || proceeding) return;
    setProceeding(true);
    router.push(`/auth/login?callbackUrl=${encodeURIComponent("/cart/address")}`);
  };

  return (
    <>
      <div className="space-y-1 pb-12">
        <AddressStrip />
        <SelectionBar
          allSelected={allSelected}
          someSelected={someSelected}
          selectedCount={selectedIds.length}
          totalCount={lines.length}
          onSelectAll={() => setSelection(selectable.map((l) => l.id))}
          onClearAll={() => setSelection([])}
          onDeleteSelected={() => selectedLines.forEach((l) => removeFromCart(l.id))}
          onShare={share}
        />
        <div className="space-y-3">
          {lines.map((l) => (
            <CartItem key={l.id} item={l} checked={selectedIds.includes(l.id)} onCheckedChange={(c) => c !== selectedIds.includes(l.id) && toggle(l.id)} onQtyChange={(q) => setQty(l.id, Math.min(q, maxQty(l)))} onRemove={() => removeFromCart(l.id)} onOpenVariant={() => setVariantItem(l)} />
          ))}
        </div>
        <div className="pt-2">
          <OrderSummary selectedCount={selectedIds.length} subtotal={subtotal} />
        </div>
        <Recommendations products={rec} loading={recLoading} />
      </div>
      <ProceedBar total={subtotal} disabled={selectedIds.length === 0} loading={proceeding} onProceed={proceed} />
      <VariantSheet
        item={variantItem}
        onClose={() => setVariantItem(null)}
        onSelect={(oldId, v) => {
          changeVariant(oldId, v);
          if (selectedIds.includes(oldId)) setSelection([...new Set(selectedIds.map((id) => (id === oldId ? v.id : id)))]);
        }}
      />
    </>
  );
}
