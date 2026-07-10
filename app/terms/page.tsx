import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "꿈해몽 AI의 이용약관을 확인하세요.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050b18] px-6 py-16">
      <div className="mx-auto max-w-3xl text-slate-300">
        <h1 className="text-3xl font-bold text-white">이용약관</h1>
        <p className="mt-2 text-sm text-slate-500">최종 수정일: 2026년 7월 11일</p>

        <div className="mt-8 space-y-6 leading-8">
          <section>
            <h2 className="text-xl font-bold text-white">1. 서비스의 성격</h2>
            <p className="mt-2">
              꿈해몽 AI(이하 &quot;서비스&quot;)는 사용자가 입력한 꿈 내용을 바탕으로 전통적인
              꿈 상징 해석과 감정·상황 분석을 제공하는 참고용 서비스입니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. 해몽 결과에 대한 면책</h2>
            <p className="mt-2">
              해몽 결과는 재미와 참고를 위한 콘텐츠이며, 의학적 진단, 법적 판단, 재정적 투자
              결정의 근거로 사용될 수 없습니다. 서비스 이용으로 발생한 결과에 대해 운영자는
              법적 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. 이용자의 의무</h2>
            <p className="mt-2">
              이용자는 서비스를 불법적인 목적으로 사용하거나, 타인에게 피해를 주는 방식으로
              이용해서는 안 됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. 약관의 변경</h2>
            <p className="mt-2">
              본 약관은 서비스 개선에 따라 사전 고지 없이 변경될 수 있으며, 변경된 약관은
              게시와 동시에 효력이 발생합니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
