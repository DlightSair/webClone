"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header, { FestiveBg } from "../Header";
import { fetchCategoryPage } from "@/lib/categories";

// Tile links are absolute parqis.com URLs in the data; keep the clone self-contained
function localise(link) {
  try {
    const u = new URL(link);
    if (u.hostname.endsWith("parqis.com")) return u.pathname + u.search + u.hash;
  } catch {}
  return link;
}

// Slug a tile from its link (original: link_url -> ?category= / ?q= / last path segment -> title)
function slugOf(link, title) {
  const fallback = title.toLowerCase().trim().replace(/\s+/g, "-");
  if (!link) return fallback;
  try {
    const u = new URL(link, "http://localhost");
    const q = u.searchParams.get("category") || u.searchParams.get("q");
    if (q) return q.toLowerCase().trim();
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length > 0) return seg[seg.length - 1];
  } catch {}
  return fallback;
}

function useCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetchCategoryPage();
        if (alive && r?.categories) setCategories(r.categories);
      } catch {
        /* the original swallows this and renders the empty state */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return { categories, loading };
}

/* ---------- tab bar (sticky header + gender tabs) ---------- */

function TabBar({ tabs, active, onChange }) {
  const [pill, setPill] = useState(null);
  const refs = useRef(new Map());
  useEffect(() => {
    const el = refs.current.get(active);
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs.length]);
  return (
    <header className="sticky top-0 z-40 w-full overflow-hidden sticky top-0 z-40 bg-transparent backdrop-blur-xs" style={{ backgroundColor: "#23143E" }}>
      <FestiveBg />
      <Header />
      {tabs.length > 0 && (
        <div className="relative z-10 px-4 pb-0">
          <div className={`relative flex overflow-x-auto whitespace-nowrap text-xs scrollbar-none py-3 ${tabs.length <= 3 ? "justify-between" : "gap-5"}`}>
            {pill && (
              <div
                className="absolute top-3 bottom-3 rounded-[40px] bg-white/5 border-[0.5px] border-white/80 backdrop-blur-md transition-all duration-300 ease-out pointer-events-none shadow-[inset_0_0px_2px_rgba(255,255,255,1)]"
                style={{ transform: `translateX(${pill.left}px)`, width: `${pill.width}px` }}
              />
            )}
            {tabs.map((t) => {
              const on = active === t;
              return (
                <button
                  key={t}
                  ref={(el) => {
                    refs.current.set(t, el);
                  }}
                  type="button"
                  onClick={() => onChange(t)}
                  className={`relative z-10 cursor-pointer rounded-[40px] w-[105px] min-[384px]:w-[114px] py-[8.5px] text-center text-xs transition active:scale-[0.98] ${on ? "text-white font-medium" : "bg-transparent text-white/80 hover:text-white"}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- tiles ---------- */

function Tile({ item }) {
  return (
    <Link href={item.href} className="group relative aspect-square w-full overflow-hidden rounded-[4px] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />
      <div className="absolute bottom-3 left-3.5 right-3">
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-white drop-shadow-sm">{item.title}</span>
      </div>
    </Link>
  );
}

function TileSkeleton() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-[#EBE7EC] shadow-xs animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3.5 right-3">
        <div className="h-4 w-24 rounded-sm bg-white/40 animate-pulse" />
      </div>
    </div>
  );
}

function TileGrid({ items, activeGender, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <div className="py-12 text-center text-sm font-medium text-gray-500">{activeGender ? `No sub-categories available for ${activeGender}.` : "No categories available."}</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((item) => (
        <Tile key={item.id || item.slug} item={item} />
      ))}
    </div>
  );
}

/* ---------- page ---------- */

function CategoriesInner() {
  const params = useSearchParams();
  const genderParam = params.get("gender")?.toLowerCase();
  const [active, setActive] = useState("");
  const { categories, loading } = useCategoryPage();

  const tabs = categories.map((c) => c.label);
  const current = categories.find((c) => c.label.trim().toLowerCase() === active.trim().toLowerCase());
  const items = (current?.tiles ?? []).map((t) => ({
    id: t.id,
    slug: slugOf(t.link_url, t.title),
    title: t.title,
    image: t.image_url || "",
    href: t.link_url ? localise(t.link_url) :`/search?q=${encodeURIComponent(slugOf(t.link_url, t.title))}`,
  }));

  useEffect(() => {
    if (tabs.length === 0) return;
    const next = (genderParam ? tabs.find((t) => t.toLowerCase() === genderParam) : undefined) || tabs[0];
    if (next !== active) setActive(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.join("|"), genderParam]);

  return (
    <div className="w-full bg-[#F3F3F3]">
      <div className="flex justify-center">
        <main className="relative w-full max-w-full sm:max-w-[430px] md:max-w-[520px] lg:max-w-[650px] xl:max-w-[760px] min-h-[calc(100vh-3.5rem)] bg-white overflow-hidden ">
          <div className="relative z-10">
            <div className="relative w-full min-h-[calc(100vh-3.5rem)] bg-white pb-8 overflow-hidden">
              <div aria-hidden="true" className="pointer-events-none  absolute inset-x-0 top-0 z-0" style={{ top: "-20px" }}>
                <img
                  src="/festive/festive-header-bg.png"
                  srcSet="/festive/festive-header-bg.png 1x, /festive/festive-header-bg@2x.png 2x, /festive/festive-header-bg@3x.png 3x"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  fetchPriority="high"
                  width={375}
                  height={886}
                  className="select-none"
                  style={{ display: "block", width: "100%", maxWidth: "none", height: "auto" }}
                />
              </div>
              <TabBar
                tabs={tabs}
                active={active}
                onChange={(t) => {
                  setActive(t);
                  const sp = new URLSearchParams(window.location.search);
                  sp.set("gender", t.toLowerCase());
                  window.history.replaceState(null, "", `/categories?${sp.toString()}`);
                }}
              />
              <div className="relative z-10 px-4 pt-3 pb-4">
                <TileGrid items={items} activeGender={active} isLoading={loading} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CategoriesInner />
    </Suspense>
  );
}
