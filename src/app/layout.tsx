import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import { ThemeSync } from "@/components/ThemeSwitch";
import "leaflet/dist/leaflet.css";
import "./globals.css";

// Mongolian needs Ө ө Ү ү (cyrillic-ext) and ₮ (latin-ext). Onest is a modern grotesque drawn Cyrillic-first,
// so one family covers headings and body; weight does the work. Unbounded lacked Ө/Ү/₮, so keep it out.
// --font-display in globals.css points at this same family so existing font-display classes keep working.
const inter = Onest({ variable: "--font-inter", subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"], display: "swap" });

export const metadata: Metadata = {
  title: "SMART ORKHON — Ухаалаг Орхон",
  description: "Орхон аймгийн мэдэгдэл, иргэдийн асуудал, шийдэл, AI туслахыг нэг дор холбосон иргэний технологийн платформ.",
  applicationName: "Ухаалаг Орхон",
  appleWebApp: { capable: true, title: "Ухаалаг Орхон", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};

// viewportFit "cover" lets the installed app use the whole screen; the bottom bar adds the safe-area padding itself.
export const viewport: Viewport = { themeColor: "#FFF4C5", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-navy pb-[calc(4rem+env(safe-area-inset-bottom))] text-snow md:pb-0">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
