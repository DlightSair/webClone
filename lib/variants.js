// Variant option helpers (ported from the original storefront bundle)
const SIZE_RE = /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|\d{1,2}(?:\.\d)?|\d{1,2}\/\d{1,2})$/i;
const SIZE_WORD_RE = /^(small|medium|large|x-?large|xx-?large|extra\s*small|extra\s*large)$/i;
const COLORS = new Set(["white", "black", "navy", "blue", "red", "green", "yellow", "orange", "purple", "pink", "brown", "grey", "gray", "beige", "cream", "maroon", "teal", "olive", "gold", "silver", "ivory", "charcoal", "burgundy", "coral", "mint", "tan", "khaki", "indigo", "magenta", "cyan", "peach", "lavender", "mustard", "wine", "rust", "sand", "nude", "rose"]);

const uniqSorted = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const isSize = (v) => {
  const t = v.trim();
  return SIZE_RE.test(t) || SIZE_WORD_RE.test(t);
};
const isColor = (v) => {
  const t = v.trim().toLowerCase();
  return COLORS.has(t) || [...COLORS].some((c) => t.includes(c));
};
const isStyle = (v) => {
  const t = v.trim();
  return t.length > 0 && !isSize(t) && !isColor(t);
};

export const inStock = (v) => !!(v && (typeof v.inStock === "boolean" ? v.inStock : v.inventoryQty > 0));

const SIZE_ORDER = { xxs: 1, xs: 2, s: 3, m: 4, l: 5, xl: 6, xxl: 7, "2xl": 7, xxxl: 8, "3xl": 8, "4xl": 9 };

export function optionNames(product) {
  return { option1: product.option1Name ?? null, option2: product.option2Name ?? null, option3: product.option3Name ?? null };
}

export function selectionOf(variant) {
  if (!variant) return {};
  const out = {};
  if (variant.option1) out.option1 = variant.option1;
  if (variant.option2) out.option2 = variant.option2;
  if (variant.option3) out.option3 = variant.option3;
  return out;
}

export function buildOptionGroups(variants, names) {
  const raw = ["option1", "option2", "option3"]
    .map((key) => {
      const values = uniqSorted(variants.map((v) => v[key]).filter(Boolean));
      if (values.length <= 1) return null;
      const kind = (() => {
        const n = values.filter(isSize).length;
        const c = values.filter(isColor).length;
        if (n === values.length) return "size";
        if (c === values.length) return "color";
        if (n > 0 && n >= c) return "size";
        if (c > 0 && c > n) return "color";
        return values.every(isStyle) ? "style" : "unknown";
      })();
      return { key, values, kind };
    })
    .filter(Boolean);

  const kinds = new Map(raw.map((g) => [g.key, g.kind]));
  const sizes = raw.filter((g) => g.kind === "size").map((g) => g.key);
  const unknown = raw.filter((g) => g.kind === "unknown");
  if (sizes.length === 1 && unknown.length === 1) {
    const g = unknown[0];
    if (!g.values.some(isSize)) kinds.set(g.key, "color");
  }
  for (const g of unknown) if (kinds.get(g.key) === "unknown" && sizes.length > 0 && !g.values.some(isSize) && g.values.length > 1) kinds.set(g.key, "color");

  return raw.map((g) => {
    const label = names?.[g.key]?.trim() || null;
    const kind = kinds.get(g.key) ?? g.kind;
    const fallback = kind === "size" ? "Size" : kind === "color" ? "Color" : kind === "style" || g.key === "option1" ? "Style" : g.key === "option2" ? "Option 2" : "Option 3";
    const values =
      kind === "size"
        ? [...g.values].sort((a, b) => {
            const x = a.trim().toLowerCase();
            const y = b.trim().toLowerCase();
            const ox = SIZE_ORDER[x];
            const oy = SIZE_ORDER[y];
            if (ox !== undefined && oy !== undefined) return ox - oy;
            if (ox !== undefined) return -1;
            if (oy !== undefined) return 1;
            const nx = Number.parseFloat(x);
            const ny = Number.parseFloat(y);
            return Number.isNaN(nx) || Number.isNaN(ny) ? a.localeCompare(b, undefined, { numeric: true }) : nx - ny;
          })
        : uniqSorted(g.values);
    return { key: g.key, label: label ?? fallback, kind, values };
  });
}

// values of `key` that are available given the rest of the current selection
export function availableValues(variants, selection, key) {
  return uniqSorted(
    variants
      .filter((v) => inStock(v) && ["option1", "option2", "option3"].every((k) => k === key || !selection[k] || v[k] === selection[k]))
      .map((v) => v[key])
      .filter(Boolean)
  );
}

export function findVariant(variants, selection) {
  const list = variants.filter((v) => ["option1", "option2", "option3"].every((k) => !selection[k] || v[k] === selection[k]));
  return list.find(inStock) ?? list[0] ?? null;
}

export function isDefaultTitle(t) {
  const x = t?.trim().toLowerCase();
  return !x || /^default(?:\s+(?:title|variant))?$/.test(x);
}
