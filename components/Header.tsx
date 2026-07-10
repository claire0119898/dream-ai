export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b18]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="text-3xl">
            🌙
          </div>

          <div>

            <h1 className="text-xl font-bold text-white">
              Dream AI
            </h1>

            <p className="text-xs text-slate-400">
              AI가 들려주는 당신의 꿈 이야기
            </p>

          </div>

        </div>

        <nav className="hidden gap-8 text-sm text-slate-300 md:flex">

          <a href="#">홈</a>

          <a href="#">인기 꿈</a>

          <a href="#">꿈 사전</a>

          <a href="#">오늘의 꿈</a>

          <a href="#">이용 안내</a>

        </nav>

      </div>
    </header>
  );
}