import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "정신간호 시뮬레이션 | 세명대학교 간호학과",
  description: "AI 환자와의 대화형 임상 실습 — 세명대학교 간호학과 정신간호 시뮬레이션 플랫폼",
  openGraph: {
    title: "정신간호 시뮬레이션 | 세명대학교 간호학과",
    description: "AI 환자와의 대화형 임상 실습 — MSE 사정, 입·퇴원 절차, 정신간호중재",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "정신간호 시뮬레이션 | 세명대학교 간호학과",
    description: "AI 환자와의 대화형 임상 실습 — MSE 사정, 입·퇴원 절차, 정신간호중재",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
