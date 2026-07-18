import type { Metadata } from "next";
import InfoPageLayout from "../../components/InfoPageLayout";
import { CONTACT_EMAIL } from "../../lib/siteConfig";

export const metadata: Metadata = {
  title: "문의하기",
  description: "잠결 서비스 이용, 콘텐츠 정정, 개인정보 관련 문의 방법을 안내합니다.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <InfoPageLayout eyebrow="CONTACT" title="문의하기" description="서비스 이용 중 불편한 점이나 콘텐츠 정정, 개인정보 관련 문의를 보내주세요. 확인 후 가능한 범위에서 답변드리겠습니다.">
      <section><h2>이메일 문의</h2><p>문의 내용과 확인이 필요한 페이지 주소를 함께 보내주세요.</p>{CONTACT_EMAIL ? <a className="contact-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-500/[0.06] p-4 text-sm text-amber-100/80">배포 전 운영 문의 이메일을 연결할 예정입니다.</p>}</section>
      <section><h2>문의할 수 있는 내용</h2><ul><li>서비스 이용 중 발생한 오류 또는 불편</li><li>꿈 사전 콘텐츠의 오탈자와 정정 제안</li><li>개인정보 처리와 꿈 내용 삭제 여부에 관한 문의</li><li>권리 침해 또는 기타 운영 관련 요청</li></ul></section>
      <section><h2>문의 전 확인</h2><p>잠결은 개인의 꿈에 대한 확정적인 예언이나 의료·법률·재정 상담을 제공하지 않습니다. 꿈 내용 전체나 주민등록번호, 연락처 등 불필요한 개인정보는 이메일에 포함하지 말아주세요.</p></section>
    </InfoPageLayout>
  );
}
