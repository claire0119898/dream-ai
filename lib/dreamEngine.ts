import { coreDreamKeywords } from "../data/dreamDictionary";
import { situations } from "../data/situations";
import { emotions } from "../data/emotions";
import type { DreamAnalysis, DreamKeyword } from "../types/dream";

export const MIN_DREAM_LENGTH = 5;
export const MAX_DREAM_LENGTH = 2000;

// actions.json의 일부 키워드는 그 자체가 이미 특정 상황을 뜻하는 행동 단어입니다.
// (예: "도망"이라는 키워드가 매칭됨 == "회피" 상황이 이미 일어난 것) 이런 조합에서는
// "도망으로부터 도망쳤다면"처럼 순환적인 문장이 나오지 않도록 문장 생성을 건너뜁니다.
const REDUNDANT_SITUATION_BY_KEYWORD: Record<string, string[]> = {
  "도망": ["회피"],
  "싸우다": ["갈등"],
  "울다": ["슬픔표현"],
  "웃다": ["기쁨표현"],
  "죽다": ["종료"],
};

export type DreamValidation = {
  valid: boolean;
  message?: string;
};

/** 꿈 입력값에 대한 기본적인 유효성 검사 (빈 입력, 너무 짧음, 너무 긴 입력) */
export function validateDreamInput(dream: string): DreamValidation {
  const text = dream.trim();

  if (!text) {
    return { valid: false, message: "꿈 내용을 먼저 입력해주세요." };
  }

  if (text.length < MIN_DREAM_LENGTH) {
    return {
      valid: false,
      message: "꿈 내용을 조금 더 자세히 입력해주세요. (5자 이상)",
    };
  }

  if (text.length > MAX_DREAM_LENGTH) {
    return {
      valid: false,
      message: "꿈 내용은 2,000자 이하로 입력해주세요.",
    };
  }

  return { valid: true };
}

