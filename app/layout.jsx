import "./styles/original.css";
import "./styles/fonts.css";
import Shell from "@/components/Shell";

export const metadata = {
  title: { default: "Online Shopping & Entertainment - PARQIS", template: "%s - PARQIS" },
  description: "Parqis social commerce web",
  applicationName: "PARQIS",
  manifest: "/manifest.json",
  other: { "mobile-web-app-capable": "yes" },
  appleWebApp: { title: "PARQIS", statusBarStyle: "default" },
  openGraph: { title: "Online Shopping & Entertainment - PARQIS", description: "Parqis social commerce web", siteName: "PARQIS" },
  twitter: { card: "summary", title: "Online Shopping & Entertainment - PARQIS", description: "Parqis social commerce web" },
  icons: [
    { rel: "icon", url: "/favicon.ico", type: "image/x-icon", sizes: "16x16" },
    { rel: "icon", url: "/icon.png", type: "image/png", sizes: "512x512" },
  ],
};

export const viewport = { themeColor: "#23143E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="__variable_d9d98a __variable_375422 h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
