# Clone plan: https://parqis.com/

Goal: 1:1 copy of the live site's frontend, including its quirks, bugs and responsive behaviour. No redesign, no "improvements".
Competition rule: frontend only (HTML, CSS, JavaScript, React, Next.js). So: **no backend, no replay server**. All data is static JSON in the repo.

## What the original is
- Next.js 15 App Router + React, Tailwind CSS v4 output, DM Sans fonts. Mobile-first shell: `max-w-[430px]` centred on desktop.
- Content renders client-side after a spinner; data came from `/backend/api/*` and NextAuth (`/api/auth/session`).
- Images from a CloudFront CDN and `video.gumlet.io`; local `/public` icons and the festive header background.
- Layout chrome (header, bottom nav, popups) depends on the pathname.

## Stack for the clone
- Next.js 15 (App Router) + React 19, authored source in `app/` and `src/`.
- Original compiled Tailwind CSS reused as plain CSS (`app/styles/original.css`) so every class name renders identically; fonts self-hosted in `public/fonts`.
- Data: `src/data/*.json` built from captured live responses (home sections, categories, 237 products, 20 collections, category page).
- Media: downloaded to `public/media/<host>/...`, data rewritten to local paths.
- `_capture/` (gitignored) holds the raw capture of the live site as reference.

## Work breakdown
1. [done] Inspect site, capture routes, bundle, API responses, assets.
2. [done] Scaffold Next.js project, copy CSS, fonts, public assets, install deps.
3. [done] Convert captures to `src/data` JSON.
4. [running] Download CDN media and rewrite data to `/media/...`.
5. Shell: root layout, header (festive background, address button, search button), bottom nav, route-based chrome visibility, popup logic.
6. Home: category tabs with sliding pill, sub-category icons, section renderers (`banner_long`, `product_cards`, `trends_secondary`, loading skeletons).
7. Remaining pages: `/categories`, `/trends`, `/feed`, `/reels`, `/shop`, `/shop/[id]`, `/[slug]` collections (incl. "Collection Not Found" for unknown slugs, which returns HTTP 200 on the original), `/cart`, `/wishlist`, `/profile`, `/search`, `/about`, legal pages, `/creator/[handle]`, `/brand/[handle]`.
8. Client state that used the API (cart, wishlist, auth session) moves to local state / localStorage, keeping the same UI behaviour.
9. Verify: compare each route with the live site at mobile / tablet / desktop widths; keep original bugs (for example product cards linking to product IDs that 404 on the live site).

## Caveats
- This is a copy of someone else's production site. Do not publish it under the PARQIS name or domain.
- Things that need a real backend (login OTP, checkout, payments) can only mimic the UI.
