import { Suspense } from "react";
import SearchExperience from "@/components/search/SearchExperience";

export default function SearchPage() {
  return (
    <main className="flex-1 bg-white pb-24 md:pb-8">
      <Suspense fallback={<div className="px-4 py-8 text-sm text-[#74707A]">Loading search…</div>}>
        <SearchExperience />
      </Suspense>
    </main>
  );
}
