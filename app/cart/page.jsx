import Link from "next/link";
import CartClient from "@/components/cart/CartClient";

export default function CartPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "white" }}>
      <div className="mx-auto w-full max-w-lg px-4 pb-4 pt-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full text-[#1C1B1F] hover:bg-white transition-colors">
              <img alt="Go back" loading="lazy" width="24" height="24" decoding="async" className="h-6 w-6" style={{ color: "transparent" }} src="/cart/mingcute_down-line.svg" />
            </Link>
            <h1 className="text-[18px] text-black">Cart</h1>
          </div>
          <Link href="/search" aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full text-[#1C1B1F] hover:bg-white">
            <img alt="Search" loading="lazy" width="20" height="20" decoding="async" className="h-5 w-5 filter brightness-0" style={{ color: "transparent" }} src="/cart/mingcute_search-line.svg" />
          </Link>
        </header>
        <div className="mt-2 border-t border-black/30 ">
          <div className="pt-4">
            <CartClient />
          </div>
        </div>
      </div>
    </main>
  );
}
