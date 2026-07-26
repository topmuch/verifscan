import type { Metadata } from "next";
import { Poppins, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
        className={`${poppins.variable} ${inter.variable} ${robotoMono.variable} antialiased bg-background text-foreground`}
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
