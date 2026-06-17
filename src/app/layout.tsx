import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beat AXIOM",
  description: "An AI that grades your sales instincts. Seven questions. One shot. Built by Rahul Kothari.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
