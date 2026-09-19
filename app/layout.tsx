import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinOrbit — Money & Markets",
  description: "Personal finance, payments and trading in one original fintech experience",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
