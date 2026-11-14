"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addToCart } from "@/lib/cart";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";

// Product card used on collection / shop grids
export default function ProductGridCard({ product, onAdded }) {
  const wishlist = useWishlist();
  const wished = wishlist.includes(product.id);
  const scroller = useRef(null);
  const [active, setActive] = useState(0);
  const images = product.images?.length ? product.images : [product.featuredImageUrl || product.imageUrl].filter(Boolean);
  const href = `/shop/${product.id}`;
  const inStock = (product.variants ?? []).find((v) => v.inventoryQty > 0) ?? product.variants?.[0];

  return (
    <article className="group relative flex flex-col gap-1.5 min-w-0 w-full">
      <div className="relative aspect-[27/32] w-full rounded-bl-[4px] rounded-br-[4px] rounded-tl-[14.5px] rounded-tr-[4px] bg-[#F3F3F3]">
        <div className="relative h-full w-full overflow-hidden rounded-bl-[4px] rounded-br-[4px] rounded-tl-[15px] rounded-tr-[4px]">
          <div
            ref={scroller}
            onScroll={() => {
              const el = scroller.current;
              if (el && el.clientWidth) setActive(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-none"
          >
            {images.map((src, i) => (
              <Link key={src + i} href={href} aria-label={`View ${product.title}`} className="relative block h-full w-full shrink-0 snap-start overflow-hidden">
                <img
                  src={src}
                  alt={product.title}
                  loading={i === 0 ? undefined : "lazy"}
                  decoding="async"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                />
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute left-0 top-0 z-30 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[2px] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
        >
          <img alt="Wishlist" className="size-[18px] object-contain transition-transform duration-200 active:scale-95" src={wished ? "/shop/shop-heart-filled.svg" : "/shop/shop-heart.svg"} />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => {
                  const el = scroller.current;
                  if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
                }}
                className={`h-1.5 w-1.5 rounded-full transition-all ${i === active ? "bg-white shadow-xs" : "bg-white/60"}`}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={!inStock}
          onClick={() => {
            addToCart(product, inStock);
            onAdded?.(product);
          }}
          aria-label={`Add ${product.title} to cart`}
          className="absolute z-30 -bottom-3 right-[0.5px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/80 backdrop-blur-[2px] text-[#A92645] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
        >
          <img alt="Add to cart" loading="lazy" width={14} height={14} className="h-[13px] w-[13px] object-contain" src="/add-to-cart.svg" />
        </button>
      </div>
      <Link href={href} className="flex flex-col gap-0.5 px-0.5 py-2 cursor-pointer">
        <h3 className="truncate text-[14px] font-semibold text-[#1C1B1F]">{product.vendor || "PARQIS"}</h3>
        <p className="truncate text-[10px] font-normal text-black/60">{product.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className="text-[14px] font-semibold text-[#1C1B1F]">₹{Number(product.price ?? 0).toLocaleString("en-IN")}</span>
          {product.compareAtPrice && product.compareAtPrice > (product.price ?? 0) && (
            <span className="text-[12px] font-light text-black/50 line-through">₹{Number(product.compareAtPrice).toLocaleString("en-IN")}</span>
          )}
          {product.discountPercent ? <span className="text-[12px] font-light text-green-600">{product.discountPercent}%</span> : null}
        </div>
      </Link>
    </article>
  );
}
