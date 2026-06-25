import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { env } from "@/config/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // Italic at high weight reads closest to a tailoring-house wordmark;
  // restrained to the wordmark and large editorial headings only.
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  // `metadataBase` resolves relative `alternates.canonical` / `openGraph.url`
  // values (set per-page) into absolute URLs for social sharing and crawlers.
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),

  title: {
    default: "Maison Noir — Considered Menswear",
    template: "%s | Maison Noir",
  },

  description:
    "Tailored menswear cut from the finest cloth. Shop suiting, outerwear, footwear, and accessories built to last seasons, not trends.",

  keywords: [
    "menswear",
    "tailoring",
    "suiting",
    "outerwear",
    "luxury clothing",
    "considered menswear",
  ],

  authors: [{ name: "Maison Noir" }],

  // Prevent indexing of admin, checkout, and other transactional pages
  // at the root level; per-page `robots` overrides this for those routes.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    siteName: "Maison Noir",
    locale: "en_US",
    title: "Maison Noir — Considered Menswear",
    description:
      "Tailored menswear cut from the finest cloth. Shop suiting, outerwear, footwear, and accessories built to last seasons, not trends.",
    url: "/",
    // Default OG image provided by src/app/opengraph-image.tsx
  },

  twitter: {
    card: "summary_large_image",
    site: "@maisonnoir",        // update to your actual handle
    creator: "@maisonnoir",
    title: "Maison Noir — Considered Menswear",
    description:
      "Tailored menswear cut from the finest cloth. Shop suiting, outerwear, footwear, and accessories.",
  },

  // Add your Search Console verification token once the site is deployed
  // verification: { google: "xxxxxxxxxxxxxxxxxxxx" },

  // PWA / Safari mobile metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maison Noir",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} flex min-h-screen flex-col bg-background font-sans text-foreground antialiased`}
      >
        <CartProvider>
          <WishlistProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </WishlistProvider>
        </CartProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "flex items-center gap-3 border border-border bg-background px-4 py-3 text-sm text-foreground shadow-lg w-full",
              title: "font-medium",
              description: "text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
