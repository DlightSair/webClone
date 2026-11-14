"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, ChevronRight, Check } from "lucide-react";
import PlayButton from "../PlayButton";
import { addToCart } from "@/lib/cart";

/* ---------- helpers ---------- */

// Resolves a CMS link to an in-app route (same rules as the original)
export function resolveLink(raw) {
  if (!raw) return "/trends";
  let t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      if (u.origin === "https://cosmic-uprising.parqis.com") return u.href;
      t = u.pathname + u.search + u.hash;
    } catch {}
  }
  if (["/search", "/trends", "/shop", "/categories", "/cart", "/profile", "/wishlist", "/saved", "/preview"].some((p) => t.startsWith(p))) return t;
  const r = t.startsWith("/") ? t.slice(1) : t;
  return `/search?q=${encodeURIComponent(r)}`;
}

export function variantLabel(v) {
  const opts = [v.option1, v.option2, v.option3].filter(Boolean);
  if (opts.length > 0) return opts.join(" · ");
  const t = v.title?.trim().toLowerCase();
  if (!t || /^default(?:\s+(?:title|variant))?$/.test(t)) return "";
  return v.title.trim();
}

// Normalises the CMS product payload into the shape the cards use
export function mapProduct(e) {
  const vs = Array.isArray(e.product_variants) ? e.product_variants : Array.isArray(e.variants) ? e.variants : [];
  const variants =
    vs.length > 0
      ? vs.map((t) => ({
          id: t.id || "",
          productId: t.productId || t.product_id || e.id || "",
          title: t.title || "",
          sku: t.sku || null,
          price: String(t.price ?? "0"),
          compareAtPrice: t.compareAtPrice != null ? String(t.compareAtPrice) : t.compare_at_price != null ? String(t.compare_at_price) : null,
          discountPercent: t.discountPercent ?? t.discount_percent ?? null,
          inventoryQty: +(t.inStock !== false && t.in_stock !== false),
          option1: t.option1 ?? null,
          option2: t.option2 ?? null,
          option3: t.option3 ?? null,
          imageUrl: t.imageUrl ?? t.image_url ?? null,
        }))
      : [
          {
            id: e.id || "",
            productId: e.id || "",
            title: e.title || "Default",
            sku: null,
            price: String(e.price ?? "0"),
            compareAtPrice: e.compareAtPrice != null ? String(e.compareAtPrice) : null,
            discountPercent: e.discountPercent ?? null,
            inventoryQty: 1,
            option1: "Default",
            option2: null,
            option3: null,
            imageUrl: e.featuredImageUrl || e.imageUrl || null,
          },
        ];
  return {
    id: e.id || "",
    title: e.title || "",
    slug: e.slug || null,
    vendor: e.vendor || null,
    imageUrl: e.featuredImageUrl || e.featured_image_url || null,
    featuredImageUrl: e.featuredImageUrl || e.featured_image_url || null,
    images: Array.isArray(e.images) ? e.images : [],
    price: variants[0] ? Number(variants[0].price) : null,
    compareAtPrice: variants[0]?.compareAtPrice ? Number(variants[0].compareAtPrice) : null,
    discountPercent: e.discountPercent ?? e.discount_percent ?? null,
    variants,
    rating: e.rating ?? undefined,
    ratingCount: e.ratingCount ?? e.rating_count ?? 0,
    reviewCount: e.reviewCount ?? e.review_count ?? 0,
  };
}

export function SectionTitle({ title, onViewMore, className }) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <h3 className="text-xl font-bold leading-none text-[#4A4640]">{title}</h3>
      {onViewMore && (
        <button onClick={onViewMore} className="cursor-pointer text-sm text-[#A92645] transition hover:opacity-75 active:scale-[0.98]">
          View more <span className="text-[17px] font-semibold">{">"}</span>
        </button>
      )}
    </div>
  );
}

/* ---------- product rail ---------- */

