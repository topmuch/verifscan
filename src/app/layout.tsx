import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VerifScan — La vérité au bout du scan",
  description:
    "VerifScan offre aux fabricants un passeport numérique pour leurs produits via QR codes : traçabilité, authenticité et transparence pour les consommateurs.",
  keywords: [
    "VerifScan",
    "traçabilité",
    "QR code",
    "authenticité",
    "agroalimentaire",
    "Sénégal",
    "Afrique de l'Ouest",
  ],
  authors: [{ name: "VerifScan" }],
  openGraph: {
    title: "VerifScan — La vérité au bout du scan",
    description:
      "Passeport numérique pour vos produits via QR codes. Traçabilité, authenticité et transparence.",
    siteName: "VerifScan",
    type: "website",
    locale: "fr_SN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
