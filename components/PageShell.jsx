"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Standard inner-page container used by wishlist / profile style pages
export function PageShell({ children }) {
  return (
    <main className="min-h-screen flex-1 pb-24 bg-white md:pb-10">
      <div className="mx-auto w-full max-w-md px-4 py-3 md:max-w-2xl md:px-6 md:py-6 lg:max-w-3xl">{children}</div>
    </main>
  );
}

export function BackHeader({ title, subtitle, backHref, rightAction }) {
  const router = useRouter();
  return (
    <header className="mb-[5px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={() => (backHref ? router.push(backHref) : router.back())} className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center text-[#1C1B1F]" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg  leading-tight text-[#1C1B1F]">{title}</h1>
            {subtitle && <p className="text-[12px] text-[#74707A]">{subtitle}</p>}
          </div>
        </div>
        {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
      </div>
    </header>
  );
}
