import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_24%,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_12%_76%,rgba(14,116,144,0.09),transparent_28%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <span className="absolute left-[72%] top-[22%] size-1 rounded-full bg-violet-200/55 shadow-[0_0_12px_rgba(196,181,253,0.55)]" />
        <span className="absolute left-[86%] top-[58%] size-1.5 rounded-full bg-cyan-100/35 shadow-[0_0_14px_rgba(165,243,252,0.4)]" />
        <span className="absolute left-[62%] top-[74%] size-1 rounded-full bg-white/30" />
      </div>

      <div className="mx-auto max-w-[75rem] px-5 py-[clamp(4.5rem,10vw,8rem)] sm:px-8">
        <div className="max-w-[51.25rem]">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-4 py-2 text-sm text-violet-100">
            <span aria-hidden="true">☾</span>
            잠결에 남은 마음을 읽는 시간
          </p>

          <h1 className="mt-7 max-w-[50rem] text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.05em] text-white">
            <span className="block">어젯밤의 꿈,</span>
            <span className="mt-2 block bg-gradient-to-r from-violet-200 via-indigo-200 to-cyan-100 bg-clip-text text-transparent">
              어떤 마음을 담고 있을까요?
            </span>
          </h1>

          <p className="mt-6 max-w-[45rem] text-base leading-[1.75] text-slate-400 sm:text-lg">
            꿈에 나타난 인물과 장소, 행동과 감정을 함께 살펴보며 현재의 경험과 맞닿아 있는 의미를 차분하게 풀어봅니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#search"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-violet-500 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 sm:w-auto"
            >
              내 꿈 이야기하기
            </Link>
            <Link
              href="/dictionary"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-6 font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] sm:w-auto"
            >
              꿈 사전 둘러보기
            </Link>
          </div>

          <div className="mt-6 grid max-w-[45rem] grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-3 sm:gap-x-6">
            <span>✓ 회원가입 없이 이용</span>
            <span>✓ 꿈 내용 별도 저장 없음</span>
            <span>✓ 93가지 핵심 상징</span>
          </div>
        </div>
      </div>
    </section>
  );
}
