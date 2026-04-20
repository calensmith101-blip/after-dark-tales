import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "After Dark Tales",
  description: "Personalised fiction for late-night readers",
  manifest: "/manifest.json",
  themeColor: "#0a0a0f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "After Dark Tales",
  },
  icons: {
    icon: "/icon_512x512.png",
    apple: "/icon_512x512.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon_512x512.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
