import type { Metadata } from "next";
import DictionaryBrowser from "../../components/DictionaryBrowser";

export const metadata: Metadata = {
  title: "꿈 사전",
  description:
    "동물, 자연, 사람, 장소, 재물, 행동 등 카테고리별 꿈 상징을 검색하고 찾아보세요.",
};

export default function DictionaryPage() {
  return (
    <main className="min-h-screen bg-[#050b18] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-white">📖 꿈 사전</h1>
        <p className="mt-3 text-slate-400">
          AI 해몽 없이도 키워드나 카테고리로 직접 꿈 상징을 검색할 수 있습니다.
        </p>

        <DictionaryBrowser />
      </div>
    </main>
  );
}
