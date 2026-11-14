// Home data loaders. The original fetched these from /backend/api; here they are static JSON.
import categoriesData from "@/src/data/homepage-categories.json";

const feeds = {
  "57d2f796-8f20-42dd-bd5b-ea847f498200": () => import("@/src/data/homepage/57d2f796-8f20-42dd-bd5b-ea847f498200.json"),
  "3a916e11-4490-41d7-b1e7-3e0012709567": () => import("@/src/data/homepage/3a916e11-4490-41d7-b1e7-3e0012709567.json"),
  "9a264162-d91b-4ee0-b68c-7257a0f68fdc": () => import("@/src/data/homepage/9a264162-d91b-4ee0-b68c-7257a0f68fdc.json"),
  "a58eb541-5d7c-4050-8c64-ff805ae15c20": () => import("@/src/data/homepage/a58eb541-5d7c-4050-8c64-ff805ae15c20.json"),
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchHomeCategories() {
  await delay(150);
  return { categories: categoriesData.categories };
}

export async function fetchHomeSections(mainCategoryId) {
  const load = feeds[mainCategoryId];
  if (!load) return { sections: [] };
  await delay(250);
  const mod = await load();
  return { sections: (mod.default ?? mod).sections };
}
