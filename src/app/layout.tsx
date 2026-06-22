import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beat AXIOM",
  description: "An AI that grades your sales instincts. Seven minutes. One shot. Built by Rahul Kothari.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#060810" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
