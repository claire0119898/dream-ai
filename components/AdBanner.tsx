type AdBannerProps = {
  label?: string;
};

// 광고 자리 표시용 컴포넌트입니다. 실제 서비스에 광고 네트워크(Google AdSense 등)를
// 연동할 때는 이 컴포넌트 내부에 해당 스크립트/슬롯 태그를 넣어 교체하면 됩니다.
// 지금은 승인 전이므로 자리만 잡아두는 점선 박스로 표시합니다.
export default function AdBanner({ label = "광고 영역" }: AdBannerProps) {
  return (
    <aside
      className="mx-auto my-8 max-w-5xl rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-slate-500"
      aria-label="advertisement"
    >
      {label}
    </aside>
  );
}
