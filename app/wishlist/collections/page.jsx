import Link from "next/link";
import { BackHeader, PageShell } from "@/components/PageShell";

export default function CollectionsPage() {
  return (
    <PageShell>
      <BackHeader title="Collections" backHref="/wishlist" />
      <div className="mx-auto flex w-full max-w-[288px] flex-col items-center gap-3 py-10 text-center">
        <img src="/wishlist/wishlist-cat.png" alt="No collections" className="h-40 w-auto object-contain" />
        <h2 className="text-xl font-bold text-black">No collections yet</h2>
        <p className="text-xs font-normal text-black">Group the products you love into collections from your wishlist</p>
        <Link href="/wishlist" className="mt-2 inline-flex h-11 w-52 items-center justify-center rounded-sm bg-[#A92645] px-6 py-2.5 text-base font-medium text-white transition hover:bg-[#911f3a]">
          Back to Wishlist
        </Link>
      </div>
    </PageShell>
  );
}