export function ProductRail({ title, items, viewMoreHref = "/search", className }) {
  const router = useRouter();
  const [added, setAdded] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  const onAdd = useCallback((product, variant) => {
    addToCart(product, variant);
    setAdded((s) => ({ ...s, [product.id]: true }));
    setToast(`"${product.title}" added to cart`);
    toastTimer.current && clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
    setTimeout(() => setAdded((s) => ({ ...s, [product.id]: false })), 2000);
  }, []);

  if (items.length === 0) return null;
  return (
    <section className={className ?? "mt-4"}>
      <SectionTitle title={title} onViewMore={() => router.push(viewMoreHref)} />
      <div className="mt-2.5 flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        {items.map((p, i) => {
          const v = p.variants?.[0] ?? { id: p.id, productId: p.id, title: p.title, price: String(p.price ?? "0"), imageUrl: p.imageUrl ?? p.featuredImageUrl ?? "", inventoryQty: 1 };
          const img = v.imageUrl ?? p.imageUrl ?? p.featuredImageUrl ?? "";
          const isAdded = !!added[p.id];
          return (
            <article
              key={`${p.id}-${i}`}
              onClick={() => router.push(`/shop/${p.id}`)}
              className="w-[109px] shrink-0 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 "
            >
              <div className="relative overflow-hidden rounded-bl-[4px] rounded-br-[16px] rounded-tl-[4px] rounded-tr-[4px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                {img && <img src={img} alt={p.title} className="h-[128px] w-full object-cover" />}
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (!isAdded) onAdd(p, v);
                  }}
                  className="absolute bottom-[0px] right-[0px] z-30 flex size-[28px] items-center justify-center rounded-full bg-white/80 backdrop-blur-[2px] text-[#A92645] transition-all duration-200 hover:scale-105 shadow-[0_2px_18px_rgba(200,200,200,0.40),inset_0_1px_4px_rgba(255,255,255,1)] active:scale-95 cursor-pointer"
                  aria-label={isAdded ? `${p.title} added to cart` : `Add ${p.title} to cart`}
                >
                  {isAdded ? <Check className="h-3.5 w-3.5" /> : <img alt="Add to cart" loading="lazy" width={14} height={14} className="h-[13px] w-[13px] object-contain" src="/add-to-cart.svg" />}
                </button>
              </div>
              <div className="flex flex-col space-y-2 pt-2">
                <p className="mt-1 line-clamp-2 text-sm leading-[1.15] text-[#4A4640]">
                  {p.title}
                  <br />
                  {variantLabel(v)}
                </p>
                <p className="text-sm font-semibold text-black">
                  ₹{Number(v.price).toLocaleString()}
                  {p.compareAtPrice && p.compareAtPrice > Number(v.price) && (
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
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1C1B1F] px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0CB72E]">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
          <span className="max-w-[200px] truncate text-[13px] font-medium text-white">{toast}</span>
        </div>
      )}
    </section>
  );
}

/* ---------- wide banner carousel (banner_long) ---------- */

