import type { DreamClarification as DreamClarificationData } from "../types/dream";

type DreamClarificationProps = {
  clarification: DreamClarificationData;
  loading: boolean;
  onConfirm: () => void;
  onEdit: () => void;
};

export default function DreamClarification({
  clarification,
  loading,
  onConfirm,
  onEdit,
}: DreamClarificationProps) {
  return (
    <section
      id="clarification"
      aria-labelledby="clarification-title"
      className="mx-4 mt-7 max-w-[47.5rem] scroll-mt-5 rounded-[1.4rem] border border-violet-300/30 bg-gradient-to-br from-violet-500/15 to-sky-400/[0.06] p-4 shadow-[0_18px_70px_-40px_rgba(167,139,250,0.8)] sm:mx-6 sm:rounded-3xl sm:p-7 lg:mx-auto"
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-violet-200">
        꿈 내용 확인
      </p>
      <h3
        id="clarification-title"
        className="mt-2 text-xl font-bold text-white sm:text-2xl"
      >
        {clarification.title}
      </h3>
      <p className="mt-3 text-sm leading-[1.75] text-slate-300 sm:text-base">
        {clarification.message}
      </p>

      <ul className="mt-5 space-y-2.5">
        {clarification.statements.map((statement) => (
          <li
            key={statement}
            className="flex min-w-0 gap-3 rounded-2xl border border-white/10 bg-black/10 p-3.5 text-sm leading-[1.75] text-slate-100 sm:text-base"
          >
            <span
              aria-hidden="true"
              className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-violet-300"
            />
            <span className="min-w-0 break-words">{statement}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="min-h-12 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "꿈의 의미를 풀어보고 있습니다." : "네, 맞아요"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onEdit}
          className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:opacity-50"
        >
          다시 적기
        </button>
      </div>
    </section>
  );
}
