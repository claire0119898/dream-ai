import { MAX_DREAM_LENGTH, MIN_DREAM_LENGTH } from "../lib/dreamConfig";

type DreamInputProps = {
  dream: string;
  setDream: (value: string) => void;
  onInterpret: () => void;
  loading?: boolean;
};

export default function DreamInput({
  dream,
  setDream,
  onInterpret,
  loading = false,
}: DreamInputProps) {
  const trimmedLength = dream.trim().length;
  const cannotSubmit = loading || trimmedLength < MIN_DREAM_LENGTH;

  return (
    <section id="search" className="mx-4 max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-4 sm:mx-6 sm:p-6 lg:mx-auto">
      <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">DREAM JOURNAL</p>
      <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">기억나는 꿈</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
        기억나는 장면과 감정을 자세히 적어주세요.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!cannotSubmit) onInterpret();
        }}
      >
        <textarea
          value={dream}
          maxLength={MAX_DREAM_LENGTH}
          disabled={loading}
          aria-describedby="dream-input-help dream-character-count"
          onChange={(event) => setDream(event.target.value)}
          className="mt-5 h-40 w-full resize-y rounded-2xl border border-white/10 bg-[#0b1528] p-4 text-base text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 disabled:cursor-wait disabled:opacity-70 sm:h-44"
          placeholder="어젯밤 꿈에서 기억나는 장면을 들려주세요."
        />
        <div id="dream-input-help" className="mt-2 flex items-start justify-between gap-3 text-xs text-slate-400 sm:text-sm">
          <span>{MIN_DREAM_LENGTH}자 이상 입력해주세요.</span>
          <span id="dream-character-count" className="shrink-0 tabular-nums" aria-live="polite">
            {dream.length.toLocaleString("ko-KR")} / {MAX_DREAM_LENGTH.toLocaleString("ko-KR")}자
          </span>
        </div>

        <button
          type="submit"
          disabled={cannotSubmit}
          aria-busy={loading}
          className="mt-4 min-h-14 w-full rounded-2xl bg-violet-500 px-4 py-4 font-bold text-white transition hover:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "꿈의 의미를 풀어보고 있습니다." : "꿈풀이 보기"}
        </button>
      </form>
    </section>
  );
}
