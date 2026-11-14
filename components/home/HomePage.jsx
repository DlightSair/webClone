"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchHomeCategories, fetchHomeSections } from "@/lib/home";
import { Section, HomeSkeleton } from "./Sections";
import { FestiveBg } from "../Header";

const cache = new Map();

function useHomeData() {
  const [state, setState] = useState({ categories: [], selectedMain: null, sections: [], loading: true, sectionsLoading: false, error: null });
  const inflight = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchHomeCategories();
        if (cancelled) return;
        setState((s) => ({ ...s, categories: r.categories, selectedMain: r.categories[0] ?? null, loading: false }));
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mainId = state.selectedMain?.id;
  useEffect(() => {
    if (!mainId) return;
    const hit = cache.get(mainId);
    if (hit && Date.now() - hit.t < 3e5) {
      setState((s) => ({ ...s, sections: hit.data, sectionsLoading: false, error: null }));
      return;
    }
    if (inflight.current === mainId) return;
    inflight.current = mainId;
    let cancelled = false;
    setState((s) => ({ ...s, sectionsLoading: true }));
    (async () => {
      try {
        const r = await fetchHomeSections(mainId);
        if (cancelled) return;
        cache.set(mainId, { data: r.sections, t: Date.now() });
        setState((s) => ({ ...s, sections: r.sections, sectionsLoading: false, error: null }));
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, sections: [], sectionsLoading: false, error: e.message }));
      } finally {
        if (!cancelled) inflight.current = null;
      }
    })();
    return () => {
      cancelled = true;
      inflight.current = null;
    };
  }, [mainId]);

  const selectMain = useCallback((c) => setState((s) => ({ ...s, selectedMain: c, sections: [] })), []);
  return { ...state, selectMain };
}

export default function HomePage() {
  const router = useRouter();
  const { categories, selectedMain, sections, loading, sectionsLoading, selectMain } = useHomeData();
  const tabRefs = useRef({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    if (!selectedMain?.id) return;
    const el = tabRefs.current[selectedMain.id];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [selectedMain?.id, categories]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#A92645] border-t-transparent" />
      </div>
    );
  }

  const subs = selectedMain?.subcategories ?? [];
  return (
    <div className="min-h-screen bg-white">
      <div className="relative mx-auto w-full max-w-[430px] bg-white pb-28 overflow-hidden">
        <FestiveBgBelowHeader />
        <div className="relative z-10 px-4 pb-0">
          <div className={`relative flex overflow-x-auto whitespace-nowrap text-xs scrollbar-none py-3 ${categories.length <= 3 ? "justify-between" : "gap-5"}`}>
            {pill.ready && (
              <div
                className="absolute top-3 bottom-3 rounded-[40px]  bg-white/5 border-[0.5px] border-white/80 backdrop-blur-md transition-all duration-300 ease-out pointer-events-none shadow-[inset_0_0px_2px_rgba(255,255,255,1)]"
                style={{ transform: `translateX(${pill.left}px)`, width: `${pill.width}px` }}
              />
            )}
            {categories.map((c, i) => (
              <button
                key={c.id}
                ref={(el) => {
                  tabRefs.current[c.id] = el;
                }}
                onClick={() => {
                  selectMain(c);
                  if (categories.length > 3 && i > 0 && i < categories.length - 1) tabRefs.current[c.id]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`relative z-10 cursor-pointer rounded-[40px] w-[105px] min-[384px]:w-[114px] py-[8.5px] transition active:scale-[0.98] ${
                  selectedMain?.id === c.id ? "text-white font-medium" : "bg-transparent text-white/80 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {subs.length > 0 && (
            <div className="mt-1 flex gap-2 items-start overflow-x-auto pb-3 scrollbar-none">
              {subs.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    s.link_url && router.push(s.link_url);
                  }}
                  disabled={!s.link_url}
                  className="flex flex-col items-center justify-start w-[70px] shrink-0 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-default text-white"
                >
                  {s.icon_url ? (
                    <img src={s.icon_url} alt={s.label} className="size-[70px] rounded-full object-cover" />
                  ) : (
                    <div className="flex size-[70px] items-center justify-center bg-white/20 text-[11px] font-medium">{s.label.slice(0, 2)}</div>
                  )}
                  <p className="mt-[2px] text-center text-[12px] leading-tight line-clamp-2">{s.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <main className="relative z-10 px-4">
          {sectionsLoading ? (
            <HomeSkeleton />
          ) : sections.length > 0 ? (
            sections.map((s, i) => <Section key={`${s.type}-${i}`} section={s} />)
          ) : (
            <div className="py-20 text-center text-sm text-gray-400">No content configured.</div>
          )}
        </main>
      </div>
    </div>
  );
}

// Festive artwork that extends under the sticky header (original: offsetBelowHeader)
function FestiveBgBelowHeader() {
  return (
    <div aria-hidden="true" className="pointer-events-none  absolute inset-x-0 top-0 z-0" style={{ top: "calc(var(--storefront-header-h, 0px) * -1 - 20px)" }}>
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
  );
}
