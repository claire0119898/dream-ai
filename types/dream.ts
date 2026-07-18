export type DreamKeyword = {
  keyword: string;
  emoji: string;
  meaning: string;
  good: string;
  caution: string;
  category?: string;
  related?: string[];
  aliases?: string[];
  /** 자동 생성된 "상징 + 상황" 조합 데이터인 경우 true */
  generated?: boolean;
  /** 상황 조합 생성 데이터에 쓰이는 원본 상징 키워드 */
  baseKeyword?: string;
  /** 상황 조합 생성 데이터에 쓰이는 상황 라벨 (예: "추격") */
  situationType?: string;
  slug?: string;
};

export type DreamSituation = {
  /** 상황을 감지하기 위한 단어 목록 */
  words: string[];
  /** 상황 라벨 (예: "추격", "공격", "극복") */
  type: string;
  /** 상황에 대한 해석 문구 (상징 이름을 %s 자리에 채워 사용) */
  description: string;
};

export type DreamEmotion = {
  key: string;
  label: string;
  words: string[];
};

export type DreamAnalysis = {
  summary: string;
  keywords: DreamKeyword[];
  emotions: string[];
  situations: string[];
  interpretation: string;
  advice: string;
  relatedKeywords: string[];
};

export interface DreamInterpretation {
  title: string;
  summary: string;
  symbols: Array<{
    name: string;
    meaning: string;
  }>;
  emotion: string;
  flow: string;
  interpretation: string;
  guidance: string;
  caution: string;
}
