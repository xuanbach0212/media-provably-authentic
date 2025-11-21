import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppWalletProvider } from "@/providers/WalletProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ParticlesBackground from "@/components/ParticlesBackground";
import ShootingStars from "@/components/ShootingStars";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VerifyMedia - AI-Powered Media Authenticity Verification",
  description: "Verify media authenticity with advanced AI detection, provenance tracking, and blockchain attestations. Detect deepfakes and AI-generated content using the SUI ecosystem.",
  keywords: ["media verification", "deepfake detection", "AI detection", "blockchain", "SUI", "authenticity"],
  authors: [{ name: "VerifyMedia Team" }],
  openGraph: {
    title: "VerifyMedia - AI-Powered Media Authenticity Verification",
    description: "Detect deepfakes, trace origins, and prove authenticity using advanced AI and blockchain technology",
    type: "website",
    locale: "en_US",
    siteName: "VerifyMedia",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifyMedia - AI-Powered Media Authenticity Verification",
    description: "Detect deepfakes, trace origins, and prove authenticity using advanced AI and blockchain technology",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#0F1419' }}
      >
        {/* 3D Background - Fixed position, always visible, pointer-events-none */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <ParticlesBackground />
          <ShootingStars />
        </div>
        
        <ThemeProvider>
          <AppWalletProvider>
            <div className="relative" style={{ zIndex: 10 }}>
              {children}
            </div>
          </AppWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
