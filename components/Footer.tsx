import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <Link href="/" aria-label="잠결 홈" className="inline-flex items-center gap-2 font-bold text-white"><span aria-hidden="true">☾</span> 잠결</Link>
        <nav aria-label="하단 메뉴" className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
          <Link href="/about">이용 안내</Link>
          <Link href="/dictionary">꿈 사전</Link>
          <Link href="/today">오늘의 꿈</Link>
          <Link href="/contact">문의하기</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </nav>

        <p className="mt-6 text-sm text-slate-500">© 잠결 · Jamgyeol</p>

        <p className="mx-auto mt-4 max-w-2xl text-xs leading-5 text-slate-500">꿈풀이는 현재의 감정과 경험을 돌아보는 참고 정보이며, 전문적인 판단을 대신하지 않습니다.</p>

      </div>

    </footer>
  );
}
