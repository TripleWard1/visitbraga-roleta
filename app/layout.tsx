import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * LAYOUT — Roda da Sorte Visit Braga (feiras internacionais)
 * Tipografia geométrica coerente com o logótipo:
 * Archivo Black (display) + Inter (corpo).
 * Favicon: app/icon.png (sino oficial da marca).
 */

export const metadata: Metadata = {
  title: "Visit Braga — Roda da Sorte · Rueda de la Suerte · Wheel of Fortune",
  description:
    "Gira e ganha no stand Visit Braga — a cidade mais antiga de Portugal.",
  // PWA: instalável no ecrã inicial do tablet do stand (sem barra de
  // browser, arranca como app nativa). Ver public/manifest.json.
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roda Braga",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e00009",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
