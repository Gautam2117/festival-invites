// app/layout.tsx (RootLayout)
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, hind } from "./fonts";
import DecorativeBG from "@/components/DecorativeBG";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Festival Invites",
    template: "%s · Festival Invites",
  },
  description: "WhatsApp-first festival e-invites & wishes",
  applicationName: "Festival Invites",
  keywords: [
    "festival invites",
    "wishes",
    "WhatsApp",
    "video invites",
    "e-cards",
    "greetings",
  ],
  authors: [{ name: "Festival Invites" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Festival Invites",
    title: "Create stunning festival invites & wishes",
    description:
      "Pick a template, personalize, and export a beautiful video or image.",
    images: [
      {
        url: "https://festival-invites.vercel.app/og-image_current.png",
        width: 1200,
        height: 630,
        alt: "Festival Invites preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Festival Invites — WhatsApp-first e-invites & wishes",
    description: "Create festive videos & images in seconds.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Festival Invites",
    url: appUrl,
    logo: `${appUrl}/apple-touch-icon.png`,
  };

  return (
    <html
      lang="en"
      className="h-full overflow-x-hidden scroll-smooth" // prevent horizontal jiggle & keep anchor scroll smooth
      suppressHydrationWarning
    >
      <head>
        {/* Color scheme + PWA niceties */}
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${hind.variable} relative min-h-[100svh] md:min-h-dvh bg-gray-50 text-gray-900 antialiased selection:bg-amber-200 selection:text-amber-900`}
        // Keep layout from shifting when vertical scrollbar appears/disappears
        style={{ scrollbarGutter: "stable" as any }}
      >
        {/* Accessibility: Skip link - first element in body */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>

        {/* Festive ambient background (now mobile-light inside component) */}
        <DecorativeBG />

        {/* Desktop-only extra vignette & grain to avoid mobile jank */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 hidden md:block"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% -10%, rgba(255,255,255,0.65), rgba(255,255,255,0.25) 45%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.28))",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 hidden md:block opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 40 40'><circle cx='1' cy='1' r='1' fill='black' opacity='0.7'/></svg>\")",
          }}
        />

        {/* Portal target for modals/menus/toasts */}
        <div id="portal-root" />

        {/* Pages own their own <main id="main"> */}
        {children}

        <noscript>
          <div className="fixed inset-x-0 bottom-0 z-50 m-2 rounded-lg bg-amber-100 p-3 text-center text-sm text-amber-900 shadow">
            Some features (payments, previews) need JavaScript enabled.
          </div>
        </noscript>
      </body>
    </html>
  );
}
