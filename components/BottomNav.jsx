"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, TrendsIcon, CategoriesIcon, CartIcon } from "./NavIcons";
import { useCart } from "@/lib/cart";

const ITEMS = [
  { Icon: HomeIcon, label: "Home", href: "/" },
  { Icon: TrendsIcon, label: "Trends", href: "/trends" },
  { Icon: CategoriesIcon, label: "Categories", href: "/categories" },
  { Icon: CartIcon, label: "Cart", href: "/cart" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalQty } = useCart();
  return (
    <nav className="fixed bottom-4 left-1/2 z-30 w-[343px] -translate-x-1/2 rounded-[50px] bg-white/20 px-[10px] py-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
      <div className="flex items-center justify-between text-black">
        {ITEMS.map(({ Icon, label, href }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex w-[64px] cursor-pointer flex-col items-center py-1 transition active:scale-95 ${
                active ? "w-[66px] rounded-[50px] bg-white/55 text-[#A92645] shadow-[0_2px_8px_rgba(0,0,0,0.25)]" : "text-black hover:text-[#A92645]"
              }`}
            >
              <span className="relative">
                <Icon className="h-[20px] w-[20px]" />
                {href === "/cart" && totalQty > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#A92645] px-1 text-[9px] font-semibold text-white">
                    {totalQty}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${active ? "font-semibold text-[#A92645]" : "text-black"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
