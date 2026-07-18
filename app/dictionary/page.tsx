import type { Metadata } from "next";
import Link from "next/link";
import DictionaryBrowser from "../../components/DictionaryBrowser";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { absoluteUrl } from "../../lib/siteConfig";

const title = "꿈 사전 - 꿈 상징 93가지 찾기";
const description = "동물, 자연, 사람, 장소, 행동 등 93가지 꿈 상징을 검색해보세요. 별칭과 비슷한 검색어까지 찾아 기본 의미와 상황별 꿈풀이를 살펴볼 수 있습니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/dictionary" },
  openGraph: {
    title: `${title} | 잠결`,
    description,
    url: "/dictionary",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: `${title} | 잠결`, description },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "잠결 꿈 사전",
  description,
  url: absoluteUrl("/dictionary"),
  inLanguage: "ko-KR",
  numberOfItems: 93,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "잠결", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "꿈 사전", item: absoluteUrl("/dictionary") },
    ],
  },
};

export default function DictionaryPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050b18]">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="현재 위치" className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">홈</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page" className="text-slate-300">꿈 사전</span>
        </nav>
        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.22em] text-violet-300">JAMGYEOL DREAM DICTIONARY</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">꿈에 남은 상징을 찾아보세요</h1>
          <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">93가지 핵심 상징과 129개의 별칭을 바탕으로, 기억나는 장면에 가까운 꿈의 의미를 차분하게 살펴볼 수 있습니다.</p>
        </div>
        <DictionaryBrowser />
      </div>
      <Footer />
    </main>
  );
}
