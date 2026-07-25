import { buildDreamResultPresentation } from "../lib/dreamPresentation";
import type { DreamInterpretation } from "../types/dream";

type DreamResultProps = {
  interpretation: DreamInterpretation | null;
  onReset: () => void;
};

const cardClass =
  "min-w-0 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 sm:rounded-3xl sm:p-6 lg:p-7";

export default function DreamResult({
  interpretation,
  onReset,
}: DreamResultProps) {
  if (!interpretation) return null;
  const result = buildDreamResultPresentation(interpretation);

  return (
    <section
      id="result"
      aria-live="polite"
      aria-labelledby="dream-result-title"
      className="mx-4 mt-8 max-w-[72rem] scroll-mt-5 sm:mx-6 lg:mx-auto"
    >
      <header className="mx-auto max-w-[47.5rem] border-b border-white/10 pb-4 sm:pb-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
          DREAM READING
        </p>
        <h2
          id="dream-result-title"
          className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl"
        >
          {interpretation.title}
        </h2>
      </header>

      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-5">
        <article className="min-w-0 overflow-hidden rounded-[1.4rem] border border-violet-300/35 bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-sky-400/[0.07] p-4 shadow-[0_18px_70px_-35px_rgba(167,139,250,0.75)] sm:rounded-3xl sm:p-7 lg:p-8">
          <h3 className="text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
            한눈에 보는 풀이
          </h3>
          <p className="mt-3 max-w-[47.5rem] break-words text-[0.95rem] font-medium leading-[1.8] text-slate-100 sm:mt-4 sm:text-[1.05rem]">
            {result.coreConclusion}
          </p>

          {(result.relationshipMeaning || result.objectMeaning) && (
            <dl className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
              {result.relationshipMeaning && (
                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <dt className="text-xs font-semibold tracking-[0.12em] text-violet-200">
                    인물과 역할
                  </dt>
                  <dd className="mt-2 break-words text-sm leading-[1.75] text-slate-200">
                    {result.relationshipMeaning}
                  </dd>
                </div>
              )}
              {result.objectMeaning && (
                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <dt className="text-xs font-semibold tracking-[0.12em] text-violet-200">
                    물건에 담긴 뜻
                  </dt>
                  <dd className="mt-2 break-words text-sm leading-[1.75] text-slate-200">
                    {result.objectMeaning}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </article>

        <section aria-labelledby="key-scenes-title">
          <h3
            id="key-scenes-title"
            className="px-1 text-lg font-bold text-white sm:text-xl"
          >
            핵심 장면
          </h3>
          <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 sm:gap-4">
            {result.keyScenes.map((scene, index) => (
              <article
                key={`${scene.title}-${index}`}
                className="min-w-0 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 sm:rounded-3xl sm:p-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-400/15 text-sm font-bold text-violet-100"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-bold leading-7 text-white sm:text-lg">
                      {scene.title}
                    </h4>
                    <p className="mt-2 break-words text-sm leading-[1.75] text-slate-200 sm:text-[0.95rem]">
                      {scene.meaning}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <article className={cardClass}>
          <h3 className="text-lg font-bold text-white sm:text-xl">종합 풀이</h3>
          <div className="mx-auto mt-3 max-w-[47.5rem] space-y-4 sm:mt-4 sm:space-y-5">
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

        <article className="min-w-0 rounded-[1.4rem] border border-violet-300/20 bg-violet-400/[0.07] p-4 sm:rounded-3xl sm:p-6 lg:p-7">
          <h3 className="text-lg font-bold text-white sm:text-xl">
            함께 생각해볼 점
          </h3>
          <ul className="mt-3 space-y-2.5 sm:mt-4">
            {result.realLifeConnections.map((point) => (
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
          <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/10 p-4">
            {result.reflectionQuestions.map((question) => (
              <p
                key={question}
                className="break-words text-sm font-medium leading-[1.75] text-white sm:text-base"
              >
                {question}
              </p>
            ))}
          </div>
        </article>

        <aside className="rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3.5 text-sm leading-[1.75] text-slate-400 sm:px-5 sm:py-4">
          <h3 className="font-semibold text-slate-300">참고 안내</h3>
          <p className="mt-1">{result.caution}</p>
        </aside>
      </div>

      <div className="pt-6 text-center sm:pt-7">
        <button
          type="button"
          onClick={onReset}
          className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          다른 꿈 풀이하기
        </button>
      </div>
    </section>
  );
}
