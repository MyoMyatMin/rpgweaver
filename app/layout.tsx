import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rpgweaver.app"),
  title: {
    default: "RPGWeaver — AI Narrative Generation",
    template: "%s | RPGWeaver",
  },
  description:
    "Generate rich RPG dialogues and quests with AI. Fast, structured, and lore-aware.",
  applicationName: "RPGWeaver",
  keywords: [
    "RPG",
    "AI",
    "Gemini",
    "Quest Generator",
    "Dialogue Generator",
    "Game Tools",
  ],
  openGraph: {
    title: "RPGWeaver — AI Narrative Generation",
    description:
      "Generate rich RPG dialogues and quests with AI. Fast, structured, and lore-aware.",
    url: "https://rpgweaver.app",
    siteName: "RPGWeaver",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RPGWeaver — AI Narrative Generation",
    description:
      "Generate rich RPG dialogues and quests with AI. Fast, structured, and lore-aware.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
