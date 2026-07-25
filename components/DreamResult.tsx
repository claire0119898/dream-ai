import type { DreamInterpretation } from "../types/dream";

type DreamResultProps = {
  interpretation: DreamInterpretation | null;
  onReset: () => void;
};

const cardClass = "min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6";

export default function DreamResult({ interpretation, onReset }: DreamResultProps) {
  if (!interpretation) return null;
  const interpretationParagraphs = interpretation.interpretation
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section id="result" aria-live="polite" className="mx-4 mt-8 max-w-5xl space-y-4 sm:mx-6 lg:mx-auto">
      <header className="border-b border-white/10 pb-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">DREAM READING</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
          {interpretation.title}
        </h2>
      </header>

      <div className="min-w-0 rounded-3xl border border-violet-400/30 bg-violet-500/10 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-white sm:text-xl">한눈에 보는 꿈풀이</h3>
        <p className="mt-3 break-words text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
          {interpretation.summary}
        </p>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-bold text-white sm:text-xl">주요 상징</h3>
        {interpretation.symbols.length ? (
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            {interpretation.symbols.map((symbol) => (
              <article key={`${symbol.name}-${symbol.meaning}`} className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1528] p-4">
                <p className="break-words font-bold text-white">{symbol.name}</p>
                <p className="mt-1 break-words text-sm leading-6 text-slate-400">{symbol.meaning}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-400">
            하나의 상징보다 꿈의 전체 흐름과 감정을 중심으로 살펴보는 편이 자연스럽습니다.
          </p>
        )}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">꿈속 감정</h3>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-300">{interpretation.emotion}</p>
        </div>
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">꿈의 흐름</h3>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-300">{interpretation.flow}</p>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-bold text-white sm:text-xl">종합 풀이</h3>
        <div className="mt-4 space-y-4">
          {interpretationParagraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 24)}`} className="break-words text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {interpretation.reflectionPoints.length > 0 && (
        <div className="min-w-0 rounded-3xl border border-violet-300/20 bg-violet-400/[0.07] p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white sm:text-xl">함께 떠올려볼 점</h3>
          <ul className="mt-4 space-y-3">
            {interpretation.reflectionPoints.map((point) => (
              <li key={point} className="flex min-w-0 gap-3 text-sm leading-7 text-slate-200 sm:text-base">
                <span aria-hidden="true" className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-violet-300" />
                <span className="min-w-0 break-words">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={cardClass}>
        <h3 className="text-lg font-bold text-white sm:text-xl">생활 속 참고</h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
          {interpretation.guidance}
        </p>
      </div>

      <aside className="rounded-2xl border border-white/5 bg-black/10 p-4 text-center text-xs leading-5 text-slate-500">
        <p className="font-semibold text-slate-400">해석 유의사항</p>
        <p className="mt-1">{interpretation.caution}</p>
      </aside>

      <div className="pt-2 text-center">
        <button type="button" onClick={onReset} className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">
          다른 꿈 풀이하기
        </button>
      </div>
    </section>
  );
}
