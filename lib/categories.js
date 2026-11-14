// Categories page loader. The original fetched this from /backend/api; here it is static JSON.
import data from "@/src/data/category-page.json";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchCategoryPage() {
  await delay(150);
  return { categories: data.categories };
}
