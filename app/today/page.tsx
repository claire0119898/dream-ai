import type { Metadata } from "next";
import Link from "next/link";
import { coreDreamKeywords } from "../../data/dreamDictionary";

export const metadata: Metadata = {
  title: "오늘의 꿈",
  description: "오늘 하루, 하나의 꿈 상징을 살펴보세요.",
};

function pickTodayKeyword() {
  const today = new Date();
  const dayNumber = Number(
    `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`
  );
  const index = dayNumber % coreDreamKeywords.length;
  return coreDreamKeywords[index];
}

export default function TodayPage() {
  const item = pickTodayKeyword();
  const todayLabel = new Date().toLocaleDateString("ko-KR");

  return (
    <main className="min-h-screen bg-[#050b18] px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm text-slate-500">{todayLabel}의 꿈 상징</p>
        <h1 className="mt-3 text-5xl">{item.emoji}</h1>
        <h2 className="mt-3 text-3xl font-bold text-white">{item.keyword}</h2>

        <p className="mt-6 leading-8 text-slate-300">{item.meaning}</p>

        <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <p className="font-bold text-white">좋은 의미</p>
            <p className="mt-1 text-sm text-slate-400">{item.good}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
            <p className="font-bold text-white">주의할 점</p>
            <p className="mt-1 text-sm text-slate-400">{item.caution}</p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={`/dream/${encodeURIComponent(item.keyword)}`}
            className="inline-block rounded-2xl bg-violet-500 px-6 py-3 font-bold text-white hover:bg-violet-600"
          >
            자세히 보기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
