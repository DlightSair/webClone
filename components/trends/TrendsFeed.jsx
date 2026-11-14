"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import reels from "@/src/data/reels.json";

const playable = reels.filter((r) => r.videoUrl);

function Reel({ reel, active, muted }) {
  const ref = useRef(null);
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);
  const name = reel.creatorName ?? reel.creatorHandle;
  return (
    <section data-reel={reel.id} className="relative h-[100dvh] w-full snap-start overflow-hidden bg-[#0B0B0C]">
      <video ref={ref} src={reel.videoUrl} poster={reel.thumbnailUrl ?? undefined} loop muted={muted} playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute right-3 z-30 bottom-[calc(10.5rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        <button type="button" onClick={() => setLiked((l) => !l)} className="flex flex-col items-center gap-1" aria-label="Like">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <img src="/trends/reel-like.svg" alt="Like" className={`h-6 w-6 ${liked ? "opacity-100" : "opacity-90"}`} style={liked ? { filter: "drop-shadow(0 0 4px #ff2d55)" } : undefined} />
          </span>
        </button>
        <button type="button" onClick={() => navigator.share?.({ title: reel.caption, url: location.href }).catch(() => {})} className="flex flex-col items-center gap-1" aria-label="Share">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <img src="/trends/reel-share1.svg" alt="Share" className="h-6 w-6" />
          </span>
        </button>
      </div>
      <div className="absolute bottom-[calc(6.5rem+env(safe-area-inset-bottom))] px-4 z-20 w-full space-y-3">
        <div className="space-y-2 pr-12">
          <Link href={`/creator/${encodeURIComponent(reel.creatorHandle)}`} className="flex items-center gap-2.5">
            {reel.creatorAvatar ? <img src={reel.creatorAvatar} alt={name} className="h-10 w-10 shrink-0 rounded-full object-cover border border-white/40" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm font-semibold">{name[0]}</span>}
            <span className="text-[15px] font-semibold">{name}</span>
          </Link>
          {reel.caption && <p className="text-[13px] text-white/90">{reel.caption}</p>}
        </div>
      </div>
    </section>
  );
}

function Feed() {
  const sp = useSearchParams();
  const want = sp.get("reel");
  const [active, setActive] = useState(null);
  const [muted, setMuted] = useState(true);
  const box = useRef(null);
  const wishlist = useWishlist();
  void wishlist;

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting && e.intersectionRatio > 0.6) setActive(e.target.getAttribute("data-reel"));
      },
      { root, threshold: [0.6] }
    );
    root.querySelectorAll("[data-reel]").forEach((el) => io.observe(el));
    if (want) root.querySelector(`[data-reel="${CSS.escape(want)}"]`)?.scrollIntoView();
    return () => io.disconnect();
  }, [want]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0B0B0C] text-white flex justify-center items-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))] max-w-[500px] mx-auto">
        <Link href="/" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md transition hover:bg-black/40">
          <img src={muted ? "/trends/reel-mute1.svg" : "/trends/reel-unmute.svg"} alt="" className="h-5 w-5" />
        </button>
      </div>
      <div ref={box} className="relative h-[100dvh] w-full max-w-[500px] overflow-y-scroll snap-y snap-mandatory scrollbar-none">
        {playable.map((r) => (
          <Reel key={r.id} reel={r} active={active === r.id || (active === null && r === playable[0])} muted={muted} />
        ))}
      </div>
    </div>
  );
}

export default function TrendsFeed() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0B0B0C]" />}>
      <Feed />
    </Suspense>
  );
}
