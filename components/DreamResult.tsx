import { buildDreamResultPresentation } from "../lib/dreamPresentation";
import type { DreamInterpretation } from "../types/dream";

type DreamResultProps = {
  interpretation: DreamInterpretation | null;
  onReset: () => void;
};

const cardClass =
  "min-w-0 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 sm:rounded-3xl sm:p-6 lg:p-7";

export default function DreamResult({ interpretation, onReset }: DreamResultProps) {
  if (!interpretation) return null;
  const result = buildDreamResultPresentation(interpretation);

  return (
    <section
      id="result"
      aria-live="polite"
      aria-labelledby="dream-result-title"
      className="mx-4 mt-8 max-w-[60rem] scroll-mt-5 sm:mx-6 lg:mx-auto"
    >
      <header className="mx-auto max-w-[47.5rem] border-b border-white/10 pb-4 sm:pb-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">DREAM READING</p>
        <h2
          id="dream-result-title"
          className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl"
        >
          {interpretation.title}
        </h2>
      </header>

      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-5">
        <article className="min-w-0 overflow-hidden rounded-[1.4rem] border border-violet-300/35 bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-sky-400/[0.07] p-4 shadow-[0_18px_70px_-35px_rgba(167,139,250,0.75)] sm:rounded-3xl sm:p-7 lg:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-violet-200">핵심 풀이</p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
            한눈에 보는 풀이
          </h3>
          <p className="mt-3 max-w-[47.5rem] break-words text-[0.95rem] font-medium leading-[1.8] text-slate-100 sm:mt-4 sm:text-[1.05rem]">
            {result.summary}
          </p>
        </article>

        <article className={cardClass}>
          <h3 className="text-lg font-bold text-white sm:text-xl">종합 풀이</h3>
          <div className="mt-3 max-w-[47.5rem] space-y-4 sm:mt-4 sm:space-y-5">
            {result.interpretationParagraphs.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className="break-words text-[0.95rem] leading-[1.8] text-slate-200 sm:text-base"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        <article className={cardClass}>
          <h3 className="text-lg font-bold text-white sm:text-xl">상징과 감정</h3>

          <section aria-labelledby="notable-scenes-title" className="mt-3 sm:mt-4">
            <h4
              id="notable-scenes-title"
              className="text-xs font-semibold tracking-[0.12em] text-violet-200"
            >
              눈여겨볼 장면
            </h4>
            {result.scenes.length ? (
              <dl className="mt-2 divide-y divide-white/10">
                {result.scenes.map((scene) => (
                  <div
                    key={`${scene.name}-${scene.meaning}`}
                    className="grid min-w-0 gap-1 py-3 first:pt-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-5 sm:py-4"
                  >
                    <dt className="break-words font-bold text-violet-100">{scene.name}</dt>
                    <dd className="break-words text-sm leading-[1.75] text-slate-300 sm:text-[0.95rem]">
                      {scene.meaning}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm leading-[1.75] text-slate-400">
                하나의 상징보다 장면 전체의 관계와 행동이 중심이 되는 꿈입니다.
              </p>
            )}
          </section>

          {result.emotion && (
            <section
              aria-labelledby="dream-emotion-title"
              className="border-t border-white/10 pt-4"
            >
              <h4 id="dream-emotion-title" className="font-bold text-violet-100">
                꿈속 감정
              </h4>
              <p className="mt-2 break-words text-sm leading-[1.75] text-slate-300 sm:text-[0.95rem]">
                {result.emotion}
              </p>
            </section>
          )}

          {result.flow && (
            <section
              aria-labelledby="dream-flow-title"
              className="mt-4 border-t border-white/10 pt-4"
            >
              <h4 id="dream-flow-title" className="font-bold text-violet-100">
                꿈의 흐름
              </h4>
              <p className="mt-2 break-words text-sm leading-[1.75] text-slate-300 sm:text-[0.95rem]">
                {result.flow}
              </p>
            </section>
          )}
        </article>

        <article className="min-w-0 rounded-[1.4rem] border border-violet-300/20 bg-violet-400/[0.07] p-4 sm:rounded-3xl sm:p-6 lg:p-7">
          <h3 className="text-lg font-bold text-white sm:text-xl">함께 생각해볼 점</h3>
          <ul className="mt-3 space-y-2.5 sm:mt-4">
            {result.thoughtPoints.map((point) => (
              <li
                key={point}
                className="flex min-w-0 gap-3 text-sm leading-[1.75] text-slate-200 sm:text-base"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-violet-300"
                />
                <span className="min-w-0 break-words">{point}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3.5 text-sm leading-[1.75] text-slate-400 sm:px-5 sm:py-4">
          <h3 className="font-semibold text-slate-300">유의사항</h3>
          <p className="mt-1">{result.caution}</p>
        </aside>
      </div>

      <div className="pt-6 text-center sm:pt-7">
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          다른 꿈 풀이하기
        </button>
      </div>
    </section>
  );
}
