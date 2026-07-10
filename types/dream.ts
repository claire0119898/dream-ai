export type DreamKeyword = {
  keyword: string;
  emoji: string;
  meaning: string;
  good: string;
  caution: string;
  category?: string;
  related?: string[];
};

export type DreamAnalysis = {
  summary: string;
  keywords: DreamKeyword[];
  interpretation: string;
  advice: string;
};