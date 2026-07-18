import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdPlaceholder from "../../../components/AdPlaceholder";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import {
  coreDreamKeywords,
  generatedDreamKeywords,
  popularKeywords,
} from "../../../data/dreamDictionary";
import { getDreamEditorial } from "../../../data/dreamEditorial";
import { absoluteUrl, DICTIONARY_UPDATED_AT, dreamPath } from "../../../lib/siteConfig";

type Props = { params: Promise<{ slug: string }> };

function safelyDecodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function findKeyword(slug: string) {
  const decoded = safelyDecodeSlug(slug);
  return coreDreamKeywords.find((item) => item.keyword === decoded);
}

function situationDescription(baseMeaning: string, combinedMeaning: string) {
  const trimmed = combinedMeaning.startsWith(baseMeaning)
    ? combinedMeaning.slice(baseMeaning.length).trim()
    : combinedMeaning;
  return trimmed || combinedMeaning;
}

export function generateStaticParams() {
  return coreDreamKeywords.map((item) => ({ slug: item.keyword }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = findKeyword(slug);

  if (!item) return { title: "꿈 상징을 찾을 수 없습니다", robots: { index: false, follow: false } };

  const editorial = getDreamEditorial(item.keyword);
  const title = editorial?.seoTitle ?? `${item.keyword} 꿈해몽 - 상황별 의미와 꿈풀이`;
  const description = editorial?.seoDescription ?? `${item.keyword} 꿈의 기본 의미와 좋은 의미, 주의할 점, 상황별 해석을 살펴보세요. ${item.meaning}`.slice(0, 155);
  const path = dreamPath(item.keyword);

  return {
    title,
    description,
    keywords: [
      `${item.keyword} 꿈`,
      `${item.keyword} 꿈해몽`,
      `${item.keyword} 꿈풀이`,
      ...(editorial ? [`${editorial.displayName} 꿈`, `${editorial.displayName} 꿈해몽`] : []),
      ...(item.aliases ?? []).map((alias) => `${alias} 꿈`),
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | 잠결`,
      description,
      url: path,
      type: "article",
      siteName: "잠결",
      locale: "ko_KR",
    },
    twitter: { card: "summary_large_image", title: `${title} | 잠결`, description },
  };
}

export default async function DreamDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = findKeyword(slug);
  if (!item) notFound();

  const editorial = getDreamEditorial(item.keyword);
  const displayName = editorial?.displayName ?? item.keyword;
  const coreMeaning = editorial?.coreMeaning ?? item.meaning;
  const goodMeaning = editorial?.goodMeaning ?? item.good;
  const caution = editorial?.caution ?? item.caution;
  const faqs = editorial?.faqs ?? [
    { question: `${item.keyword} 꿈은 항상 같은 의미인가요?`, answer: "꿈속 상황과 감정, 함께 등장한 다른 상징에 따라 의미가 달라질 수 있습니다." },
    { question: `${item.keyword} 꿈은 나쁜 꿈인가요?`, answer: "하나의 상징에도 긍정적인 의미와 살펴볼 점이 함께 있을 수 있어 전체 흐름을 함께 보는 것이 좋습니다." },
  ];

  const currentIndex = coreDreamKeywords.findIndex((candidate) => candidate.keyword === item.keyword);
  const previous = currentIndex > 0 ? coreDreamKeywords[currentIndex - 1] : coreDreamKeywords.at(-1)!;
  const next = currentIndex < coreDreamKeywords.length - 1 ? coreDreamKeywords[currentIndex + 1] : coreDreamKeywords[0];
  const relatedItems = (editorial?.related ?? item.related ?? [])
    .map((name) => coreDreamKeywords.find((candidate) => candidate.keyword === name))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .slice(0, 6);
  const situations = editorial?.situations ?? generatedDreamKeywords
    .filter((candidate) => candidate.baseKeyword === item.keyword)
    .map((candidate) => ({
      title: `${item.keyword} · ${candidate.situationType}`,
      interpretation: situationDescription(item.meaning, candidate.meaning),
    }));
  const popularItems = popularKeywords.filter((candidate) => candidate.keyword !== item.keyword).slice(0, 8);
  const path = dreamPath(item.keyword);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: editorial?.seoTitle ?? `${item.keyword} 꿈해몽 - 상황별 의미와 꿈풀이`,
      description: coreMeaning,
      inLanguage: "ko-KR",
      dateModified: DICTIONARY_UPDATED_AT,
      mainEntityOfPage: absoluteUrl(path),
      author: { "@type": "Organization", name: "잠결", url: absoluteUrl("/") },
      publisher: { "@type": "Organization", name: "잠결", url: absoluteUrl("/") },
      about: {
        "@type": "DefinedTerm",
        name: `${displayName} 꿈`,
        description: coreMeaning,
        inDefinedTermSet: absoluteUrl("/dictionary"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "잠결", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "꿈 사전", item: absoluteUrl("/dictionary") },
        { "@type": "ListItem", position: 3, name: `${displayName} 꿈`, item: absoluteUrl(path) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-[#050b18]">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">홈</Link><span aria-hidden="true">/</span>
          <Link href="/dictionary" className="hover:text-slate-300">꿈 사전</Link><span aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-300">{displayName} 꿈</span>
        </nav>

        <header className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {item.category && <span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">{item.category} 꿈</span>}
              <span className="text-xs text-slate-500">꿈 사전 · {DICTIONARY_UPDATED_AT.replaceAll("-", ".")}</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">{displayName} 꿈해몽</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{coreMeaning}</p>
            {item.aliases && item.aliases.length > 0 && <p className="mt-4 text-sm text-slate-500">함께 찾는 말 · {item.aliases.join(", ")}</p>}
          </div>

          <figure
            role="img"
            aria-label={`${displayName} 꿈을 상징하는 대표 이미지`}
            className="dream-visual relative isolate min-h-64 overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-[#17163c] via-[#101d35] to-[#07101f] shadow-2xl shadow-violet-950/40"
          >
            <div aria-hidden="true" className="absolute -right-10 -top-14 size-48 rounded-full bg-violet-400/15 blur-2xl" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-10 size-56 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="relative flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <span aria-hidden="true" className="dream-float text-7xl drop-shadow-[0_12px_25px_rgba(0,0,0,0.45)] sm:text-8xl">{item.emoji}</span>
              <figcaption className="mt-5 text-sm font-medium tracking-[0.18em] text-violet-100/80">{displayName} · DREAM SYMBOL</figcaption>
            </div>
          </figure>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 lg:col-span-3">
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">BASIC MEANING</p>
            <h2 className="mt-2 text-2xl font-bold text-white">기본 의미</h2>
            <p className="mt-4 leading-8 text-slate-300">{coreMeaning}</p>
          </section>
          <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.06] p-6 lg:col-span-2">
            <span aria-hidden="true" className="text-xl">✦</span>
            <h2 className="mt-3 text-xl font-bold text-white">좋은 의미</h2>
            <p className="mt-3 leading-8 text-slate-300">{goodMeaning}</p>
          </section>
          <section className="rounded-3xl border border-amber-400/20 bg-amber-500/[0.06] p-6">
            <span aria-hidden="true" className="text-xl">◌</span>
            <h2 className="mt-3 text-xl font-bold text-white">주의할 점</h2>
            <p className="mt-3 leading-8 text-slate-300">{caution}</p>
          </section>
        </div>

        {situations.length > 0 && (
          <section aria-labelledby="situations-title" className="mt-14">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">DREAM SCENES</p>
              <h2 id="situations-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">상황별 {displayName} 꿈풀이</h2>
              <p className="mt-3 leading-7 text-slate-400">같은 상징도 꿈속에서 어떤 일이 일어났는지에 따라 다르게 읽힐 수 있습니다.</p>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {situations.map((situation, index) => (
                <details key={situation.title} open={index < 2} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 open:border-violet-400/20 open:bg-violet-500/[0.06]">
                  <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white marker:content-none">
                    <span>{item.emoji} {situation.title}</span>
                    <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-slate-400">{situation.interpretation}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {editorial && (
          <section aria-labelledby="psychology-title" className="mt-10 rounded-3xl border border-blue-300/15 bg-blue-500/[0.055] p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-blue-300">PSYCHOLOGICAL MEANING</p>
            <h2 id="psychology-title" className="mt-2 text-2xl font-bold text-white">심리적 의미</h2>
            <p className="mt-4 leading-8 text-slate-300">{editorial.psychologicalMeaning}</p>
          </section>
        )}

        <section aria-labelledby="related-title" className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 id="related-title" className="text-2xl font-bold text-white">관련 꿈</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">함께 등장하거나 의미가 이어지는 꿈 상징입니다.</p>
          {relatedItems.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((related) => (
                <Link key={related.keyword} href={dreamPath(related.keyword)} className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1528] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/30">
                  <span aria-hidden="true" className="text-2xl">{related.emoji}</span>
                  <span><strong className="block text-white">{related.keyword} 꿈</strong><small className="mt-1 block text-slate-500 group-hover:text-slate-400">의미 살펴보기 →</small></span>
                </Link>
              ))}
            </div>
          ) : <p className="mt-5 text-sm text-slate-500">관련 상징은 꿈 사전에서 더 찾아볼 수 있습니다.</p>}
        </section>

        <section aria-labelledby="popular-title" className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id="popular-title" className="text-xl font-bold text-white">많이 찾는 꿈</h2>
            <Link href="/dictionary" className="text-sm text-violet-300 hover:text-violet-200">꿈 사전 전체 보기 →</Link>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {popularItems.map((popular) => (
              <Link key={popular.keyword} href={dreamPath(popular.keyword)} className="min-h-11 shrink-0 rounded-full border border-white/10 bg-[#101d35] px-4 py-3 text-sm text-slate-200 transition hover:border-violet-400/30 hover:bg-violet-500/15">{popular.emoji} {popular.keyword}</Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white">자주 묻는 질문</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-slate-200">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <nav aria-label="이전 및 다음 꿈" className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href={dreamPath(previous.keyword)} className="rounded-2xl border border-white/10 p-5 transition hover:border-violet-400/30 hover:bg-white/[0.04]">
            <span className="text-xs text-slate-500">← 이전 꿈</span><strong className="mt-2 block text-white">{previous.emoji} {previous.keyword} 꿈해몽</strong>
          </Link>
          <Link href={dreamPath(next.keyword)} className="rounded-2xl border border-white/10 p-5 text-right transition hover:border-violet-400/30 hover:bg-white/[0.04]">
            <span className="text-xs text-slate-500">다음 꿈 →</span><strong className="mt-2 block text-white">{next.emoji} {next.keyword} 꿈해몽</strong>
          </Link>
        </nav>

        <div className="mt-10 rounded-3xl bg-gradient-to-r from-violet-500/20 to-blue-500/10 p-6 text-center ring-1 ring-violet-300/20 sm:p-8">
          <h2 className="text-2xl font-bold text-white">기억나는 꿈을 더 자세히 풀어보세요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">상징과 감정, 장면의 흐름을 함께 살펴보면 꿈의 의미가 한층 선명해집니다.</p>
          <Link href="/#search" className="mt-5 inline-flex min-h-12 items-center rounded-2xl bg-violet-500 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-400">내 꿈 풀이하기 →</Link>
        </div>

        <AdPlaceholder placement="detail" className="mt-8" />

        <p className="mt-8 text-center text-xs leading-6 text-slate-500">꿈풀이는 현재의 감정과 경험을 돌아보는 참고 자료입니다. 의학적·법적·재정적 판단의 근거로 사용하지 마세요.</p>
      </article>
      <Footer />
    </main>
  );
}
