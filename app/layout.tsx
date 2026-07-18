import type { Metadata, Viewport } from "next";
import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { SITE_URL } from "../lib/siteConfig";

const description = "기억에 남은 꿈의 상징과 의미를 차분하게 풀어보세요. 인물, 동물, 장소, 행동 등 다양한 꿈의 의미를 살펴볼 수 있습니다.";
const analyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const searchVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const validAnalyticsId = /^G-[A-Z0-9]+$/i.test(analyticsId) ? analyticsId : "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "잠결",
  title: {
    default: "잠결 | 꿈해몽과 꿈풀이",
    template: "%s | 잠결",
  },
  description,
  keywords: ["꿈해몽", "꿈풀이", "꿈의 의미", "꿈 해석", "꿈 사전", "꿈 상징"],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "잠결 - 잠결에 남은 꿈의 의미",
    description: "어젯밤 꿈에서 기억나는 장면을 적고 꿈에 담긴 의미를 살펴보세요.",
    siteName: "잠결",
    locale: "ko_KR",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "잠결 - 잠결에 남은 꿈의 의미",
    description: "어젯밤 꿈에서 기억나는 장면을 적고 꿈에 담긴 의미를 살펴보세요.",
  },
  verification: searchVerification ? { google: searchVerification } : undefined,
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#050b18",
  width: "device-width",
  initialScale: 1,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "잠결",
  alternateName: "Jamgyeol",
  url: SITE_URL,
  description,
  inLanguage: "ko-KR",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">본문 바로가기</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        {children}
        {validAnalyticsId && <GoogleAnalytics measurementId={validAnalyticsId} />}
      </body>
    </html>
  );
}
