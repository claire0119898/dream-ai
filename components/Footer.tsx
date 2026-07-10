import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">

      <div className="mx-auto max-w-7xl px-6 text-center">

        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
          <Link href="/about">이용 안내</Link>
          <Link href="/dictionary">꿈 사전</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </nav>

        <p className="mt-4 text-slate-500">

          © Dream AI

        </p>

        <p className="mt-2 text-sm text-slate-600">

          AI Dream Interpretation Service

        </p>

      </div>

    </footer>
  );
}