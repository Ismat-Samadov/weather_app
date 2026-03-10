import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doodle Jump — Neon Edition",
  description:
    "A neon-themed Doodle Jump platformer built with Next.js, TypeScript, and HTML5 Canvas. Jump higher, dodge obstacles, beat your high score!",
  keywords: ["doodle jump", "platformer", "game", "neon", "nextjs", "canvas"],
  authors: [{ name: "Doodle Jump Neon" }],
  // PWA / share metadata
  openGraph: {
    title: "Doodle Jump — Neon Edition",
    description: "How high can you jump? Play the neon platformer!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060614",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
