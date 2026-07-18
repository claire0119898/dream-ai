"use client";

import Link from "next/link";

export default function ErrorPage({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-[#050b18] px-4 py-16 text-center">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-violet-950/30 sm:p-12">
        <Link href="/" aria-label="잠결 홈" className="text-xl font-bold text-white">☾ 잠결</Link>
        <p className="mt-8 text-sm font-semibold tracking-[0.2em] text-violet-300">잠시 쉬어가는 중</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">페이지를 불러오지 못했습니다</h1>
        <p className="mt-4 leading-7 text-slate-400">잠시 후 다시 시도하거나 홈에서 다른 꿈의 의미를 살펴보세요.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => unstable_retry()} className="min-h-12 rounded-2xl bg-violet-500 px-6 font-bold text-white transition hover:bg-violet-400">다시 시도하기</button>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 px-6 font-semibold text-slate-200 hover:bg-white/[0.06]">홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
