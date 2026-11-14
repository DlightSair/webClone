"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MapPin, ChevronDown, Search } from "lucide-react";

export const HEADER_BG = "#23143E";
export const FESTIVE_OFFSET = 20;
export const HEADER_VAR = "--storefront-header-h";

export function FestiveBg() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10" style={{ top: `-${FESTIVE_OFFSET}px` }}>
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

function AddressButton() {
  return (
    <button
      type="button"
      className="mt-1 flex min-w-0 items-center rounded-[8px] py-1 text-left text-[12px] font-semibold transition md:mt-0 md:max-w-[240px] md:px-2 md:text-[13px] text-white hover:bg-white/10"
      aria-label="Select delivery address"
    >
      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">Select an address</span>
      <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
    </button>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef(null);
  const isProfile = pathname.startsWith("/profile");
  const isCategories = pathname.startsWith("/categories");
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty(HEADER_VAR, `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty(HEADER_VAR);
    };
  }, [isHome]);

  const dot = isCategories
    ? "border-[1.5px] border-white size-[7px] rounded-full bg-[#F7C948] z-10 -right-[1px] -top-[1px]"
    : "border-[1.5px] border-white size-[7px] rounded-full bg-[#F7C948] -right-[1px] top-[1px]";
  void dot; // wishlist dot needs a signed-in session in the original

  if (isProfile) {
    const showUser = pathname !== "/profile";
    return (
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-white px-4 py-3 pt-[14px]">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="flex h-[28px] min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[4px] border border-[#0000004D] px-4 text-black transition hover:bg-black/5 active:scale-[0.995]"
        >
          <Search className="h-3 w-3 shrink-0" />
          <span className="truncate text-left text-[10px] text-[#00000099]">Search for products, creators...</span>
        </button>
        <div className="flex shrink-0 items-center gap-4 text-black">
          <Link href="/wishlist" className="relative cursor-pointer transition hover:opacity-85 active:scale-95">
            <img alt="Wishlist" width={20} height={20} className="h-[19px] w-[19px] object-contain" src="/profile/profile-like.svg" />
          </Link>
          {showUser && (
            <Link href="/profile" className="cursor-pointer transition hover:opacity-85 active:scale-95">
              <img alt="User" width={20} height={20} className="h-[21px] w-[21px] object-contain" src="/profile/profile-user.svg" />
            </Link>
          )}
        </div>
      </header>
    );
  }

  if (isHome || isCategories) {
    const cls = isCategories ? "bg-transparent" : "sticky top-0 overflow-hidden";
    return (
      <header ref={ref} className={`z-20 px-4 pt-3 pb-1 ${cls}`} style={!isCategories ? { backgroundColor: HEADER_BG } : undefined}>
        {!isCategories && <FestiveBg />}
        <div className="flex items-center justify-between text-white">
          <AddressButton />
          <div className="flex items-start gap-4">
            <Link href="/wishlist" className="relative cursor-pointer transition hover:opacity-85 active:scale-95">
              <img alt="Wishlist" width={20} height={20} className="h-[19px] w-[19px] object-contain" src="/home-like.svg" />
            </Link>
            <Link href="/profile" className="cursor-pointer transition hover:opacity-85 active:scale-95">
              <img alt="User" width={20} height={20} className="h-[21px] w-[21px] object-contain" src="/home-user.svg" />
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="mt-3 flex h-9 w-full cursor-pointer items-center gap-2 rounded-[4px] border border-white/30 px-4 text-white transition hover:bg-white/8 focus:border-white/50 focus:bg-white/20 outline-none active:scale-[0.995]"
        >
          <Search className="h-3 w-3" />
          <span className="text-[12px]">Search for products, creators...</span>
        </button>
      </header>
    );
  }
  return null;
}
