import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

/**
 * LAYOUT
 * -------
 * FONTES SERVIDAS LOCALMENTE (next/font/google). Antes vinham por <link>
 * do Google Fonts: sem rede - e o wi-fi das feiras é mau - o design
 * colapsava em fontes de sistema. Agora são incluídas no build e a app
 * arranca com o aspeto certo mesmo com o wi-fi DESLIGADO.
 *
 * O viewport vai como <meta> à mão, e não pelo export `viewport` tipado:
 * esse só existe a partir do Next 14 e o template do StackBlitz é anterior.
 */

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--fonte-display",
  display: "swap",
});

const corpo = Inter({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Visit Braga - Roda da Sorte · Rueda de la Suerte · Wheel of Fortune",
  description:
    "Gira e ganha no stand Visit Braga - a cidade mais antiga de Portugal.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${display.variable} ${corpo.variable}`}>
      <head>
        {/* modo quiosque: sem zoom por gesto no tablet do stand */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#e00009" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Roda Braga" />
      </head>
      <body>{children}</body>
    </html>
  );
}
