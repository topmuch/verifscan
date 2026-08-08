import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";

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
  manifest: "/manifest.json",
  applicationName: "VerifScan",
  appleWebApp: {
    capable: true,
    title: "VerifScan",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "VerifScan — La vérité au bout du scan",
    description:
      "Passeport numérique pour vos produits via QR codes. Traçabilité, authenticité et transparence.",
    siteName: "VerifScan",
    type: "website",
    locale: "fr_SN",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "VerifScan" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f4382",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        <ServiceWorkerRegister />
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
