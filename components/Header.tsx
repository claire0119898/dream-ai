import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b18]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" aria-label="잠결 홈" className="flex items-center gap-3">
          <div aria-hidden="true" className="text-3xl">🌙</div>

          <div className="hidden sm:block">
            <p className="text-xl font-bold tracking-[-0.02em] text-white">잠결</p>
            <p className="text-xs text-slate-400">꿈의 상징을 차분히 읽는 시간</p>
          </div>
        </Link>

        <nav aria-label="전체 메뉴" className="hidden gap-8 text-sm text-slate-300 md:flex">
          <Link href="/">홈</Link>
          <Link href="/#keywords">인기 꿈</Link>
          <Link href="/dictionary">꿈 사전</Link>
          <Link href="/today">오늘의 꿈</Link>
          <Link href="/about">이용 안내</Link>
          <Link href="/contact">문의</Link>
        </nav>

        <nav aria-label="주요 메뉴" className="flex items-center gap-1 text-sm md:hidden">
          <Link href="/dictionary" className="min-h-10 rounded-full px-3 py-2.5 text-slate-200 hover:bg-white/10">꿈 사전</Link>
          <Link href="/#search" className="min-h-10 rounded-full bg-violet-500/15 px-3 py-2.5 text-violet-100 hover:bg-violet-500/25">꿈풀이</Link>
        </nav>
      </div>
    </header>
  );
}
