"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import BottomNav from "./BottomNav";

// Routes where the original hides header + bottom nav (checkout flow)
const CHECKOUT = ["/cart/checkout", "/cart/payment-failed", "/cart/payment-pending", "/cart/confirmation"];

export default function Shell({ children }) {
  const pathname = usePathname();
  const hideChrome = CHECKOUT.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <div className="mx-auto w-full max-w-[430px] min-h-screen bg-white shadow-[0_0_30px_rgba(0,0,0,0.05)]">
      {!hideChrome && <Header />}
      <div className={`flex min-h-0 flex-1 flex-col ${!hideChrome ? "pb-24" : ""}`}>{children}</div>
      {!hideChrome && <BottomNav />}
    </div>
  );
}
