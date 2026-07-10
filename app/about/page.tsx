import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용 안내",
  description: "꿈해몽 AI 서비스 소개와 이용 안내입니다.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050b18] px-6 py-16">
      <div className="mx-auto max-w-3xl text-slate-300">
        <h1 className="text-3xl font-bold text-white">🌙 꿈해몽 AI 이용 안내</h1>

        <div className="mt-8 space-y-6 leading-8">
          <section>
            <h2 className="text-xl font-bold text-white">어떤 서비스인가요?</h2>
            <p className="mt-2">
              꿈해몽 AI는 로그인 없이 누구나 무료로 이용할 수 있는 꿈해몽 서비스입니다. 꿈
              내용을 입력하면 등록된 상징, 감정, 상황을 분석해 참고용 해몽 결과를 보여줍니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">어떻게 이용하나요?</h2>
            <p className="mt-2">
              1) 홈 화면의 입력창에 기억나는 꿈 내용을 최대한 자세히 적어주세요.
              <br />
              2) &quot;✨ 꿈 해몽 보기&quot; 버튼을 누르면 상징·감정·상황이 분석된 결과를 볼 수
              있습니다.
              <br />
              3) 특정 키워드가 궁금하다면 인기 꿈 키워드나 꿈 사전에서 바로 찾아볼 수도
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">유의할 점</h2>
            <p className="mt-2">
              해몽 결과는 전통적인 상징 해석에 기반한 참고용 콘텐츠이며, 의학적·법적·재정적
              판단의 근거로 사용하지 않길 권장합니다. 자세한 내용은{" "}
              <a href="/privacy" className="text-violet-300 underline">
                개인정보처리방침
              </a>
              과{" "}
              <a href="/terms" className="text-violet-300 underline">
                이용약관
              </a>
              을 확인해주세요.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
