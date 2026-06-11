import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Configure Outfit font for modern UI elements
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Configure Playfair Display font for luxury brand and cinematic typography
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// Local display + body fonts for the Signature Favourites showcase (Section 02).
const after = localFont({
  src: "../../public/assets/Fonts/after-modern-display-sans-serif-font-family-2026-04-07-06-16-35-utc/After - Modern Display Sans-Serif Font/TrueType/After-Regular.woff2",
  variable: "--font-after",
  display: "swap",
});

const gotib = localFont({
  src: "../../public/assets/Fonts/gotib-elegant-modern-sans-serif-2026-04-07-06-22-14-utc/Gotib.ttf",
  variable: "--font-gotib",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gujju Food Hub | Cinematic Journey of Authentic Indian Flavours in Hobart",
  description: "Experience a cinematic culinary journey from Gujarat to Hobart, Tasmania. Savour premium Kutchi Dabeli, Mumbai Vada Pav, and rich Halal curries cooked to perfection with traditional recipes.",
  keywords: "Gujarati food Hobart, Indian restaurant Moonah, Vada Pav Hobart, Dabeli Tasmania, Halal Indian Hobart, Gujju Food Hub, dining Moonah",
  authors: [{ name: "Gujju Food Hub" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfairDisplay.variable} ${after.variable} ${gotib.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
