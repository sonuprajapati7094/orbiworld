import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBI WORLD",
  description:
    "ORBI WORLD — Connecting Worlds through a next-generation Web3 ecosystem.",
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