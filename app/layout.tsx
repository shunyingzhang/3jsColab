import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3jsColab 基础柜体 Demo",
  description: "可分享的 Three.js 参数柜体与基础布局示例",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
