import type { Metadata } from "next";
import Link from "next/link";
import InfoPageLayout from "../../components/InfoPageLayout";

export const metadata: Metadata = {
  title: "이용약관",
  description: "잠결 꿈해몽·꿈풀이 서비스의 이용 조건과 참고 정보의 범위, 이용자 유의사항을 안내합니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPageLayout eyebrow="TERMS OF SERVICE" title="이용약관" description="잠결을 이용하기 전에 꿈풀이 정보의 성격과 서비스 이용 기준을 확인해주세요." updatedAt="2026년 7월 18일">
      <section><h2>1. 서비스의 목적</h2><p>잠결은 사용자가 입력한 꿈의 상징과 감정, 상황을 살펴보고 꿈 사전 콘텐츠를 제공하는 참고용 서비스입니다. 회원가입 없이 꿈풀이와 공개된 꿈 사전을 이용할 수 있습니다.</p></section>
      <section><h2>2. 꿈풀이 정보의 성격</h2><p>잠결의 꿈풀이는 전통적인 상징 해석과 일반적인 심리적 관점을 바탕으로 한 참고 정보입니다. 꿈이 실제 미래나 사건을 반드시 예고한다고 보지 않으며, 결과의 정확성이나 특정한 효과를 보장하지 않습니다.</p></section>
      <section><h2>3. 전문적 판단에 관한 유의사항</h2><p><strong>꿈풀이 결과는 의료적 진단, 법률 자문, 재정 또는 투자 판단의 근거가 될 수 없습니다.</strong> 건강, 안전, 법률, 재정과 관련된 중요한 문제는 해당 분야의 자격을 갖춘 전문가와 상담해야 합니다.</p></section>
      <section><h2>4. 이용자의 책임</h2><ul><li>타인의 개인정보나 민감한 정보를 꿈 내용에 입력하지 않아야 합니다.</li><li>서비스를 불법적인 목적, 운영 방해, 과도한 반복 요청에 이용해서는 안 됩니다.</li><li>꿈풀이 결과를 타인에게 해를 끼치거나 불안을 조장하는 목적으로 사용해서는 안 됩니다.</li></ul></section>
      <section><h2>5. 서비스 제공과 변경</h2><p>안정적인 운영과 콘텐츠 개선을 위해 서비스의 일부 내용이나 제공 방식이 변경될 수 있습니다. 점검, 장애 또는 사용량 제한에 따라 이용이 일시적으로 제한될 수 있으며 가능한 경우 사전 또는 서비스 화면을 통해 안내합니다.</p></section>
      <section><h2>6. 개인정보와 문의</h2><p>꿈 내용과 이용 정보의 처리 기준은 <Link href="/privacy">개인정보처리방침</Link>에서 확인할 수 있습니다. 약관과 서비스 이용에 관한 문의는 <Link href="/contact">문의하기</Link> 페이지를 이용해주세요.</p></section>
    </InfoPageLayout>
  );
}