export function WideBanner({ tag, title, subtitle, image, stats, buttonText, buttonColor, buttonTextColor, autoRotateSeconds = 4, slides = [], onCheckNow, className }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const list = slides.length > 0 ? slides : image ? [{ media_url: image, primary_text: title, secondary_text: subtitle, promo_text: tag }] : [];
  const multi = list.length > 1;
  const loop = multi ? [...list, ...list, ...list] : list;

  useEffect(() => {
    if (!multi) return;
    const el = ref.current;
    if (!el) return;
    const third = el.scrollWidth / 3;
    if (third > 0) el.scrollLeft = third;
  }, [list.length, multi]);

  useEffect(() => {
    if (!multi) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (el) el.scrollBy({ left: el.offsetWidth, behavior: "smooth" });
    }, 1000 * (autoRotateSeconds || 4));
    return () => clearInterval(t);
  }, [multi, autoRotateSeconds]);

  if (list.length === 0) return null;

  const isVideo = (src, type) => {
    if (type === "video") return true;
    if (type === "image" || !src) return false;
    const r = src.split("?")[0].split("#")[0].toLowerCase();
    return r.endsWith(".mp4") || r.endsWith(".webm") || r.endsWith(".mov") || r.endsWith(".m3u8") || r.includes("video/");
  };
  const buttonLabel = (slide, def) => {
    if (slide.show_button === false || slide.has_button === false) return null;
    const none = (x) => x?.trim().toLowerCase() === "none";
    if (none(slide.button_text) || none(def)) return null;
    if (slide.button_text !== undefined) return slide.button_text?.trim() || null;
    if (def !== undefined) return def?.trim() || null;
    return "Check Now";
  };

  return (
    <section className={`relative mb-[18px] w-full overflow-hidden rounded-[4px] bg-gray-100 shadow-sm ${className ?? ""}`}>
      <div
        ref={ref}
        onScroll={() => {
          if (!multi) return;
          const el = ref.current;
          if (!el) return;
          const third = el.scrollWidth / 3;
          if (third <= 0) return;
          if (el.scrollLeft >= 2 * third) el.scrollLeft -= third;
          else if (el.scrollLeft <= 5) el.scrollLeft += third;
          const w = el.offsetWidth;
          if (w > 0) setIdx(Math.min(Math.floor((el.scrollLeft % third) / w), list.length - 1));
        }}
        className="flex w-full items-start overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
      >
        {loop.map((s, n) => {
          const src = s.media_url || s.media_key || image || "";
          const heading = s.primary_text ?? title ?? "";
          const sub = s.secondary_text ?? subtitle ?? "";
          const promo = s.promo_text ?? tag ?? "";
          const video = isVideo(src, s.media_type);
          const label = buttonLabel(s, buttonText);
          const bg = s.button_color || buttonColor || "#A92645";
          const fg = s.button_text_color || buttonTextColor || "#FFFFFF";
          return (
            <div key={`wide-slide-${n}`} onClick={() => onCheckNow?.(s.link)} className="relative w-full shrink-0 cursor-pointer snap-center select-none">
              {src && (video ? <video src={src} autoPlay loop muted playsInline className="block h-auto w-full pointer-events-none" /> : <img src={src} alt={heading} className="block h-auto w-full" />)}
              {promo && <div className="absolute left-3 top-3 rounded-[10px] bg-[#A92645] px-[8px] py-[3px] text-[10px] text-white font-medium shadow-sm z-10">{promo}</div>}
              <div className="absolute bottom-4 left-3 right-3 flex items-end justify-between gap-3 z-10">
                <div className="max-w-[80%]">
                  {heading && <h3 className="text-[24px] font-semibold leading-tight text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">{heading}</h3>}
                  {sub && <p className="mt-1 text-[12px] text-white/90 line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">{sub}</p>}
                  {label && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onCheckNow?.(s.link);
                      }}
                      className="mt-2.5 flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[4px] px-3 text-[12px] font-medium transition-transform duration-150 hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      {label}
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </button>
                  )}
                </div>
                {stats && <div className="rounded-[20px] bg-white/20 px-3 py-[6px] text-[10px] text-white backdrop-blur-sm">{stats}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {multi && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center gap-[6px] pointer-events-none">
          {list.map((_, t) => (
            <span key={t} className={`transition-all duration-300 ${t === idx ? "h-1.5 w-4 rounded-full bg-white shadow-sm" : "size-1.5 rounded-full bg-white/50"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- section renderers ---------- */

function BannerShort({ config }) {
  const router = useRouter();
  const slides = Array.isArray(config.slides) ? config.slides : [];
  const secs = config.auto_rotate_seconds ?? 5;
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  const multi = slides.length > 1;
  const loop = multi ? [...slides, ...slides, ...slides] : slides;

  useEffect(() => {
    if (!multi) return;
    const el = ref.current;
    if (!el) return;
    const third = el.scrollWidth / 3;
    if (third > 0) {
      const first = el.firstElementChild;
      if (first) {
        const next = first.nextElementSibling;
        const step = next ? next.offsetLeft - first.offsetLeft : first.offsetWidth;
        el.scrollLeft = first.offsetLeft + first.offsetWidth / 2 + slides.length * step - el.clientWidth / 2;
      } else el.scrollLeft = third;
    }
  }, [slides.length, multi]);

  useEffect(() => {
    if (!multi || !(secs > 0)) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const first = el.firstElementChild;
      const next = first?.nextElementSibling;
      const step = first && next ? next.offsetLeft - first.offsetLeft : el.clientWidth;
      el.scrollBy({ left: step, behavior: "smooth" });
    }, 1000 * secs);
    return () => clearInterval(t);
  }, [multi, secs, slides.length]);

  if (slides.length === 0) return null;
  return (
    <section className="relative mt-3 w-full">
      <div className="overflow-hidden rounded-[4px]">
        <div
          ref={ref}
          onScroll={() => {
            if (!multi) return;
            const el = ref.current;
            if (!el) return;
            const third = el.scrollWidth / 3;
            if (third <= 0) return;
            if (el.scrollLeft >= 2 * third) el.scrollLeft -= third;
            else if (el.scrollLeft <= 5) el.scrollLeft += third;
            const first = el.firstElementChild;
            if (!first) return;
            const next = first.nextElementSibling;
            const step = next ? next.offsetLeft - first.offsetLeft : first.offsetWidth;
            if (step <= 0) return;
            const center = first.offsetLeft + first.offsetWidth / 2;
            setIdx((((Math.round((el.scrollLeft + el.clientWidth / 2 - center) / step) % slides.length) + slides.length) % slides.length));
          }}
          className="flex items-start overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {loop.map((s, n) => (
            <button key={`slide-${n}`} onClick={() => router.push(resolveLink(s.link))} className="w-full shrink-0 cursor-pointer snap-center select-none">
              <img src={s.media_url || s.media_key || ""} alt="" className="block h-auto w-full rounded-[4px]" />
            </button>
          ))}
        </div>
      </div>
      {multi && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-[10px] pointer-events-none">
          {slides.map((_, t) => (
            <span key={t} className={`transition-all duration-300 ${t === idx ? "h-2 w-[18px] rounded-[50px] bg-white shadow-sm" : "size-2 rounded-[50px] bg-white/50"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerLong({ config }) {
  const router = useRouter();
  return (
    <WideBanner
      tag={config.promo_text || ""}
      title={config.primary_text || ""}
      subtitle={config.secondary_text || ""}
      buttonText={config.button_text}
      buttonColor={config.button_color}
      buttonTextColor={config.button_text_color}
      autoRotateSeconds={config.auto_rotate_seconds ?? 4}
      slides={Array.isArray(config.slides) ? config.slides : []}
      stats=""
      onCheckNow={(l) => router.push(resolveLink(l))}
    />
  );
}

function TrendsMain({ config: e }) {
  const router = useRouter();
  const video = e.video;
  const thumb = e.resolved_thumbnail_url || video?.thumbnail_url || "";
  const text = e.primary_text;
  const color = e.primary_text_color || "#FFFFFF";
  const size = e.primary_text_size || "24px";
  if (!thumb) return null;
  return (
    <section
      className="relative mt-[10px] cursor-pointer overflow-hidden rounded-[4px] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
      onClick={() => {
        const to = e.link || (video && `/trends?reel=${video.id}`);
        to && router.push(to);
      }}
    >
      <img src={thumb} alt={text || "Trending"} className="h-[240px] w-full object-cover" />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute left-5 top-[18px] pb-2">
        {e.promo_text && (
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-white">
            <img src="/home-trend-fire.svg" alt="Trending" className="size-4 object-contain" />
            {e.promo_text}
          </div>
        )}
        {text && (
          <h2 className="font-bold" style={{ color, fontSize: size }}>
            {text}
          </h2>
        )}
        {e.secondary_text && <p className=" text-[12px] text-white">{e.secondary_text}</p>}
      </div>
      {e.button_text && (
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            router.push(e.link || "/trends");
          }}
          className="absolute bottom-5 left-5 flex cursor-pointer items-center gap-3 rounded-[4px] px-[10px] py-[14px] text-[12px] transition hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: e.button_color || "#A92645", color: e.button_text_color || "#FFFFFF" }}
        >
          {e.button_text}
          <Play className="h-4 w-4 fill-current" />
        </button>
      )}
    </section>
  );
}

function TrendsSecondary({ config: e }) {
  const router = useRouter();
  const items = Array.isArray(e.items) ? e.items : [];
  if (items.length === 0) return null;
  const first = items[0];
  const rest = items.slice(1, 3);
  const thumb = first?.resolved_thumbnail_url || first?.video?.thumbnail_url || "";
  const video = first?.video;
  return (
    <section className="mt-[18px] grid grid-cols-[1.25fr_1fr] w-full gap-2">
      <article
        className="relative h-full min-h-full cursor-pointer overflow-hidden rounded-sm transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
        onClick={() => {
          const to = first?.link || (video && `/trends?reel=${video.id}`);
          to && router.push(to);
        }}
      >
        <img src={thumb} alt={first?.primary_text || ""} className="h-full w-full object-cover min-h-[314px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(0,0,0,0.5)_100%)]" />
        {!!first?.promo_text && (
          <div className="absolute left-3 top-3 rounded-[10px] px-[6px] py-[3px] text-[10px] text-white" style={{ backgroundColor: first.promo_overlay_color || "#A92645" }}>
            {String(first.promo_text)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-[20px] items-center justify-center">
            <PlayButton className="scale-70" />
          </div>
        </div>
        <div className="absolute bottom-3 left-2.5">
          {!!first?.primary_text && (
            <h3 className="font-semibold leading-none" style={{ color: first.primary_text_color || "#FFFFFF", fontSize: first.primary_text_size || "24px" }}>
              {String(first.primary_text)}
            </h3>
          )}
          {!!first?.secondary_text && <p className="mt-2 text-[12px] text-white">{String(first.secondary_text)}</p>}
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              router.push(first?.link || "/trends");
            }}
            className="mt-2 flex h-[26px] cursor-pointer items-center gap-1 rounded-[4px] bg-[#FCFBFB] px-[10px] text-[12px] text-black transition hover:bg-white active:scale-[0.98]"
          >
            Explore
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </article>
      <div className="space-y-2">
        {rest.map((it, n) => {
          const t = it.resolved_thumbnail_url || it.video?.thumbnail_url || "";
          const v = it.video;
          return (
            <article
              key={`side-${n}`}
              className="relative cursor-pointer overflow-hidden rounded-[4px] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => {
                const to = it.link || (v && `/trends?reel=${v.id}`);
                to && router.push(to);
              }}
            >
              <img src={t} alt={it.primary_text || ""} className="h-[153px] w-full object-cover" />
              {!!first?.promo_text && (
                <div className="absolute left-3 top-3 rounded-[10px] px-[6px] py-[3px] text-[10px] text-white" style={{ backgroundColor: first.promo_overlay_color || "#A92645" }}>
                  {String(first.promo_text)}
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.34)_100%)]" />
              <div className="absolute bottom-2 left-2 text-white">
                {!!it.primary_text && (
                  <h4 className="font-semibold leading-none" style={{ color: it.primary_text_color || "#FFFFFF", fontSize: it.primary_text_size || "24px" }}>
                    {String(it.primary_text)}
                  </h4>
                )}
                {!!it.secondary_text && <p className="mt-1 text-[12px]">{String(it.secondary_text)}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductCardsSection({ config: e }) {
  const title = e.heading || "Products";
  const link = e.view_more_link || "";
  const items = (Array.isArray(e.products) ? e.products : []).map(mapProduct);
  if (items.length === 0) return null;
  return <ProductRail title={title} items={items} viewMoreHref={link || `/search?q=${encodeURIComponent(e.view_more_keyword || title)}`} />;
}

export function VideoRail({ title, items }) {
  const router = useRouter();
  if (!items || items.length === 0) return null;
  return (
    <section className="mt-4">
      <SectionTitle title={title || "Trending Videos"} />
      <div className="mt-2.5 flex gap-[15px] overflow-x-auto pb-1 scrollbar-none">
        {items.map((e) => (
          <article
            key={e.id}
            onClick={() => router.push(e.link || `/trends?reel=${e.id}`)}
            className="w-[164px] shrink-0 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="relative overflow-hidden rounded-sm shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              {e.thumbnailUrl && <img src={e.thumbnailUrl} alt={e.caption || ""} className="h-[333px] w-full object-cover" />}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PlayButton className="scale-50" />
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-[14px]">
              {e.creatorAvatarUrl ? (
                <img src={e.creatorAvatarUrl} alt={e.creatorHandle} className="size-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#A92645] text-[10px] font-bold text-white">
                  {e.creatorHandle ? e.creatorHandle.slice(0, 2).toUpperCase() : "PQ"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#1C1B1F] truncate">@{e.creatorHandle}</p>
                {e.caption && <p className="text-[8px] text-[#7A7772] line-clamp-1">{e.caption}</p>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FullViewTrends({ config: e }) {
  const videos = Array.isArray(e.videos) ? e.videos : [];
  if (videos.length === 0) return null;
  return (
    <VideoRail
      title={e.heading || "Trending Videos"}
      items={videos.map((v) => ({
        id: v.id || "",
        thumbnailUrl: v.thumbnail_url || "",
        creatorHandle: v.creator_handle || "",
        creatorAvatarUrl: v.creator_avatar_url || v.creator_avatar || v.avatar_url || "",
        link: v.link || `/trends?reel=${v.id || ""}`,
      }))}
    />
  );
}

function SmallCardRail({ title, items, onItemClick }) {
  return (
    <section className="mt-4 rounded-sm border border-gray-200 bg-white px-[10px] py-[16px]">
      <SectionTitle title={title} onViewMore={() => onItemClick?.(title, "__view_more__")} />
      <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {items.map(([label, image, badge]) => (
          <article key={`${title}-${image}`} onClick={() => onItemClick?.(title, label)} className="w-[109px] shrink-0 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0">
            <div className="relative overflow-hidden rounded-[4px] shadow-sm">
              {image && <img src={image} alt={label} className="h-[93px] w-full object-cover" />}
              <div className="absolute inset-0 bg-black/20 0" />
              {badge && <span className="absolute left-1 top-1 z-10 rounded-[10px] bg-[#A92645] px-[5px] py-[1px] text-[7px] text-white">{badge}</span>}
              <div className="absolute inset-x-0 bottom-0 z-10 px-1.5 pb-1 pt-3">
                <p className="line-clamp-1 text-xs text-white">{label}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SmallCards({ config: e }) {
  const router = useRouter();
  const groups = Array.isArray(e.groups) ? e.groups : [];
  if (groups.length === 0) return null;
  return (
    <>
      {groups.map((g, i) => {
        const heading = g.heading || "";
        const viewMore = g.view_more_link || "";
        const gi = Array.isArray(g.items) ? g.items : [];
        const items = gi.map((x) => [x.label || "", x.image_url || "", x.badge || ""]);
        return (
          <SmallCardRail
            key={`small-${i}-${heading}`}
            title={heading}
            items={items}
            onItemClick={(_, label) => {
              if (label === "__view_more__") {
                router.push(viewMore ? resolveLink(viewMore) : `/search?q=${encodeURIComponent(heading)}`);
                return;
              }
              const found = gi.find((x) => x.label === label);
              const link = found?.link;
              if (link) router.push(resolveLink(link));
              else if (label) router.push(`/search?q=${encodeURIComponent(label)}`);
            }}
          />
        );
      })}
    </>
  );
}

export function Section({ section }) {
  if (!section.config) return null;
  switch (section.type) {
    case "banner_short":
      return <BannerShort config={section.config} />;
    case "banner_long":
      return <BannerLong config={section.config} />;
    case "trends_main":
      return <TrendsMain config={section.config} />;
    case "trends_secondary":
      return <TrendsSecondary config={section.config} />;
    case "product_cards":
      return <ProductCardsSection config={section.config} />;
    case "full_view_trends":
      return <FullViewTrends config={section.config} />;
    case "small_cards":
      return <SmallCards config={section.config} />;
    default:
      return null;
  }
}

/* ---------- loading skeleton ---------- */

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#C8C5D0]/50 bg-[#FFFFFF]">
      <div className="relative aspect-[4/5] w-full bg-[#FCF8FD]">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-20 rounded-full bg-[#FCF8FD]">
          <div className="h-full w-full animate-shimmer rounded-full" />
        </div>
        <div className="h-5 w-full rounded bg-[#FCF8FD]">
          <div className="h-full w-full animate-shimmer rounded" />
        </div>
        <div className="h-4 w-3/4 rounded bg-[#FCF8FD]">
          <div className="h-full w-full animate-shimmer rounded" />
        </div>
        <div className="h-5 w-24 rounded bg-[#FCF8FD]">
          <div className="h-full w-full animate-shimmer rounded" />
        </div>
        <div className="h-10 w-full rounded-xl bg-[#FCF8FD]">
          <div className="h-full w-full animate-shimmer rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  const shimmer = <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />;
  const header = (w) => (
    <div className="flex items-center justify-between">
      <div className={`h-5 ${w} rounded-sm bg-[#EBE7EC] animate-pulse`} />
      <div className="h-4 w-16 rounded-sm bg-[#EBE7EC] animate-pulse" />
    </div>
  );
  const grid = (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, t) => (
        <CardSkeleton key={t} />
      ))}
    </div>
  );
  return (
    <div className="space-y-6 pb-12 pt-3 animate-in fade-in duration-300">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[4px] bg-[#EBE7EC] shadow-xs animate-pulse">{shimmer}</div>
      <div className="space-y-4 pt-2">
        {header("w-40")}
        {grid}
      </div>
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[4px] bg-[#EBE7EC] shadow-xs animate-pulse">{shimmer}</div>
      <div className="space-y-4 pt-2">
        {header("w-36")}
        {grid}
      </div>
    </div>
  );
}
