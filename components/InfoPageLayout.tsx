import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";

type InfoPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt?: string;
  children: ReactNode;
};

export default function InfoPageLayout({ eyebrow, title, description, updatedAt, children }: InfoPageLayoutProps) {
  return (
    <main id="main-content" className="min-h-screen bg-[#050b18]">
      <Header />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <nav aria-label="현재 위치" className="text-sm text-slate-500"><Link href="/" className="hover:text-slate-300">홈</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page" className="text-slate-300">{title}</span></nav>
        <header className="mt-8 border-b border-white/10 pb-8 sm:pb-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-300">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">{description}</p>
          {updatedAt && <p className="mt-4 text-xs text-slate-500">최종 수정일 · {updatedAt}</p>}
        </header>
        <div className="info-document mt-8 space-y-5 text-slate-300">{children}</div>
      </article>
      <Footer />
    </main>
  );
}
