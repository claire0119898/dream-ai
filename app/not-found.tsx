import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { dreamPath } from "../lib/siteConfig";

const popularDreams = ["뱀", "이빨", "물", "돈"];

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  description: "찾으시는 페이지가 보이지 않습니다. 잠결 홈이나 꿈 사전에서 꿈의 의미를 살펴보세요.",
};

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050b18]">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-sm font-semibold tracking-[0.22em] text-violet-300">404 · 길을 잃은 꿈</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">찾으시는 페이지가 보이지 않아요</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-400">주소가 바뀌었거나 페이지가 사라졌을 수 있습니다. 홈으로 돌아가거나 꿈 사전에서 궁금한 상징을 찾아보세요.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-violet-500 px-6 font-bold text-white transition hover:bg-violet-400">홈으로 돌아가기</Link>
          <Link href="/dictionary" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 px-6 font-semibold text-slate-200 transition hover:bg-white/[0.06]">꿈 사전 둘러보기</Link>
        </div>
        <nav aria-label="많이 찾는 꿈" className="mt-12 flex flex-wrap justify-center gap-2">
          {popularDreams.map((keyword) => <Link key={keyword} href={dreamPath(keyword)} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:border-violet-300/30 hover:text-white">{keyword} 꿈해몽</Link>)}
        </nav>
      </section>
      <Footer />
    </main>
  );
}
