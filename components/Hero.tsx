import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_30%,rgba(124,58,237,0.15),transparent_32%),radial-gradient(circle_at_15%_60%,rgba(14,116,144,0.10),transparent_26%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-4 py-2 text-sm text-violet-100"><span aria-hidden="true">☾</span> 잠결에 남은 마음을 읽는 시간</p>
          <h1 className="mt-7 text-4xl font-bold leading-[1.16] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">어젯밤의 꿈,<br /><span className="bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100 bg-clip-text text-transparent">어떤 마음을 담고 있을까요?</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">꿈에 나타난 인물과 장소, 행동과 감정을 함께 살펴보며 현재의 경험과 맞닿아 있는 의미를 차분하게 풀어봅니다.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#search" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-violet-500 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">내 꿈 이야기하기</Link>
            <Link href="/dictionary" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-6 font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08]">꿈 사전 둘러보기</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500"><span>✓ 회원가입 없이 이용</span><span>✓ 꿈 내용 별도 저장 없음</span><span>✓ 93가지 핵심 상징</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="relative min-h-80 overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-[#18183b] via-[#0d1830] to-[#071824] p-6 shadow-2xl shadow-black/30 sm:min-h-[26rem] sm:p-8">
            <div aria-hidden="true" className="absolute -right-12 -top-16 size-60 rounded-full bg-violet-400/10 blur-3xl" /><div aria-hidden="true" className="absolute -bottom-20 -left-16 size-64 rounded-full bg-cyan-300/[0.08] blur-3xl" />
            <div className="relative flex min-h-72 flex-col justify-between sm:min-h-[22rem]">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-[0.2em] text-violet-200/70">JAMGYEOL</span><span className="size-2 rounded-full bg-emerald-300/70 shadow-[0_0_18px_rgba(110,231,183,0.65)]" /></div>
              <div className="text-center"><div aria-hidden="true" className="dream-float mx-auto grid size-32 place-items-center rounded-full border border-amber-100/15 bg-amber-50/[0.06] text-7xl shadow-[0_0_90px_rgba(196,181,253,0.16)]">☾</div><p className="mt-7 text-lg font-medium text-slate-200">꿈은 마음이 건네는<br />아주 사적인 이야기일 수 있습니다.</p></div>
              <p className="text-center text-xs leading-5 text-slate-500">꿈풀이는 현재의 감정과 경험을 돌아보는 참고 정보입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
