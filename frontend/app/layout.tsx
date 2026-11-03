import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#001233" },
  ],
};

export const metadata: Metadata = {
  title: "AOTMS — Real-Time Live Sports Auction & Tournament Bidding Platform",
  description: "Next-generation auction governance platform with instant live bidding, automated purse safeguards, and venue QR spectator check-in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} font-sans h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground text-[16px] sm:text-[17px] leading-relaxed">
        {children}
      </body>
    </html>
  );
}
