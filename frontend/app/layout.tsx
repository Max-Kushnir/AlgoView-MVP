import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlgoView - AI Coding Interview Platform",
  description: "Practice coding interviews with AI-powered real-time feedback",
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
