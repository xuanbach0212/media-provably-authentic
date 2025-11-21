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
  title: "Media Provably Authentic",
  description: "Verify media authenticity with AI detection, provenance tracking, and blockchain attestations",
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
        style={{ background: 'var(--theme-background)' }}
      >
        <ParticlesBackground />
        <ShootingStars />
        <ThemeProvider>
          <AppWalletProvider>
            <div className="relative z-10">
              {children}
            </div>
          </AppWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
