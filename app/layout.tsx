import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://dream-ai.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "꿈해몽 AI - 무료 AI 꿈해몽 서비스",
    template: "%s | 꿈해몽 AI",
  },
  description:
    "로그인 없이 바로 확인하는 무료 AI 꿈해몽 서비스입니다. 꿈 내용을 입력하면 상징, 감정, 상황을 분석해 해몽 결과를 알려드립니다.",
  openGraph: {
    title: "꿈해몽 AI - 무료 AI 꿈해몽 서비스",
    description: "로그인 없이 바로 확인하는 무료 AI 꿈해몽 서비스입니다.",
    siteName: "꿈해몽 AI",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
