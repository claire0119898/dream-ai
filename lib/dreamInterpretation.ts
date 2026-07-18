import type { DreamAnalysis, DreamInterpretation } from "../types/dream";

const DEFAULT_CAUTION =
  "꿈풀이는 현재의 감정과 경험을 돌아보기 위한 참고입니다. 미래의 사건이나 건강, 재물의 변화를 단정하는 의미로 받아들이지 마세요.";

const TECHNICAL_TERMS = /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/i;

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isSafeText(value: unknown, maxLength: number, minLength = 1): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength &&
    !TECHNICAL_TERMS.test(value)
  );
}

export function createDictionaryInterpretation(analysis: DreamAnalysis): DreamInterpretation {
  return {
    title: "꿈풀이",
    summary: analysis.summary,
    symbols: analysis.keywords.slice(0, 6).map((item) => ({
      name: `${item.emoji ?? ""} ${item.keyword}`.trim(),
      meaning: `${item.meaning} ${item.good}`.trim(),
    })),
    emotion: analysis.emotions.length
      ? `꿈속에서 ${analysis.emotions.join(", ")}의 감정이 두드러집니다. 이 감정은 최근 경험이나 마음의 긴장과 이어져 있을 수 있습니다.`
      : "꿈속 감정이 분명하게 드러나지 않았다면, 깨어난 직후 가장 오래 남았던 기분을 함께 떠올려보세요.",
    flow: analysis.situations.length
      ? `${analysis.situations.join(", ")}의 흐름이 나타납니다. 장면이 어떻게 시작되고 끝났는지도 의미를 이해하는 단서가 됩니다.`
      : "뚜렷한 상황 유형보다 등장한 상징과 전체 분위기를 중심으로 살펴보는 편이 자연스럽습니다.",
    interpretation: analysis.interpretation,
    guidance: analysis.advice,
    caution: DEFAULT_CAUTION,
  };
}

export function validateExternalInterpretation(value: unknown): DreamInterpretation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const symbols = candidate.symbols;

  if (
    !isSafeText(candidate.title, 60) ||
    !isSafeText(candidate.summary, 500, 10) ||
    !isSafeText(candidate.emotion, 500, 10) ||
    !isSafeText(candidate.flow, 500, 10) ||
    !isSafeText(candidate.interpretation, 1800, 20) ||
    !isSafeText(candidate.guidance, 600, 10) ||
    !isSafeText(candidate.caution, 500, 10) ||
    !Array.isArray(symbols) ||
    symbols.length > 6
  ) {
    return null;
  }

  const validatedSymbols = symbols.map((symbol) => {
    if (!symbol || typeof symbol !== "object" || Array.isArray(symbol)) return null;
    const item = symbol as Record<string, unknown>;
    if (!isSafeText(item.name, 80) || !isSafeText(item.meaning, 400, 5)) return null;
    return {
      name: compactText(item.name, 80),
      meaning: compactText(item.meaning, 400),
    };
  });

  if (validatedSymbols.some((symbol) => symbol === null)) return null;

  return {
    title: compactText(candidate.title, 60),
    summary: compactText(candidate.summary, 500),
    symbols: validatedSymbols as DreamInterpretation["symbols"],
    emotion: compactText(candidate.emotion, 500),
    flow: compactText(candidate.flow, 500),
    interpretation: compactText(candidate.interpretation, 1800),
    guidance: compactText(candidate.guidance, 600),
    caution: compactText(candidate.caution, 500),
  };
}

export function mergeInterpretations(
  dictionary: DreamInterpretation,
  contextual: DreamInterpretation
): DreamInterpretation {
  const dictionaryNames = new Set(dictionary.symbols.map((symbol) => symbol.name.replace(/^\S+\s/, "")));
  const additionalSymbols = contextual.symbols.filter(
    (symbol) => !dictionaryNames.has(symbol.name.replace(/^\S+\s/, ""))
  );

  return {
    title: "꿈풀이",
    summary: contextual.summary,
    symbols: [...dictionary.symbols, ...additionalSymbols].slice(0, 6),
    emotion: contextual.emotion,
    flow: contextual.flow,
    interpretation: contextual.interpretation,
    guidance: contextual.guidance,
    caution: contextual.caution || dictionary.caution,
  };
}
