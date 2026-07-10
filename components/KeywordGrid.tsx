import Link from "next/link";
import { popularKeywords } from "../data/dreamDictionary";

type KeywordGridProps = {
  onSelectKeyword: (keyword: string) => void;
};

export default function KeywordGrid({ onSelectKeyword }: KeywordGridProps) {
  return (
    <section
      id="keywords"
      className="mx-auto mt-8 max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">인기 꿈 키워드</h2>
        <Link
          href="/dictionary"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          전체 꿈 사전 보기 →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
        {popularKeywords.map((item) => (
          <button
            key={item.keyword}
            onClick={() => onSelectKeyword(item.keyword)}
            className="rounded-full border border-white/10 bg-[#101d35] px-4 py-3 text-white hover:bg-violet-500/30"
          >
            {item.emoji} {item.keyword}
          </button>
        ))}
      </div>
    </section>
  );
}
