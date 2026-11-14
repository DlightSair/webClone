// Normal `next dev` / `next start` use the defaults.
// GitHub Pages build: STATIC_EXPORT=1 (+ BASE_PATH=/<repo> for project sites) -> see .github/workflows/deploy.yml
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = (process.env.BASE_PATH || "").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(staticExport ? { output: "export", distDir: ".next-export", trailingSlash: true, images: { unoptimized: true } } : {}),
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
export default nextConfig;
