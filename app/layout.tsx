import type { Metadata } from "next";
import "./globals.css";

/**
 * LAYOUT — Roda da Sorte Visit Braga (feiras internacionais)
 * Tipografia: Archivo Black (display) + Inter (corpo).
 * Favicon: app/icon.png (sino oficial da marca).
 *
 * NOTA: o viewport e o theme-color são declarados como <meta> à mão,
 * em vez do export `viewport` tipado. Esse export só existe a partir do
 * Next 14 e o template do StackBlitz usa uma versão anterior — assim a
 * app compila em qualquer versão.
 */

export const metadata: Metadata = {
  title: "Visit Braga — Roda da Sorte · Rueda de la Suerte · Wheel of Fortune",
  description:
    "Gira e ganha no stand Visit Braga — a cidade mais antiga de Portugal.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        {/* modo quiosque: sem zoom por gesto no tablet do stand */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#e00009" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Roda Braga" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* as fotografias vêm por URL (lib/fotos.ts): abrir a ligação cedo
            poupa ~200 ms na primeira entrada em modo montra */}
        <link rel="preconnect" href="https://i.imgur.com" />
        <link rel="dns-prefetch" href="https://i.imgur.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}