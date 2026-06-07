import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
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
    <html lang="en" className={`${outfit.variable} ${playfairDisplay.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
