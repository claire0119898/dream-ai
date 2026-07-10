import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "꿈해몽 AI의 개인정보처리방침을 확인하세요.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050b18] px-6 py-16">
      <div className="mx-auto max-w-3xl text-slate-300">
        <h1 className="text-3xl font-bold text-white">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-slate-500">최종 수정일: 2026년 7월 11일</p>

        <div className="mt-8 space-y-6 leading-8">
          <section>
            <h2 className="text-xl font-bold text-white">1. 수집하는 정보</h2>
            <p className="mt-2">
              꿈해몽 AI는 별도의 회원가입 없이 이용할 수 있는 서비스입니다. 사용자가 입력한 꿈
              내용은 해몽 결과를 생성하는 데에만 사용되며, 별도의 데이터베이스에 저장하지
              않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. 쿠키 및 광고</h2>
            <p className="mt-2">
              서비스 운영을 위해 방문 통계 확인용 쿠키(예: Google Analytics)와 광고 노출용
              쿠키(예: Google AdSense)를 사용할 수 있습니다. 광고 게재 사업자는 이용자의 관심사에
              기반한 광고를 제공하기 위해 방문 기록을 활용할 수 있으며, 이용자는 브라우저
              설정에서 쿠키 저장을 거부할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. 해몽 결과의 성격</h2>
            <p className="mt-2">
              본 서비스가 제공하는 꿈해몽 결과는 통계적·전통적 상징 해석에 기반한 참고용
              콘텐츠이며, 의학적·법적·재정적 조언이 아닙니다. 중요한 의사결정은 관련 전문가와
              상담하시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. 문의</h2>
            <p className="mt-2">
              개인정보와 관련해 문의사항이 있으시면 서비스 내 안내된 연락처로 문의해주세요.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
