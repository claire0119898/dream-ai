import type { DreamKeyword } from "../types/dream";

export type DictionarySort = "recommended" | "name" | "category";

export function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s\p{P}\p{S}]/gu, "");
}

function editDistance(left: string, right: string) {
  const a = Array.from(left);
  const b = Array.from(right);
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      previous = current;
    }
  }

  return row[b.length];
}

export function dreamSearchScore(item: DreamKeyword, rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 1;

  const keyword = normalizeSearchText(item.keyword);
  const aliases = (item.aliases ?? []).map(normalizeSearchText);
  const related = (item.related ?? []).map(normalizeSearchText);

  if (keyword === query) return 120;
  if (aliases.includes(query)) return 112;
  if (keyword.startsWith(query)) return 100;
  if (aliases.some((alias) => alias.startsWith(query))) return 94;
  if (keyword.includes(query)) return 88;
  if (aliases.some((alias) => alias.includes(query))) return 82;

  const tolerance = query.length >= 5 ? 2 : 1;
  const keywordDistance = editDistance(keyword, query);
  const aliasDistance = aliases.reduce(
    (best, alias) => Math.min(best, editDistance(alias, query)),
    Number.POSITIVE_INFINITY
  );
  const closestDistance = Math.min(keywordDistance, aliasDistance);
  if (query.length >= 2 && closestDistance <= tolerance) return 72 - closestDistance;
  if (related.some((value) => value.includes(query))) return 55;

  const searchableMeaning = normalizeSearchText(
    `${item.meaning} ${item.good} ${item.caution}`
  );
  if (query.length >= 2 && searchableMeaning.includes(query)) return 30;

  return 0;
}

export function sortDreamKeywords(
  items: DreamKeyword[],
  sort: DictionarySort,
  query: string,
  popularity: Map<string, number>
) {
  return [...items].sort((left, right) => {
    if (sort === "name") return left.keyword.localeCompare(right.keyword, "ko");
    if (sort === "category") {
      const categoryOrder = (left.category ?? "").localeCompare(right.category ?? "", "ko");
      return categoryOrder || left.keyword.localeCompare(right.keyword, "ko");
    }

    const scoreOrder = dreamSearchScore(right, query) - dreamSearchScore(left, query);
    if (scoreOrder) return scoreOrder;
    const popularityOrder = (popularity.get(left.keyword) ?? 999) - (popularity.get(right.keyword) ?? 999);
    return popularityOrder || left.keyword.localeCompare(right.keyword, "ko");
  });
}
