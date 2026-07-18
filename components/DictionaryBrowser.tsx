"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { coreDreamKeywords, popularKeywords } from "../data/coreDreamKeywords";
import {
  dreamSearchScore,
  sortDreamKeywords,
  type DictionarySort,
} from "../lib/dreamSearch";
import { dreamPath } from "../lib/siteConfig";
import AdPlaceholder from "./AdPlaceholder";

const PAGE_SIZE = 12;
const RECENT_SEARCH_KEY = "jamgyeol-recent-dream-keywords";
const categories = Array.from(
  new Set(coreDreamKeywords.map((item) => item.category).filter(Boolean))
) as string[];
const popularity = new Map(popularKeywords.map((item, index) => [item.keyword, index]));

function readRecentSearches() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

export default function DictionaryBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState<DictionarySort>("recommended");
  const [page, setPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSuggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRecentSearches(readRecentSearches());
      const requestedCategory = new URLSearchParams(window.location.search).get("category");
      if (requestedCategory && categories.includes(requestedCategory)) setCategory(requestedCategory);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function closeSuggestions(event: PointerEvent) {
      if (!searchAreaRef.current?.contains(event.target as Node)) setSuggestionsOpen(false);
    }
    document.addEventListener("pointerdown", closeSuggestions);
    return () => document.removeEventListener("pointerdown", closeSuggestions);
  }, []);

  const filtered = useMemo(() => {
    const matches = coreDreamKeywords.filter(
      (item) =>
        (category === "전체" || item.category === category) && dreamSearchScore(item, query) > 0
    );
    return sortDreamKeywords(matches, sort, query, popularity);
  }, [category, query, sort]);

  const suggestions = useMemo(
    () => (query.trim() ? filtered.slice(0, 6) : []),
    [filtered, query]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
    setSuggestionsOpen(Boolean(value.trim()));
  }

  function rememberKeyword(keyword: string) {
    const next = [keyword, ...recentSearches.filter((value) => value !== keyword)].slice(0, 6);
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
    } catch {
      // 브라우저 저장 공간을 사용할 수 없어도 검색과 이동은 그대로 동작합니다.
    }
  }

  function chooseSearch(keyword: string) {
    updateQuery(keyword);
    setSuggestionsOpen(false);
    rememberKeyword(keyword);
  }

  return (
    <div className="mt-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-violet-950/20 sm:p-6">
        <div ref={searchAreaRef} className="relative">
          <label htmlFor="dictionary-search" className="mb-2 block text-sm font-medium text-slate-200">
            꿈 상징 검색
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">⌕</span>
            <input
              id="dictionary-search"
              type="search"
              role="combobox"
              autoComplete="off"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              onFocus={() => setSuggestionsOpen(Boolean(query.trim()))}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSuggestionsOpen(false);
              }}
              placeholder="뱀, 이빨, 구렁이처럼 검색해보세요"
              aria-describedby="search-help"
              aria-expanded={isSuggestionsOpen && suggestions.length > 0}
              aria-controls="dictionary-suggestions"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#0b1528] py-3 pl-11 pr-11 text-base text-white outline-none transition focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10 placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateQuery("")}
                aria-label="검색어 지우기"
                className="absolute inset-y-0 right-2 my-auto size-9 rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
          <p id="search-help" className="mt-2 text-xs leading-5 text-slate-500">
            별칭과 비슷한 철자도 함께 찾아드려요.
          </p>

          {isSuggestionsOpen && suggestions.length > 0 && (
            <div
              id="dictionary-suggestions"
              role="listbox"
              aria-label="검색어 자동완성"
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1528] p-2 shadow-2xl shadow-black/40"
            >
              {suggestions.map((item) => (
                <Link
                  role="option"
                  aria-selected="false"
                  key={item.keyword}
                  href={dreamPath(item.keyword)}
                  onClick={() => rememberKeyword(item.keyword)}
                  className="flex min-h-12 items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-violet-500/15 focus-visible:bg-violet-500/15 focus-visible:outline-none"
                >
                  <span className="font-medium text-white">{item.emoji} {item.keyword}</span>
                  <span className="text-xs text-slate-500">{item.category}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium text-slate-200">카테고리</p>
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="꿈 사전 카테고리">
              {["전체", ...categories].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setCategory(value);
                    setPage(1);
                  }}
                  aria-pressed={category === value}
                  className={`min-h-10 shrink-0 rounded-full border px-4 text-sm transition ${
                    category === value
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                      : "border-white/10 bg-[#0b1528] text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="dictionary-sort" className="mb-2 block text-sm font-medium text-slate-200">정렬</label>
            <select
              id="dictionary-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as DictionarySort);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-[#0b1528] px-4 text-sm text-white outline-none focus:border-violet-400/60 lg:w-40"
            >
              <option value="recommended">추천순</option>
              <option value="name">가나다순</option>
              <option value="category">카테고리순</option>
            </select>
          </div>
        </div>
      </section>

      <section aria-labelledby="popular-dreams" className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">많이 찾는 상징</p>
            <h2 id="popular-dreams" className="mt-1 text-xl font-bold text-white">인기 꿈 키워드</h2>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {popularKeywords.slice(0, 10).map((item) => (
            <button
              type="button"
              key={item.keyword}
              onClick={() => chooseSearch(item.keyword)}
              className="min-h-11 shrink-0 rounded-full border border-violet-300/15 bg-violet-500/10 px-4 text-sm text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-500/20"
            >
              {item.emoji} {item.keyword}
            </button>
          ))}
        </div>
      </section>

      {recentSearches.length > 0 && (
        <section aria-labelledby="recent-dreams" className="mt-6">
          <div className="flex items-center justify-between">
            <h2 id="recent-dreams" className="text-sm font-semibold text-slate-300">최근 검색</h2>
            <button
              type="button"
              onClick={() => {
                setRecentSearches([]);
                localStorage.removeItem(RECENT_SEARCH_KEY);
              }}
              className="min-h-9 px-2 text-xs text-slate-500 hover:text-slate-300"
            >
              모두 지우기
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentSearches.map((keyword) => (
              <button
                type="button"
                key={keyword}
                onClick={() => chooseSearch(keyword)}
                className="min-h-10 rounded-full border border-white/10 px-4 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                {keyword}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-sm text-slate-400"><strong className="text-white">{filtered.length}</strong>개의 꿈 상징</p>
          {query.trim() && <p className="mt-1 text-xs text-slate-500">‘{query.trim()}’와 가까운 결과를 함께 표시합니다.</p>}
        </div>
        <p className="text-xs text-slate-500">{page} / {totalPages} 페이지</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, index) => (
          <Fragment key={item.keyword}>
            {index === 6 && <AdPlaceholder placement="dictionary" className="my-2 sm:col-span-2 lg:col-span-3" />}
            <Link
              href={dreamPath(item.keyword)}
              onClick={() => rememberKeyword(item.keyword)}
              className="dictionary-card group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-xl hover:shadow-violet-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#101d35] text-2xl ring-1 ring-white/10" aria-hidden="true">{item.emoji}</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-500">{item.category}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-white group-hover:text-violet-100">{item.keyword} 꿈</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.meaning}</p>
              {item.aliases && item.aliases.length > 0 && <p className="mt-4 text-xs text-slate-500">함께 찾는 말 · {item.aliases.slice(0, 3).join(", ")}</p>}
              <span className="mt-5 inline-flex items-center text-sm font-medium text-violet-300">꿈의 의미 보기 <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">→</span></span>
            </Link>
          </Fragment>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
          <p className="text-3xl" aria-hidden="true">🌙</p>
          <h2 className="mt-4 font-bold text-white">찾는 꿈 상징이 아직 없어요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">철자를 조금 바꾸거나 다른 카테고리에서 찾아보세요.</p>
          <button type="button" onClick={() => { updateQuery(""); setCategory("전체"); }} className="mt-5 min-h-11 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white hover:bg-violet-400">전체 꿈 보기</button>
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <nav aria-label="꿈 사전 페이지" className="mt-10 flex w-full items-center justify-start gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 shrink-0 rounded-xl border border-white/10 px-4 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-35"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setPage(value)}
              aria-current={value === page ? "page" : undefined}
              aria-label={`${value}페이지`}
              className={`size-11 shrink-0 rounded-xl text-sm ${value === page ? "bg-violet-500 font-bold text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
            >
              {value}
            </button>
          ))}
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="min-h-11 shrink-0 rounded-xl border border-white/10 px-4 text-sm text-slate-300 disabled:cursor-not-allowed disabled:opacity-35"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
