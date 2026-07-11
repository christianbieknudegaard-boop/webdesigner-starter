import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bokfink – kjøp og selg brukte bøker og filmer",
    template: "%s | Bokfink",
  },
  description:
    "Bokfink er markedsplassen for brukte bøker og filmer. Finn billige pensumbøker, romaner og filmer på DVD/Blu-ray – eller selg det du er ferdig med.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bokfink",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f5d50",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SiteHeader />
        <main className="mx-auto min-h-[60vh] w-full max-w-6xl px-4 py-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
