import { dreamDictionary } from "../data/dreamDictionary";
import type { DreamAnalysis } from "../types/dream";

export function analyzeDream(dream: string): DreamAnalysis {
  const text = dream.trim();

  const matchedKeywords = dreamDictionary.filter((item) =>
    text.includes(item.keyword)
  );

  if (matchedKeywords.length === 0) {
    return {
      summary: "입력하신 꿈에서 등록된 대표 키워드는 발견되지 않았습니다.",
      keywords: [],
      interpretation:
        "이 꿈은 특정 상징보다는 꿈을 꿀 때 느꼈던 감정과 전체 분위기를 중심으로 해석하는 것이 좋습니다.",
      advice:
        "꿈속에서 가장 강하게 남은 감정과 장면을 다시 떠올려보세요.",
    };
  }

  const keywordNames = matchedKeywords.map((item) => item.keyword).join(", ");

  return {
    summary: `이 꿈에서는 ${keywordNames} 상징이 발견되었습니다.`,
    keywords: matchedKeywords,
    interpretation: matchedKeywords
      .map(
        (item) =>
          `${item.emoji} ${item.keyword}: ${item.meaning} ${item.good} 다만 ${item.caution}`
      )
      .join("\n\n"),
    advice:
      "꿈은 현실을 그대로 예언한다기보다 현재 마음 상태를 상징적으로 보여주는 경우가 많습니다.",
  };
}

export function formatDreamAnalysis(analysis: DreamAnalysis): string {
  let result = "✨ 꿈해몽 결과\n\n";

  result += `1. 핵심 요약\n${analysis.summary}\n\n`;

  if (analysis.keywords.length > 0) {
    result += "2. 발견된 상징\n";
    analysis.keywords.forEach((item) => {
      result += `- ${item.emoji} ${item.keyword}: ${item.meaning}\n`;
    });
    result += "\n";
  }

  result += `3. 종합 해몽\n${analysis.interpretation}\n\n`;
  result += `4. 현실 조언\n${analysis.advice}\n\n`;
  result += "※ 이 해몽은 참고용입니다.";

  return result;
}