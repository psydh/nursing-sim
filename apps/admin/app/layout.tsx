import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nursing Sim 관리자",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
