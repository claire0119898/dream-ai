"use client";

import Link from "next/link";
import "./globals.css";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="ko">
      <body>
        <main id="main-content" className="grid min-h-screen place-items-center bg-[#050b18] px-4 py-16 text-center">
          <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 sm:p-12">
            <title>잠시 문제가 생겼습니다 | 잠결</title>
            <Link href="/" aria-label="잠결 홈" className="text-xl font-bold text-white">☾ 잠결</Link>
            <h1 className="mt-8 text-3xl font-bold text-white sm:text-4xl">잠시 문제가 생겼습니다</h1>
            <p className="mt-4 leading-7 text-slate-400">페이지를 다시 불러오거나 잠시 후 홈에서 다시 시작해주세요.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => unstable_retry()} className="min-h-12 rounded-2xl bg-violet-500 px-6 font-bold text-white hover:bg-violet-400">다시 불러오기</button>
              <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 px-6 font-semibold text-slate-200">홈으로 돌아가기</Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
