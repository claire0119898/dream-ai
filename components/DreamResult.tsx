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
        <aside className="mx-auto max-w-[47.5rem] rounded-2xl border border-sky-300/15 bg-sky-400/[0.055] px-4 py-3.5 text-sm leading-[1.75] text-slate-300 sm:px-5 sm:py-4">
          <h3 className="font-semibold text-sky-100">해석 안내</h3>
          <p className="mt-1.5">{result.notice}</p>
        </aside>

        <article className="min-w-0 overflow-hidden rounded-[1.4rem] border border-violet-300/35 bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-sky-400/[0.07] p-4 shadow-[0_18px_70px_-35px_rgba(167,139,250,0.75)] sm:rounded-3xl sm:p-7 lg:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-violet-200">
            핵심 풀이
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
            이 꿈의 핵심
          </h3>
          <p className="mt-3 max-w-[47.5rem] break-words text-[0.95rem] font-medium leading-[1.8] text-slate-100 sm:mt-4 sm:text-[1.05rem]">
            {result.coreMeaning}
          </p>
          <p className="mt-4 inline-flex max-w-full rounded-full border border-violet-200/20 bg-black/15 px-3 py-1.5 text-xs font-semibold leading-5 text-violet-100 sm:text-sm">
            전체 방향 · {result.overallDirection}
          </p>
        </article>

        <article className={cardClass}>
          <h3 className="text-lg font-bold text-white sm:text-xl">
            눈에 띄는 장면
          </h3>
          <ol className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {result.keyScenes.map((scene, index) => (
              <li
                key={`${scene.title}-${scene.evidence}`}
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/10 p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-violet-400/15 text-xs font-bold text-violet-200"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 break-words pt-0.5 text-sm font-semibold leading-6 text-slate-100">
                  {scene.title}
                </span>
              </li>
            ))}
          </ol>
        </article>

        <section aria-labelledby="scene-reading-title">
          <h3
            id="scene-reading-title"
            className="px-1 text-lg font-bold text-white sm:text-xl"
          >
            장면별 풀이
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
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                      꿈속 장면 · {scene.evidence}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-[1.75] text-slate-300 sm:text-[0.95rem]">
                  <p>{scene.generalMeaning}</p>
                  <p className="text-slate-200">{scene.specificMeaning}</p>
                  <p className="border-l-2 border-violet-300/35 pl-3 text-violet-100/85">
                    {scene.connection}
                  </p>
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
            현실과 연결해볼 점
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
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-violet-200">
              한 번 생각해볼 질문
            </p>
            <p className="mt-2 break-words text-sm font-medium leading-[1.75] text-white sm:text-base">
              {result.reflectionQuestion}
            </p>
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
