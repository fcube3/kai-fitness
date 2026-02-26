import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kai Fitness Hub",
  description: "Personal fitness tracking dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
