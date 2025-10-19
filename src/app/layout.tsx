import type { Metadata } from "next";
import "./globals.css";
import { inter, hind } from "./fonts";
import DecorativeBG from "@/components/DecorativeBG";

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
        url: "/og.png",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
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
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Payments */}
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <script defer src="https://checkout.razorpay.com/v1/checkout.js"></script>

        {/* Color scheme + PWA niceties */}
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Org JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body
        className={`${inter.variable} ${hind.variable} relative min-h-dvh bg-gray-50 text-gray-900 antialiased selection:bg-amber-200 selection:text-amber-900`}
        style={{
          // Respect iOS safe areas for any fixed bars you might add
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Festive ambient background */}
        <DecorativeBG />

        {/* Soft vignette for depth */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% -10%, rgba(255,255,255,0.65), rgba(255,255,255,0.25) 45%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.28))",
          }}
        />

        {/* Ultra-subtle noise / grain */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 40 40'><circle cx='1' cy='1' r='1' fill='black' opacity='0.7'/></svg>\")",
          }}
        />

        {/* Accessibility: Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>

        {/* Portal target for modals/menus/toasts */}
        <div id="portal-root" />

        <div id="main">{children}</div>

        {/* No-JS notice for critical flows */}
        <noscript>
          <div className="fixed inset-x-0 bottom-0 z-50 m-2 rounded-lg bg-amber-100 p-3 text-center text-sm text-amber-900 shadow">
            Some features (payments, previews) need JavaScript enabled.
          </div>
        </noscript>
      </body>
    </html>
  );
}
