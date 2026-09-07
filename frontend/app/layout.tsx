import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://orbiworld.io"),

  title: "ORBI WORLD",

  description:
    "ORBI WORLD — Connecting Worlds through a next-generation Web3 ecosystem.",

  icons: {
    icon: "/orbi-logo.png",
  },

  openGraph: {
    title: "ORBI WORLD",
    description:
      "ORBI WORLD — Connecting Worlds through a next-generation Web3 ecosystem.",
    url: "https://orbiworld.io",
    siteName: "ORBI WORLD",
    images: [
      {
        url: "/orbi-logo.png",
        alt: "ORBI WORLD",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ORBI WORLD",
    description:
      "ORBI WORLD — Connecting Worlds through a next-generation Web3 ecosystem.",
    images: ["/orbi-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}