export default function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2">

      <div>

        <div className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">

          ✨ AI 기반 꿈해몽

        </div>

        <h2 className="mt-8 text-6xl font-bold leading-tight text-white">

          당신의 꿈,

          <br />

          어떤 의미일까요?

        </h2>

        <p className="mt-8 text-lg leading-9 text-slate-400">

          수많은 꿈 해몽 데이터를 기반으로

          AI가 당신의 꿈을 분석합니다.

        </p>

      </div>

      <div className="flex items-center justify-center">

        <div className="flex h-[420px] w-full items-center justify-center rounded-[40px] bg-gradient-to-br from-violet-600/20 to-cyan-500/10 text-8xl">

          🌙⭐☁️

        </div>

      </div>

    </section>
  );
}
