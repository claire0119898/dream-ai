import type { DreamInterpretation } from "../types/dream";
import { isNarrativeInterpretation, READING_CAUTION } from "../lib/dreamNarrative";

type DreamResultProps = { interpretation: DreamInterpretation | null; onReset: () => void };

function HighlightedParagraph({ text, highlight }: { text: string; highlight: string }) {
  const index = highlight ? text.indexOf(highlight) : -1;
  if (index < 0) return <>{text}</>;
  return <>{text.slice(0, index)}<strong className="font-semibold text-violet-100">{highlight}</strong>{text.slice(index + highlight.length)}</>;
}

export default function DreamResult({ interpretation, onReset }: DreamResultProps) {
  // 구형 결과나 불완전한 문구를 정상 해몽 화면에 끼워 넣지 않습니다.
  if (!isNarrativeInterpretation(interpretation)) return null;
  const reading = interpretation.narrative;
  return (
    <section id="result" aria-labelledby="dream-result-title" className="mx-4 mt-12 max-w-[46rem] scroll-mt-28 sm:mx-6 lg:mx-auto">
      <header className="border-b border-white/10 pb-7 sm:pb-9">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">꿈에 담긴 이야기</p>
        <h2 id="dream-result-title" className="mt-3 text-2xl font-semibold leading-snug tracking-[-0.025em] text-white sm:text-3xl">{interpretation.title}</h2>
        <p className="mt-5 break-words text-base font-medium leading-[1.95] text-slate-100 sm:text-lg">{reading.opening}</p>
      </header>
      <article aria-label="꿈의 상세 풀이" className="space-y-6 py-8 sm:space-y-7 sm:py-10">
        {reading.paragraphs.map((paragraph, index) => (
          <p key={index} className="break-words text-[1rem] leading-[2] text-slate-300 sm:text-[1.05rem]">
            <HighlightedParagraph {...paragraph} />
          </p>
        ))}
      </article>
      <blockquote className="border-l-2 border-violet-300 bg-violet-400/[0.06] px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-xs font-semibold tracking-wide text-violet-300">이 꿈이 남기는 한 문장</p>
        <p className="mt-3 break-words text-lg font-semibold leading-[1.85] text-violet-50 sm:text-xl">{reading.coreMessage}</p>
      </blockquote>
      <section aria-labelledby="dream-flow-title" className="py-8 sm:py-10">
        <h3 id="dream-flow-title" className="text-lg font-semibold text-white">전체 흐름 · {reading.flow.label}</h3>
        <p className="mt-3 text-base leading-[1.95] text-slate-300">{reading.flow.reading}</p>
      </section>
      <aside className="border-t border-white/10 pt-5 text-xs leading-6 text-slate-400">{READING_CAUTION}</aside>
      <div className="py-7 text-center"><button type="button" onClick={onReset} className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">다른 꿈 풀이하기</button></div>
    </section>
  );
}
