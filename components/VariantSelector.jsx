"use client";

import { useMemo } from "react";
import { availableValues, buildOptionGroups, findVariant, selectionOf } from "@/lib/variants";

// Colour tiles + size buttons used inside the quick-add and cart variant sheets
export default function VariantSelector({ variants, optionNames, selectedVariant, onSelectVariant, onOpenSizeGuide }) {
  const groups = useMemo(() => buildOptionGroups(variants, optionNames), [optionNames, variants]);
  const selection = useMemo(() => selectionOf(selectedVariant), [selectedVariant]);
  if (groups.length === 0) return null;
  const pick = (key, value) => {
    const next = { ...selection, [key]: value };
    onSelectVariant(findVariant(variants, next));
  };
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => {
        const avail = availableValues(variants, selection, g.key);
        const isColor = g.kind === "color" || g.label.toLowerCase().includes("col");
        const isSize = g.kind === "size" || g.label.toLowerCase().includes("size");
        const current = selection[g.key] || "";
        if (isColor) {
          return (
            <div key={g.key} className="flex flex-col gap-2">
              <div>
                <span className="text-[18px] font-medium text-[#1C1B1F]">Colour: </span>
                <span className="text-[14px] font-normal text-[#1C1B1F]">{current}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {g.values.map((val) => {
                  const chosen = current === val;
                  const ok = avail.includes(val);
                  const match = variants.find((v) => (v[g.key] || "").toLowerCase() === val.toLowerCase());
                  const img = match?.imageUrl;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={!ok}
                      onClick={() => pick(g.key, val)}
                      className={`relative h-[64px] w-[45px] shrink-0 overflow-hidden rounded-[4px] transition ${chosen ? "border-2 border-[#A92645]" : ok ? "border border-black/20 opacity-85 hover:opacity-100 cursor-pointer" : "cursor-not-allowed border border-black/10 opacity-40"}`}
                      aria-label={`Select color ${val}`}
                    >
                      {img ? <img src={img} alt={val} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-[#F3F3F3] text-[10px] font-medium text-black/70">{val}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div key={g.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[18px] font-medium text-[#1C1B1F]">{isSize ? "Sizes: " : `${g.label}: `}</span>
                <span className="text-[14px] font-normal text-[#1C1B1F]">{current}</span>
              </div>
              {isSize && onOpenSizeGuide ? (
                <button type="button" onClick={onOpenSizeGuide} className="text-[14px] text-[#A92645] hover:underline cursor-pointer">
                  Size Guide
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-[5px]">
              {g.values.map((val) => {
                const chosen = current === val;
                return avail.includes(val) ? (
                  <button
                    key={val}
                    type="button"
                    onClick={() => pick(g.key, val)}
                    className={`flex h-[25px] w-[82px] items-center justify-center rounded-[4px] text-[10px] font-normal transition cursor-pointer ${chosen ? "bg-[#A92645] font-medium text-white border-transparent" : "border border-[#CCCCCC] bg-white font-normal text-[#1C1B1F] hover:border-black"}`}
                  >
                    {val}
                  </button>
                ) : (
                  <span key={val} className="flex h-[25px] w-[82px] items-center justify-center rounded-[4px] border border-dashed border-[#DDDDDD] bg-white text-[10px] font-normal text-[#CCCCCC] cursor-not-allowed">
                    {val}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
