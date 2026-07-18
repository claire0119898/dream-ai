type AdPlaceholderProps = {
  placement: "input" | "result" | "dictionary" | "detail";
  className?: string;
};

const placementLabels: Record<AdPlaceholderProps["placement"], string> = {
  input: "꿈 입력 아래 광고 자리",
  result: "꿈풀이 결과 아래 광고 자리",
  dictionary: "꿈 사전 목록 광고 자리",
  detail: "꿈 상세 페이지 광고 자리",
};

export default function AdPlaceholder({ placement, className = "" }: AdPlaceholderProps) {
  return (
    <aside
      aria-label={placementLabels[placement]}
      data-ad-placement={placement}
      className={`ad-placeholder mx-auto flex min-h-24 w-full max-w-5xl items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center ${className}`}
    >
      <span className="text-[11px] font-medium tracking-[0.16em] text-slate-700">ADVERTISEMENT</span>
    </aside>
  );
}
