import type { DreamAnalysis } from "../types/dream";

type DreamResultProps = {
  analysis: DreamAnalysis | null;
};

export default function DreamResult({ analysis }: DreamResultProps) {
  if (!analysis) {
    return null;
  }

  return (
    <section
      id="result"
      className="mx-auto mt-8 max-w-5xl space-y-4"
    >
      <div className="rounded-3xl border border-violet-400/30 bg-violet-500/10 p-6">
        <h2 className="text-2xl font-bold text-white">✨ 핵심 요약</h2>
        <p className="mt-3 leading-8 text-slate-200">{analysis.summary}</p>
      </div>

      {analysis.keywords.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-bold text-white">발견된 상징</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {analysis.keywords.map((item) => (
              <div
                key={item.keyword}
                className="rounded-2xl border border-white/10 bg-[#0b1528] p-4"
              >
                <p className="font-bold text-white">
                  {item.emoji} {item.keyword}
                </p>
                <p className="mt-1 text-sm text-slate-400">{item.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(analysis.emotions.length > 0 || analysis.situations.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {analysis.emotions.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold text-white">꿈속 감정</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.emotions.map((emotion) => (
                  <span
                    key={emotion}
                    className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.situations.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold text-white">발견된 상황</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.situations.map((situation) => (
                  <span
                    key={situation}
                    className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-200"
                  >
                    {situation}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-bold text-white">종합 해몽</h3>
        <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-200">
          {analysis.interpretation}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-bold text-white">현실 조언</h3>
        <p className="mt-3 leading-8 text-slate-200">{analysis.advice}</p>
      </div>

      {analysis.relatedKeywords.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-bold text-white">관련 꿈</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.relatedKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-white/10 bg-[#101d35] px-4 py-2 text-sm text-slate-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        ※ 이 해몽은 참고용이며, 의학적·법적·재정적 판단의 근거로 사용하지 마세요.
      </p>
    </section>
  );
}
