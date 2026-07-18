import Link from "next/link";
import { coreDreamKeywords, popularKeywords } from "../data/coreDreamKeywords";
import { getDreamEditorial } from "../data/dreamEditorial";
import { dreamPath } from "../lib/siteConfig";

const categoryCards = [
  { name: "동물", icon: "🐾", copy: "뱀·고양이·강아지" },
  { name: "자연", icon: "🌊", copy: "물·불·바다" },
  { name: "사람", icon: "◯", copy: "가족·아기·연인" },
  { name: "장소", icon: "⌂", copy: "집·학교·회사" },
  { name: "행동", icon: "↗", copy: "날기·시험·도망" },
  { name: "재물", icon: "◇", copy: "돈·복권·보석" },
];

const recentlyRefinedNames = ["시험보다", "개", "고양이", "돼지"];

function displayDreamName(keyword: string) {
  return getDreamEditorial(keyword)?.displayName ?? keyword;
}

export default function HomeDiscovery() {
  const topTen = popularKeywords.slice(0, 10);
  const todayPopular = popularKeywords.slice(0, 5);
  const recentlyAdded = recentlyRefinedNames
    .map((name) => coreDreamKeywords.find((item) => item.keyword === name))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 sm:py-16">
      <section id="keywords" aria-labelledby="top-dreams-title" className="content-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">POPULAR DREAMS</p><h2 id="top-dreams-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">인기 꿈 TOP 10</h2></div>
          <Link href="/dictionary" className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-300 hover:text-violet-200">꿈 사전 전체 보기 →</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {topTen.map((item, index) => (
            <Link key={item.keyword} href={dreamPath(item.keyword)} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-violet-500/[0.08]">
              <span className="text-xs font-bold tabular-nums text-slate-600">{String(index + 1).padStart(2, "0")}</span>
              <span aria-hidden="true" className="text-2xl">{item.emoji}</span>
              <span><strong className="block text-white group-hover:text-violet-100">{displayDreamName(item.keyword)} 꿈</strong><small className="mt-1 block text-slate-500">의미 살펴보기</small></span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="categories-title" className="content-auto">
        <div className="max-w-2xl"><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">DREAM CATEGORIES</p><h2 id="categories-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">어떤 꿈이었나요?</h2><p className="mt-3 leading-7 text-slate-400">기억나는 상징의 종류에서 시작해 가까운 의미를 찾아보세요.</p></div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categoryCards.map((category) => (
            <Link key={category.name} href={`/dictionary?category=${encodeURIComponent(category.name)}`} className="group rounded-2xl border border-white/10 bg-[#0b1528] p-4 transition hover:border-violet-300/30 hover:bg-[#101d35] sm:p-5">
              <span aria-hidden="true" className="text-2xl text-violet-200">{category.icon}</span><strong className="mt-4 block text-white">{category.name} 꿈</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{category.copy}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.055] to-white/[0.02] p-5 sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.18em] text-amber-200/80">TODAY&apos;S PICKS</p><h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">오늘 많이 찾는 꿈</h2></div><span aria-hidden="true" className="text-2xl">☾</span></div>
          <div className="mt-5 divide-y divide-white/10">
            {todayPopular.map((item) => <Link key={item.keyword} href={dreamPath(item.keyword)} className="flex min-h-14 items-center justify-between gap-3 py-3 text-sm transition hover:pl-1"><span className="text-slate-200">{item.emoji} {displayDreamName(item.keyword)} 꿈해몽</span><span aria-hidden="true" className="text-slate-600">→</span></Link>)}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b1528] p-5 sm:p-7">
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-200/80">NEW IN DICTIONARY</p><h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">최근 추가된 꿈</h2><p className="mt-2 text-sm leading-6 text-slate-500">상황별 풀이와 심리적 의미를 새롭게 다듬었습니다.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {recentlyAdded.map((item) => <Link key={item.keyword} href={dreamPath(item.keyword)} className="rounded-xl border border-white/10 p-3 text-sm text-slate-300 transition hover:border-emerald-300/25 hover:text-white"><span aria-hidden="true">{item.emoji}</span> {displayDreamName(item.keyword)}</Link>)}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-r from-violet-500/15 via-blue-500/10 to-transparent p-6 sm:p-10">
        <div aria-hidden="true" className="absolute -right-10 -top-12 size-44 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-violet-200">93가지 상징과 129개의 별칭</p><h2 className="mt-2 text-2xl font-bold text-white">궁금한 꿈을 사전에서 바로 찾아보세요</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">동물, 사람, 장소, 행동 등 기억나는 단어 하나로도 관련 꿈풀이를 살펴볼 수 있습니다.</p></div>
          <Link href="/dictionary" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-5 font-bold text-[#10152a] transition hover:-translate-y-0.5 hover:bg-violet-50">꿈 사전 열기 →</Link>
        </div>
      </section>
    </div>
  );
}
