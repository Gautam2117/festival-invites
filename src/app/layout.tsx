import type { Metadata } from "next";
import "./globals.css";
import { inter, hind } from "./fonts";

export const metadata: Metadata = {
  title: "Festival Invites",
  description: "WhatsApp-first festival e-invites & wishes",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${hind.variable} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
