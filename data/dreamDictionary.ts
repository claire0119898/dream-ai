import type { DreamKeyword } from "../types/dream";
import generatedDreams from "./json/generated-dreams.json";
import {
  coreDreamKeywords,
  popularKeywordNames,
  popularKeywords,
} from "./coreDreamKeywords";

export { coreDreamKeywords, popularKeywordNames, popularKeywords };

// 핵심 상징 x 19개 상황을 조합한 꿈 사전 확장 데이터입니다.
// 상세 페이지의 기본 상황별 풀이에만 사용하며 검색 화면의 브라우저 번들에는 포함하지 않습니다.
export const generatedDreamKeywords = generatedDreams satisfies DreamKeyword[];

export const dreamDictionary = [
  ...coreDreamKeywords,
  ...generatedDreamKeywords,
] satisfies DreamKeyword[];
