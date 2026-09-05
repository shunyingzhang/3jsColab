import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3jsColab 基礎櫃體 Demo",
  description: "可分享的 Three.js 參數櫃體與基礎布局範例",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
