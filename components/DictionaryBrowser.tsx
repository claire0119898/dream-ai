"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { coreDreamKeywords } from "../data/dreamDictionary";

const categories = Array.from(
  new Set(coreDreamKeywords.map((item) => item.category).filter(Boolean))
) as string[];

export default function DictionaryBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");

  const filtered = useMemo(() => {
    return coreDreamKeywords.filter((item) => {
      const matchesQuery =
        query.trim() === "" ||
        item.keyword.includes(query.trim()) ||
        (item.aliases ?? []).some((alias) => alias.includes(query.trim()));

      const matchesCategory = category === "전체" || item.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="키워드 검색 (예: 뱀, 이빨, 돈)"
          className="w-full rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-white outline-none placeholder:text-slate-500 sm:flex-1"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#0b1528] px-4 py-3 text-white outline-none"
        >
          <option value="전체">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {filtered.length}개의 꿈 상징이 검색되었습니다.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((item) => (
          <Link
            key={item.keyword}
            href={`/dream/${encodeURIComponent(item.keyword)}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-violet-500/10"
          >
            <p className="font-bold text-white">
              {item.emoji} {item.keyword}
            </p>
            <p className="mt-1 text-sm text-slate-400">{item.meaning}</p>
            {item.category && (
              <span className="mt-2 inline-block rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500">
                {item.category}
              </span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-slate-500">
          검색 결과가 없습니다. 다른 키워드로 찾아보세요.
        </p>
      )}
    </div>
  );
}
