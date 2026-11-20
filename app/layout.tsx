import type { Metadata, Viewport } from "next";
import MetaPixel from "@/components/MetaPixel";
import { site } from "@/lib/site";
import "./globals.css";

const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: `${site.brand} — ${site.company} | Uy-joy sotuvi`,
  description: site.hero.text,
  openGraph: {
    title: `${site.brand} — Uy-joy sotuvi`,
    description: site.hero.text,
    images: ["/og.jpg"],
    locale: "uz_UZ",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#1c1d22", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://connect.facebook.net" />
      </head>
      <body>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
