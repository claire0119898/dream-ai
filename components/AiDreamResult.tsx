type AiDreamResultProps = {
  text: string | null;
  loading: boolean;
  error: string | null;
};

export default function AiDreamResult({ text, loading, error }: AiDreamResultProps) {
  if (!text && !loading && !error) {
    return null;
  }

  return (
    <section className="mx-auto mt-8 max-w-5xl space-y-4">
      <div className="rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-200">
            ✨ AI 심층 해몽
          </span>
          <p className="text-xs text-slate-400">
            사전에 등록된 상징만으로는 부족해 AI가 더 자세히 풀어봤습니다.
          </p>
        </div>

        {loading && (
          <p className="mt-4 animate-pulse text-slate-300">
            꿈을 곰곰이 들여다보는 중이에요...
          </p>
        )}

        {error && !loading && (
          <p className="mt-4 text-rose-300">{error}</p>
        )}

        {text && !loading && (
          <div className="mt-4 space-y-3 whitespace-pre-wrap leading-8 text-slate-200">
            {text}
          </div>
        )}
      </div>

      {text && !loading && (
        <p className="text-center text-xs text-slate-500">
          ※ 이 해몽은 AI가 생성한 참고용 해석이며, 의학적·법적·재정적 판단의 근거로 사용하지 마세요.
        </p>
      )}
    </section>
  );
}
