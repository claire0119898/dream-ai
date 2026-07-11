import type { DreamKeyword } from "../types/dream";

import animals from "./json/animals.json";
import nature from "./json/nature.json";
import body from "./json/body.json";
import people from "./json/people.json";
import places from "./json/places.json";
import money from "./json/money.json";
import actions from "./json/actions.json";
import objects from "./json/objects.json";
import generatedDreams from "./json/generated-dreams.json";

// 손으로 직접 작성한 핵심 상징 93개. 실시간 꿈 분석과 SEO 상세 페이지(/dream/[slug])의
// 기준이 되는 데이터입니다.
export const coreDreamKeywords = [
  ...animals,
  ...nature,
  ...body,
  ...people,
  ...places,
  ...money,
  ...actions,
  ...objects,
] satisfies DreamKeyword[];

// 핵심 상징 x 18개 상황을 조합해 자동 생성한 데이터 (scripts/generateDreamDatabase.mjs).
// 아직 사람이 한 줄씩 검수한 데이터는 아니므로, 꿈 사전 탐색/문구 다양화 용도로 사용하고
// 검색량이 높은 항목부터 점차 手작업으로 다듬어 나가는 것을 권장합니다.
export const generatedDreamKeywords = generatedDreams satisfies DreamKeyword[];

export const dreamDictionary = [
  ...coreDreamKeywords,
  ...generatedDreamKeywords,
] satisfies DreamKeyword[];

// 화면에서 자주 노출할 인기 키워드 (전체 사전 대신 이 목록만 홈 화면 등에 표시합니다).
export const popularKeywordNames = [
  "뱀",
  "물",
  "이빨",
  "돈",
  "불",
  "아기",
  "죽다",
  "날다",
  "바다",
  "집",
  "고양이",
  "개",
  "떨어지다",
  "결혼하다",
  "가족",
];

export const popularKeywords = popularKeywordNames
  .map((name) => coreDreamKeywords.find((item) => item.keyword === name))
  .filter((item): item is NonNullable<typeof item> => Boolean(item));
