import { notFound } from "next/navigation";
import ListingExperience from "@/components/collection/ListingExperience";
import collections from "@/src/data/collections.json";

function parseMeta(description) {
  try {
    return JSON.parse(description || "{}");
  } catch {
    return {};
  }
}

export function generateStaticParams() {
  return Object.keys(collections).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = collections[slug];
  if (!data) return { title: "Collection Not Found | PARQIS", robots: { index: false } };
  const meta = parseMeta(data.collection.description);
  return {
    title: `${meta.seoTitle || data.collection.title} | PARQIS`,
    description: meta.metaDesc || undefined,
  };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const data = collections[slug];
  if (!data) notFound();
  return (
    <ListingExperience
      collection={data.collection}
      initialPage={data.initialPage}
      reels={data.reels ?? []}
      rails={data.rails ?? []}
      placementMode={data.placementMode}
      defaultSortBy={data.defaultSortBy}
      pinned={data.pinned ?? []}
    />
  );
}
