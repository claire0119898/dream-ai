import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coreDreamKeywords } from "../../../data/dreamDictionary";
import AdBanner from "../../../components/AdBanner";

type Props = {
  params: Promise<{ slug: string }>;
};

function findKeyword(slug: string) {
  const decoded = decodeURIComponent(slug);
  return coreDreamKeywords.find((item) => item.keyword === decoded);
}

export function generateStaticParams() {
  return coreDreamKeywords.map((item) => ({
    slug: encodeURIComponent(item.keyword),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = findKeyword(slug);

  if (!item) {
    return { title: "꿈 해몽" };
  }

  return {
    title: `${item.keyword} 꿈 해몽 - ${item.keyword}이(가) 나오는 꿈의 의미`,
    description: `${item.keyword} 꿈의 기본 의미, 좋은 의미, 주의할 점을 확인해보세요. ${item.meaning}`,
  };
}

export default async function DreamDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = findKeyword(slug);

  if (!item) {
    notFound();
  }

  const relatedItems = (item.related ?? [])
    .map((name) => coreDreamKeywords.find((k) => k.keyword === name))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <main className="min-h-screen bg-[#050b18] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/dictionary" className="text-sm text-violet-300 hover:text-violet-200">
          ← 꿈 사전으로 돌아가기
        </Link>

        <h1 className="mt-4 text-4xl font-bold text-white">
          {item.emoji} {item.keyword} 꿈 해몽
        </h1>

        {item.category && (
          <span className="mt-3 inline-block rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500">
            {item.category}
          </span>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold text-white">기본 의미</h2>
          <p className="mt-3 leading-8 text-slate-300">{item.meaning}</p>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <h2 className="text-xl font-bold text-white">좋은 의미</h2>
          <p className="mt-3 leading-8 text-slate-300">{item.good}</p>
        </section>

        <section className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-500/5 p-6">
          <h2 className="text-xl font-bold text-white">주의할 점</h2>
          <p className="mt-3 leading-8 text-slate-300">{item.caution}</p>
        </section>

        <AdBanner />

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold text-white">자주 묻는 질문</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-bold text-slate-200">
                Q. {item.keyword} 꿈은 항상 같은 의미인가요?
              </p>
              <p className="mt-1 text-slate-400">
                아니요. 꿈속 상황, 감정, 함께 등장한 다른 상징에 따라 해석이 달라질 수 있습니다.
                이 페이지의 내용은 일반적으로 통용되는 참고용 해석입니다.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-200">
                Q. {item.keyword} 꿈이 나쁜 꿈인가요?
              </p>
              <p className="mt-1 text-slate-400">
                꿈해몽에는 절대적으로 나쁜 상징은 드뭅니다. 같은 상징도 상황에 따라 좋은 의미와
                주의할 점을 함께 가지고 있는 경우가 많습니다.
              </p>
            </div>
          </div>
        </section>

        {relatedItems.length > 0 && (
          <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold text-white">관련 꿈</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedItems.map((related) => (
                <Link
                  key={related.keyword}
                  href={`/dream/${encodeURIComponent(related.keyword)}`}
                  className="rounded-full border border-white/10 bg-[#101d35] px-4 py-2 text-sm text-slate-200 hover:bg-violet-500/20"
                >
                  {related.emoji} {related.keyword}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          ※ 이 해몽은 참고용이며, 의학적·법적·재정적 판단의 근거로 사용하지 마세요.
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/#search"
            className="inline-block rounded-2xl bg-violet-500 px-6 py-3 font-bold text-white hover:bg-violet-600"
          >
            내 꿈도 AI로 해몽해보기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
