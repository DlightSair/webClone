"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Check, ShoppingCart, Trash2 } from "lucide-react";
import { BackHeader, PageShell } from "../PageShell";
import ConfirmDialog from "../ConfirmDialog";
import QuickAddSheet from "../QuickAddSheet";
import { getProduct, isInStock, withVariants } from "@/lib/catalog";
import { toggleWishlist, useWishlistEntries } from "@/lib/wishlist";

const inr = (n) => (n === null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n));
const dateOf = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function Tabs({ outOfStockOnly, onOutOfStockToggle }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full">
      <Link href="/wishlist/collections" className="flex items-center justify-center rounded-sm bg-[#A92645] px-4 py-1 text-center text-[16px] font-medium text-white transition hover:bg-[#6F0D2D]">
        Collections
      </Link>
      <button type="button" onClick={onOutOfStockToggle} className={`flex items-center justify-center rounded-sm border px-4 py-1 text-center text-[16px] font-medium transition ${outOfStockOnly ? "border-[#A92645] bg-[#FDF3F8] text-[#A92645]" : "border-[#A92645] bg-white text-[#A92645] hover:bg-[#FDF3F8]"}`}>
        Out of stock
      </button>
    </div>
  );
}

function SelectionActions({ onDelete }) {
  return (
    <div className="flex w-full items-center justify-between py-1">
      <span />
      <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-base font-normal text-[#A92645] transition hover:opacity-80">
        <Trash2 className="h-5 w-5" strokeWidth={2} />
        <span>Delete</span>
      </button>
    </div>
  );
}

function statusLine(item) {
  if (!item.inStock) return { text: "Sold out", className: "text-[#C41E5A]" };
  const p = item.product;
  return p.compareAtPrice && p.price && p.compareAtPrice > p.price ? { text: "Price dropped!", className: "text-green-700" } : null;
}

function WishlistItem({ item, selected, onToggleSelect, onAddToCart, onToggleWishlist }) {
  const { product: b, entry, inStock } = item;
  const img = b.featuredImageUrl;
  const status = statusLine(item);
  return (
    <article className="relative flex gap-2.5 rounded-sm border border-black/20 bg-white p-2 outline outline-[0.80px] outline-offset-[-0.80px] outline-black/20 overflow-hidden">
      <button
        type="button"
        onClick={onToggleSelect}
        className={`absolute right-2 top-2 z-20 flex size-4 items-center justify-center rounded-sm border transition ${selected ? "border-[#A92645] bg-[#A92645] text-white" : "border-black/20 bg-neutral-50 hover:border-black/40"}`}
        aria-label={selected ? "Deselect item" : "Select item"}
      >
        {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </button>
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
        {img ? <img src={img} alt={b.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-black/40">No image</div>}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-xs font-bold text-white">Sold Out</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label="Remove from wishlist"
          aria-pressed
          className="absolute right-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
        >
          <img alt="Wishlist" src="/shop/shop-heart-filled.svg" className="size-3 object-contain transition-transform duration-200 active:scale-95" />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate pr-5 text-sm font-semibold text-[#1C1B1F]">{b.vendor || "PARQIS"}</p>
        <Link href={`/shop/${b.id}`} className="mt-0.5 block truncate pr-5 text-xs font-normal text-[#74707A] hover:text-[#A92645]">
          {b.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold text-[#1C1B1F]">{inr(b.price)}</span>
          {b.compareAtPrice && b.price && b.compareAtPrice > b.price && (
            <>
              <span className="text-xs font-normal text-[#9C97A6] line-through">{inr(b.compareAtPrice)}</span>
              {b.discountPercent && b.discountPercent > 0 && <span className="rounded-[2px] bg-[#A92645] px-1 py-0.5 text-[8px] font-medium text-white">{b.discountPercent}% OFF</span>}
            </>
          )}
        </div>
        {status && <p className={`mt-0.5 text-[10px] font-normal ${status.className}`}>{status.text}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-1 pt-1">
          <p className="truncate text-[10px] text-[#74707A]">Added on {entry.at ? dateOf(entry.at) : ""}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {inStock ? (
              <button type="button" onClick={onAddToCart} className="inline-flex items-center gap-1.5 rounded-sm bg-[#A92645] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#8F1E39]">
                <ShoppingCart className="size-3.5" />
                Add to cart
              </button>
            ) : (
              <button type="button" onClick={() => window.alert("We'll notify you when this item is back in stock.")} className="inline-flex items-center gap-1.5 rounded-sm border border-[#A92645] bg-white px-3 py-1.5 text-xs font-medium text-[#A92645] transition hover:bg-[#FDF3F8]">
                <Bell className="size-3.5" />
                Notify Me
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function WishlistClient() {
  const entries = useWishlistEntries();
  const [ready, setReady] = useState(false);
  const [outOnly, setOutOnly] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmMany, setConfirmMany] = useState(false);
  const [confirmOne, setConfirmOne] = useState(null);
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  const items = useMemo(
    () =>
      entries
        .map((entry) => {
          const raw = getProduct(entry.id);
          if (!raw) return null;
          const product = withVariants(raw);
          return { entry: { id: entry.id, at: entry.at }, product, inStock: isInStock(product) };
        })
        .filter(Boolean),
    [entries]
  );
  const visible = outOnly ? items.filter((i) => !i.inStock) : items;
  const count = selected.size;

  const toggleSelect = (id) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <PageShell>
      <BackHeader title="Wishlist" />
      {items.length > 0 && (
        <div className="mb-3 space-y-3">
          <Tabs outOfStockOnly={outOnly} onOutOfStockToggle={() => setOutOnly((v) => !v)} />
          {count > 0 && <SelectionActions onDelete={() => setConfirmMany(true)} />}
        </div>
      )}
      {!ready && items.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[148px] animate-pulse rounded-[12px] border border-[#E5E2EA] bg-[#FAFAFA]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mx-auto flex w-full max-w-[288px] flex-col items-center gap-3 py-10 text-center">
          <img src="/wishlist/wishlist-cat.png" alt="Wishlist empty" className="h-40 w-auto object-contain" />
          <h2 className="text-xl font-bold text-black">{outOnly ? "No out-of-stock items" : "No items in wishlist"}</h2>
          <p className="text-xs font-normal text-black">{outOnly ? "Everything in your wishlist is currently available." : "Save products with the heart icon while you shop and find them here"}</p>
          {!outOnly && (
            <Link href="/shop" className="mt-2 inline-flex h-11 w-52 items-center justify-center rounded-sm bg-[#A92645] px-6 py-2.5 text-base font-medium text-white transition hover:bg-[#911f3a]">
              Continue Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((it) => (
            <WishlistItem key={it.entry.id} item={it} selected={selected.has(it.product.id)} onToggleSelect={() => toggleSelect(it.product.id)} onAddToCart={() => setSheet(it.product)} onToggleWishlist={() => setConfirmOne(it)} />
          ))}
        </div>
      )}
      {sheet && <QuickAddSheet open product={sheet} onClose={() => setSheet(null)} />}
      <ConfirmDialog
        open={confirmMany}
        title="Remove selected items?"
        description={
          <>
            Remove {count} item{count === 1 ? "" : "s"} from your wishlist? This cannot be undone.
          </>
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          [...selected].forEach((id) => toggleWishlist(id));
          setSelected(new Set());
          setConfirmMany(false);
        }}
        onCancel={() => setConfirmMany(false)}
      />
      <ConfirmDialog
        open={!!confirmOne}
        title="Remove from wishlist?"
        description={
          confirmOne ? (
            <>
              Remove <span className="font-semibold text-[#1C1B1F]">{confirmOne.product.title}</span> from your wishlist?
            </>
          ) : null
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (confirmOne) toggleWishlist(confirmOne.product.id);
          setConfirmOne(null);
        }}
        onCancel={() => setConfirmOne(null)}
      />
    </PageShell>
  );
}