// 한국어는 조사(이/가/을/를/에게 등)가 명사 뒤에 그대로 붙기 때문에, 문장을
// 어절(공백 기준 토큰) 단위로 나눈 뒤 "어절이 해당 단어로 시작하는지"를 검사합니다.
// 예) "고양이가" -> "고양이"로 시작 (매칭 O), "이야기" -> "이"로 시작하지만 별도 어절이라
// "이빨"의 별칭 "이"처럼 아주 짧은 단어와 우연히 겹칠 위험을 크게 줄여줍니다.
// (완벽한 형태소 분석은 아니지만, 단순 부분 문자열(includes) 검색보다 오탐이 훨씬 적습니다.)
function tokenize(text: string): string[] {
  return text.split(/[\s,.!?~"'()\[\]{}·、。]+/).filter(Boolean);
}

// 흔히 명사/어간 뒤에 붙는 조사 목록. 1글자 단어(뱀, 물, 말, 새, 산, 눈, 발...)는 한국어
// 단어 중 우연히 그 글자로 "시작"하는 완전히 다른 뜻의 단어가 매우 많습니다.
// (예: "말"(동물) vs "말했다"(speak), "발"(신체) vs "발생했다", "불"(자연) vs "불안했다")
// 그래서 1글자 단어는 "단어 단독" 또는 "단어 + 알려진 조사"로 끝나는 어절일 때만 인정합니다.
const JOSA_SUFFIXES = [
  "이가", "이는", "이도", "이만", "이나",
  "가", "은", "는", "을", "를", "이", "도", "만",
  "에서", "에게", "한테", "까지", "부터", "처럼", "같이",
  "와", "과", "이랑", "랑", "에", "로", "으로",
];

function containsAsWord(tokens: string[], word: string): boolean {
  if (!word) return false;

  if (word.length === 1) {
    return tokens.some((token) => {
      if (token === word) return true;
      if (!token.startsWith(word)) return false;
      const remainder = token.slice(word.length);
      return JOSA_SUFFIXES.includes(remainder);
    });
  }

  return tokens.some((token) => token.startsWith(word));
}

function matchesKeyword(tokens: string[], item: DreamKeyword): boolean {
  const words = [item.keyword, ...(item.aliases ?? [])];
  return words.some((word) => containsAsWord(tokens, word));
}

// 한글 음절(가~힣)의 마지막 글자에 받침이 있는지 판별합니다.
// (조사 이/가, 을/를, 와/과, 로/으로가 받침 유무에 따라 형태가 달라지기 때문에 필요합니다.)
function hasBatchim(word: string): boolean {
  const lastChar = word.charAt(word.length - 1);
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

// 받침이 "ㄹ"로 끝나는 경우 "로/로부터"가 예외적으로 유지됩니다. (예: "길로", "물로부터")
function endsWithRieul(word: string): boolean {
  const lastChar = word.charAt(word.length - 1);
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 === 8;
}

// situations.ts의 설명 문구에 들어있는 "%s[받침없음형/받침있음형]" 표기를 실제 조사로
// 치환합니다. (예: "%s[가/이]" + "고양이" -> "고양이가", "%s[가/이]" + "뱀" -> "뱀이")
function formatWithJosa(template: string, subject: string): string {
  const withBatchim = hasBatchim(subject);

  const filled = template.replace(
    /%s\[([^/\]]+)\/([^\]]+)\]/g,
    (_match, noBatchimForm: string, batchimForm: string) => {
      const isRieulException =
        (noBatchimForm === "로" || noBatchimForm === "로부터") && endsWithRieul(subject);
      const particle = !withBatchim || isRieulException ? noBatchimForm : batchimForm;
      return subject + particle;
    }
  );

  return filled.split("%s").join(subject);
}

function detectSituations(tokens: string[], keyword: string) {
  const matched: { type: string; sentence: string }[] = [];

  for (const situation of situations) {
    const hit = situation.words.some((word) => containsAsWord(tokens, word));
    if (hit) {
      matched.push({
        type: situation.type,
        sentence: formatWithJosa(situation.description, keyword),
      });
    }
  }

  return matched;
}

function detectEmotions(tokens: string[]) {
  const matched: string[] = [];

  for (const emotion of emotions) {
    const hit = emotion.words.some((word) => containsAsWord(tokens, word));
    if (hit) {
      matched.push(emotion.label);
    }
  }

  return matched;
}

export function analyzeDream(dream: string): DreamAnalysis {
  const text = dream.trim();
  const tokens = tokenize(text);

  const matchedKeywords = coreDreamKeywords.filter((item) =>
    matchesKeyword(tokens, item)
  );

  const detectedEmotions = Array.from(new Set(detectEmotions(tokens)));

  if (matchedKeywords.length === 0) {
    // 등록된 상징(동물/사물/장소 등)은 없지만, 연예인·친구 이름처럼 사전에 없는
    // 고유명사와 함께 "쫓겼다/홀대받았다" 같은 상황·행동은 표현된 경우가 많습니다.
    // 이런 경우 특정 이름 자체를 인식할 수는 없어도, 그 상황만으로도 일반적인
    // 해석은 가능하므로 "그 사람"을 주어로 한 해석을 대신 제공합니다.
    const genericSituationHits = detectSituations(tokens, "그 사람");
    const genericSituationTypes = Array.from(
      new Set(genericSituationHits.map((hit) => hit.type))
    );

    if (genericSituationHits.length > 0) {
      const interpretationParts = genericSituationHits.map((hit) => hit.sentence);

      if (detectedEmotions.length > 0) {
        interpretationParts.push(
          `꿈속에서 느껴진 감정은 ${detectedEmotions.join(", ")}(으)로 분석됩니다.`
        );
      }

      return {
        summary: `이 꿈에서는 등록된 대표 상징은 없지만, 특정 인물과의 ${genericSituationTypes.join(", ")} 상황이 발견되었습니다.`,
        keywords: [],
        emotions: detectedEmotions,
        situations: genericSituationTypes,
        interpretation: interpretationParts.join("\n\n"),
        advice:
          "등장인물이 누구인지보다, 꿈속에서 그 사람과 있었던 상황과 그때 느낀 감정 자체에 집중해서 해석해보는 것을 추천합니다.",
        relatedKeywords: [],
      };
    }

    return {
      summary: "입력하신 꿈에서 등록된 대표 상징은 발견되지 않았습니다.",
      keywords: [],
      emotions: detectedEmotions,
      situations: [],
      interpretation:
        "이 꿈은 특정 상징보다는 꿈을 꿀 때 느꼈던 감정과 전체 분위기를 중심으로 해석하는 것이 좋습니다.",
      advice: "꿈속에서 가장 강하게 남은 감정과 장면을 다시 떠올려보세요.",
      relatedKeywords: [],
    };
  }

  const keywordNames = matchedKeywords.map((item) => item.keyword).join(", ");

  const situationSentences: string[] = [];
  const situationTypes = new Set<string>();

  for (const item of matchedKeywords) {
    const hits = detectSituations(tokens, item.keyword);
    for (const hit of hits) {
      situationTypes.add(hit.type);

      // "도망"(행동 키워드) + "회피"(상황) 조합처럼, 매칭된 키워드 자체가 이미 그
      // 상황을 뜻하는 행동 단어인 경우 "도망으로부터 도망쳤다면"처럼 문장이
      // 순환적으로 어색해집니다. 이런 조합은 상황 태그는 유지하되 중복 문장은 생략합니다.
      const isRedundantForKeyword =
        REDUNDANT_SITUATION_BY_KEYWORD[item.keyword]?.includes(hit.type);

      if (!isRedundantForKeyword) {
        situationSentences.push(hit.sentence);
      }
    }
  }

  const interpretationParts = matchedKeywords.map(
    (item) =>
      `${item.emoji ?? ""} ${item.keyword}: ${item.meaning} ${item.good} 다만 ${item.caution}`
  );

  if (situationSentences.length > 0) {
    interpretationParts.push(...situationSentences);
  }

  if (detectedEmotions.length > 0) {
    interpretationParts.push(
      `꿈속에서 느껴진 감정은 ${detectedEmotions.join(", ")}(으)로 분석됩니다. 상징과 감정을 함께 살펴보면 현재 마음 상태를 더 입체적으로 이해할 수 있습니다.`
    );
  }

  const relatedKeywords = Array.from(
    new Set(
      matchedKeywords.flatMap((item) => item.related ?? [])
    )
  )
    .filter((name) => !matchedKeywords.some((item) => item.keyword === name))
    .slice(0, 6);

  return {
    summary:
      situationTypes.size > 0
        ? `이 꿈에서는 ${keywordNames} 상징과 함께 ${Array.from(situationTypes).join(", ")} 상황이 발견되었습니다.`
        : `이 꿈에서는 ${keywordNames} 상징이 발견되었습니다.`,
    keywords: matchedKeywords,
    emotions: detectedEmotions,
    situations: Array.from(situationTypes),
    interpretation: interpretationParts.join("\n\n"),
    advice:
      "꿈은 현실을 그대로 예언한다기보다 현재 마음 상태를 상징적으로 보여주는 경우가 많습니다. 참고용으로 편안하게 받아들여보세요.",
    relatedKeywords,
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

  if (analysis.emotions.length > 0) {
    result += `3. 꿈속 감정\n${analysis.emotions.join(", ")}\n\n`;
  }

  if (analysis.situations.length > 0) {
    result += `4. 발견된 상황\n${analysis.situations.join(", ")}\n\n`;
  }

  result += `5. 종합 해몽\n${analysis.interpretation}\n\n`;
  result += `6. 현실 조언\n${analysis.advice}\n\n`;

  if (analysis.relatedKeywords.length > 0) {
    result += `7. 관련 꿈\n${analysis.relatedKeywords.join(", ")}\n\n`;
  }

  result += "※ 이 해몽은 참고용입니다.";

  return result;
}
