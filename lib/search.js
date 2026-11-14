// Search: URL state helpers (same params as the original) + a client-side engine over the captured catalog.
import { catalog, withVariants } from "./catalog";
import reels from "@/src/data/reels.json";

export const SORTS = ["relevance", "price_asc", "price_desc", "newest", "discount_desc"];
export const SORT_LABELS = { relevance: "Relevance", price_asc: "Price: Low to High", price_desc: "Price: High to Low", newest: "Newest", discount_desc: "Highest Discount" };
export const MIN_QUERY = 2;
export const TRENDING = ["Trendy Wear", "Lehengas", "Salwar Suit Set", "Summer Collection", "Kurta Sets"];
export const PRICE = { min: 1, max: 30000, defaultMin: 500, defaultMax: 20000, labelMin: 500, labelMax: 20000 };
export const PAGE_SIZE = 12;

export const emptyFilters = () => ({ brandIds: [], sizes: [], minPrice: null, maxPrice: null, category: null });
export const newState = (q) => ({ q, sort: "relevance", filters: emptyFilters() });

const list = (sp, key) => {
  const all = sp.getAll(key);
  if (all.length === 0) {
    const one = sp.get(key);
    return one?.trim() ? one.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
  return all.flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
};
const numOrNull = (s) => {
  if (!s?.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export function parseParams(sp) {
  const q = (sp.get("q") ?? sp.get("search") ?? "").trim();
  const sort = sp.get("sort")?.trim() ?? "relevance";
  return {
    q,
    sort: SORTS.includes(sort) ? sort : "relevance",
    filters: { brandIds: [...new Set(list(sp, "brand_ids"))], sizes: [...new Set(list(sp, "sizes"))], minPrice: numOrNull(sp.get("min_price")), maxPrice: numOrNull(sp.get("max_price")), category: sp.get("category")?.trim() || null },
  };
}
export function toQueryString(state) {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.sort && state.sort !== "relevance") p.set("sort", state.sort);
  for (const b of state.filters.brandIds) p.append("brand_ids", b);
  for (const s of state.filters.sizes) p.append("sizes", s);
  if (state.filters.minPrice != null) p.set("min_price", String(state.filters.minPrice));
  if (state.filters.maxPrice != null) p.set("max_price", String(state.filters.maxPrice));
  if (state.filters.category) p.set("category", state.filters.category);
  return p.toString();
}
export function searchUrl(state) {
  const qs = toQueryString(state);
  return qs ? `/search?${qs}` : "/search";
}
export function suggestionUrl(type, label, value, brandId) {
  switch (type) {
    case "brand":
      return searchUrl({ q: label, sort: "relevance", filters: { ...emptyFilters(), brandIds: brandId ? [brandId] : [] } });
    case "category":
      return searchUrl({ q: value || label, sort: "relevance", filters: { ...emptyFilters(), category: value || label } });
    default:
      return searchUrl(newState(value || label));
  }
}

/* ---- recent searches (original key) ---- */
const HISTORY = "parqis:search-history";
export function readHistory() {
  try {
    const a = JSON.parse(window.localStorage.getItem(HISTORY) || "[]");
    return Array.isArray(a) ? a.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 10) : [];
  } catch {
    return [];
  }
}
const writeHistory = (a) => {
  try {
    window.localStorage.setItem(HISTORY, JSON.stringify(a.slice(0, 10)));
  } catch {}
};
export function addHistory(q) {
  const t = q.trim();
  if (!t) return readHistory();
  const next = [t, ...readHistory().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 10);
  writeHistory(next);
  return next;
}
export function removeHistory(q) {
  const next = readHistory().filter((x) => x !== q.trim());
  writeHistory(next);
  return next;
}

/* ---- engine ---- */
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const stem = (t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t);
const crumb = (s) => String(s ?? "").split("/").map((x) => x.trim()).filter(Boolean);

const index = catalog.map((p) => ({
  p,
  title: norm(p.title),
  vendor: norm(p.vendor),
  type: norm(p.productType),
  attrs: norm(Object.values(p.attributes ?? {}).join(" ")),
}));

function sizesOf(p) {
  const names = [p.option1Name, p.option2Name, p.option3Name];
  const out = new Set();
  p.variants.forEach((v) => [v.option1, v.option2, v.option3].forEach((val, i) => val && /size/i.test(names[i] ?? "") && out.add(val)));
  return [...out];
}
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free size"];

export function runSearch(state) {
  const tokens = norm(state.q).split(" ").map(stem).filter(Boolean);
  const scored = [];
  for (const e of index) {
    let hits = 0;
    let score = 0;
    for (const t of tokens) {
      let s = 0;
      if (e.title.includes(t)) s += 3;
      if (e.vendor.includes(t)) s += 3;
      if (e.type.includes(t)) s += 2;
      if (e.attrs.includes(t)) s += 1;
      if (s > 0) hits += 1;
      score += s;
    }
    if (tokens.length === 0 || hits === 0) continue;
    scored.push({ p: e.p, hits, score });
  }
  // every word must match; fall back to "any word" so loose queries still show something
  const strict = scored.filter((x) => x.hits === tokens.length);
  let matches = strict.length > 0 ? strict : scored;

  if (state.filters.category) {
    const c = norm(state.filters.category);
    const byType = matches.filter((x) => norm(x.p.productType).includes(c));
    matches = byType.length > 0 ? byType : matches;
  }
  const facets = {
    brands: [...new Set(matches.map((x) => x.p.vendor).filter(Boolean))].sort().map((name) => ({ id: name, name })),
    sizes: [...new Set(matches.flatMap((x) => sizesOf(x.p)))].sort((a, b) => (SIZE_ORDER.indexOf(a) + 1 || 99) - (SIZE_ORDER.indexOf(b) + 1 || 99)).map((value) => ({ value })),
    price: matches.length ? { min: Math.min(...matches.map((x) => x.p.price ?? 0)), max: Math.max(...matches.map((x) => x.p.price ?? 0)) } : null,
  };

  const f = state.filters;
  let out = matches.filter((x) => {
    if (f.brandIds.length && !f.brandIds.includes(x.p.vendor)) return false;
    if (f.sizes.length && !sizesOf(x.p).some((s) => f.sizes.includes(s))) return false;
    if (f.minPrice != null && (x.p.price ?? 0) < f.minPrice) return false;
    if (f.maxPrice != null && (x.p.price ?? 0) > f.maxPrice) return false;
    return true;
  });
  const cmp = {
    relevance: (a, b) => b.score - a.score || (b.p.rating ?? 0) - (a.p.rating ?? 0),
    price_asc: (a, b) => (a.p.price ?? 0) - (b.p.price ?? 0),
    price_desc: (a, b) => (b.p.price ?? 0) - (a.p.price ?? 0),
    newest: (a, b) => String(b.p.createdAt ?? "").localeCompare(String(a.p.createdAt ?? "")),
    discount_desc: (a, b) => (b.p.discountPercent ?? 0) - (a.p.discountPercent ?? 0),
  }[state.sort];
  out = [...out].sort(cmp);
  return { items: out.map((x) => withVariants(x.p)), facets };
}

export function suggest(q, limit = 8) {
  const t = norm(q);
  if (t.length < MIN_QUERY) return [];
  const out = [];
  const seen = new Set();
  const push = (s) => {
    const k = `${s.type}:${s.label.toLowerCase()}`;
    if (!seen.has(k) && out.length < limit) {
      seen.add(k);
      out.push(s);
    }
  };
  for (const e of index) if (e.vendor && e.vendor.includes(t)) push({ type: "brand", label: e.p.vendor, value: e.p.vendor, brandId: e.p.vendor });
  for (const e of index) {
    const last = crumb(e.p.productType).pop();
    if (last && norm(last).includes(t)) push({ type: "category", label: last, value: last });
  }
  for (const e of index) if (e.title.includes(t)) push({ type: "product", label: e.p.title, value: e.p.title });
  return out;
}

/* ---- rails ---- */
const ranked = [...catalog].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
export const bestSellers = () => ranked.slice(0, 8).map(withVariants);
export const pairedWith = () => ranked.slice(8, 14).map(withVariants);
export const searchReels = () => reels;
