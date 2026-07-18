import type { Metadata } from "next";
import Link from "next/link";
import InfoPageLayout from "../../components/InfoPageLayout";

export const metadata: Metadata = {
  title: "잠결 소개와 이용 안내",
  description: "꿈의 상징과 감정, 장면의 흐름을 차분하게 살펴보는 잠결의 꿈해몽·꿈풀이 서비스와 이용 방법을 안내합니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPageLayout eyebrow="ABOUT JAMGYEOL" title="잠결 소개" description="잠결은 기억에 남은 꿈을 과장하거나 단정하지 않고, 상징과 감정의 맥락을 차분하게 살펴보는 꿈해몽·꿈풀이 서비스입니다.">
      <section><h2>꿈을 이해하는 하나의 관점</h2><p>꿈은 최근의 경험과 감정, 걱정과 기대가 다양한 이미지로 나타난 것일 수 있습니다. 잠결은 전통적으로 알려진 꿈 상징과 꿈속 상황을 함께 살펴보며, 사용자가 자신의 마음을 돌아볼 수 있는 참고 정보를 제공합니다.</p></section>
      <section><h2>이용 방법</h2><ol><li>홈의 꿈 이야기 입력란에 기억나는 장면과 감정을 적어주세요.</li><li>꿈풀이 보기를 누르면 주요 상징, 감정, 흐름과 생활 속 참고 내용을 확인할 수 있습니다.</li><li>특정 상징이 궁금하다면 <Link href="/dictionary">꿈 사전</Link>에서 93가지 핵심 상징과 상황별 풀이를 찾아보세요.</li></ol></section>
      <section><h2>잠결이 지키는 원칙</h2><ul><li>꿈의 내용을 별도 데이터베이스에 저장하지 않습니다.</li><li>미래의 사건이나 건강, 재물, 임신 등을 단정하지 않습니다.</li><li>불안을 조장하지 않고 현재의 감정과 경험을 함께 살펴봅니다.</li><li>전문적인 판단이 필요한 문제는 해당 분야의 전문가와 상담하기를 권합니다.</li></ul></section>
      <section><h2>꿈풀이는 참고 정보입니다</h2><p>잠결의 콘텐츠는 자기 이해와 흥미를 위한 참고 자료입니다. 의학적 진단, 법률 자문, 재정 또는 투자 판단을 대신하지 않습니다. 자세한 내용은 <Link href="/terms">이용약관</Link>과 <Link href="/privacy">개인정보처리방침</Link>에서 확인할 수 있습니다.</p></section>
    </InfoPageLayout>
  );
}
