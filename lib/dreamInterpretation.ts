import type {
  ContextualDreamInterpretation,
  DreamAnalysis,
  DreamInterpretation,
} from "../types/dream";

export const DEFAULT_INTERPRETATION_CAUTION =
  "꿈풀이는 현재의 감정과 경험을 돌아보기 위한 참고입니다. 개인의 상황에 따라 의미가 달라질 수 있으며, 미래의 사건이나 건강·재물의 변화를 단정하는 뜻으로 받아들이지 마세요.";

const TECHNICAL_TERMS = /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/i;
const HTML_TAG = /<\/?[a-z][^>]*>/i;
const DETERMINISTIC_LANGUAGE = /반드시|틀림없이|곧\s*일어난다|확실하게\s*(?:일어난다|된다)|(?:당첨|임신|질병|사고|죽음)(?:할|한다|이다|입니다)/;
const RELATION_LANGUAGE = /함께|이어|연결|변화|흐름|결말|감정|영향|반면|때문|따라|상호|관계/;
const GENERIC_DICTIONARY_OPENING = /^(?:일반적으로|보통|꿈 사전에서|사전적으로).{0,40}(?:상징|의미)/;

export type ContextualValidationResult =
  | { ok: true; value: ContextualDreamInterpretation }
  | { ok: false; code: "invalid_response" | "quality_rejected" };

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function compactMultilineText(value: string, maxLength: number) {
  return value
    .split(/\r?\n/)
    .map((line) => compactText(line, maxLength))
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function isSafeText(value: unknown, minLength: number, maxLength: number): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return (
    text.length >= minLength &&
    text.length <= maxLength &&
    !TECHNICAL_TERMS.test(text) &&
    !HTML_TAG.test(text) &&
    !DETERMINISTIC_LANGUAGE.test(text)
  );
}

function normalized(value: string) {
  return value.replace(/\s+/g, "").replace(/["'“”‘’.,!?·:;()[\]{}]/g, "").toLocaleLowerCase("ko-KR");
}

function evidenceAppearsInDream(evidence: string, dream: string) {
  const normalizedEvidence = normalized(evidence);
  const normalizedDream = normalized(dream);
  if (normalizedEvidence.length < 2) return false;
  if (normalizedDream.includes(normalizedEvidence)) return true;

  const evidenceWords = evidence
    .split(/\s+/)
    .map((word) => normalized(word))
    .filter((word) => word.length >= 2);
  return evidenceWords.length >= 2 && evidenceWords.filter((word) => normalizedDream.includes(word)).length >= 2;
}

const SCENE_STOP_WORDS = new Set(["그리고", "그런데", "하지만", "마지막에는", "처음에는", "꿈에서", "장면", "상황"]);

function sceneRelatesToDream(scene: string, dream: string) {
  if (evidenceAppearsInDream(scene, dream)) return true;
  const dreamText = normalized(dream);
  return scene
    .split(/\s+/)
    .map((word) => word.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter((word) => word.length >= 2 && !SCENE_STOP_WORDS.has(word))
    .some((word) => {
      const normalizedWord = normalized(word);
      return dreamText.includes(normalizedWord) || (normalizedWord.length >= 3 && dreamText.includes(normalizedWord.slice(0, 3)));
    });
}

function containsRepeatedSentences(values: string[]) {
  const sentences = values
    .flatMap((value) => value.split(/[.!?。！？\n]+/))
    .map((sentence) => normalized(sentence))
    .filter((sentence) => sentence.length >= 12);
  return new Set(sentences).size !== sentences.length;
}

function symbolKey(value: string) {
  return value.replace(/[^가-힣a-zA-Z0-9]/g, "").toLocaleLowerCase("ko-KR");
}

function invalid(): ContextualValidationResult {
  return { ok: false, code: "invalid_response" };
}

function qualityRejected(): ContextualValidationResult {
  return { ok: false, code: "quality_rejected" };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}

export function validateContextualInterpretation(
  value: unknown,
  dream: string
): ContextualValidationResult {
  if (!isObject(value)) return invalid();
  const candidate = value;
  if (!isObject(candidate.emotionAnalysis) || !isObject(candidate.flowAnalysis)) return invalid();
  if (
    typeof candidate.summary !== "string" ||
    typeof candidate.integratedInterpretation !== "string" ||
    typeof candidate.caution !== "string"
  ) return invalid();
  if (!Array.isArray(candidate.symbols) || candidate.symbols.length < 2 || candidate.symbols.length > 6) {
    return invalid();
  }
  if (!Array.isArray(candidate.lifeGuidance) || candidate.lifeGuidance.length < 3 || candidate.lifeGuidance.length > 5) {
    return invalid();
  }
  const emotion = candidate.emotionAnalysis;
  const flow = candidate.flowAnalysis;
  if (
    typeof emotion.expressedEmotion !== "string" ||
    typeof emotion.contrast !== "string" ||
    typeof emotion.interpretation !== "string" ||
    typeof flow.beginning !== "string" ||
    typeof flow.change !== "string" ||
    typeof flow.ending !== "string" ||
    typeof flow.meaning !== "string"
  ) return invalid();

  if (!isSafeText(candidate.summary, 150, 450)) return qualityRejected();
  if (!isSafeText(emotion.expressedEmotion, 2, 250)) return qualityRejected();
  if (!isSafeText(emotion.contrast, 5, 350)) return qualityRejected();
  if (!isSafeText(emotion.interpretation, 150, 600)) return qualityRejected();
  if (!isSafeText(flow.beginning, 2, 350)) return qualityRejected();
  if (!isSafeText(flow.change, 2, 350)) return qualityRejected();
  if (!isSafeText(flow.ending, 2, 350)) return qualityRejected();
  if (!isSafeText(flow.meaning, 180, 700)) return qualityRejected();
  if (!isSafeText(candidate.integratedInterpretation, 600, 1600)) return qualityRejected();
  if (candidate.caution !== DEFAULT_INTERPRETATION_CAUTION) return qualityRejected();
  if (!RELATION_LANGUAGE.test(candidate.integratedInterpretation)) return qualityRejected();
  if (GENERIC_DICTIONARY_OPENING.test(candidate.summary.trim())) return qualityRejected();

  const symbols = candidate.symbols.map((symbol) => {
    if (!isObject(symbol)) return null;
    if (typeof symbol.name !== "string" || typeof symbol.contextualMeaning !== "string" || typeof symbol.evidence !== "string") {
      return null;
    }
    if (!isSafeText(symbol.name, 1, 80)) return null;
    if (!isSafeText(symbol.contextualMeaning, 50, 450)) return null;
    if (!isSafeText(symbol.evidence, 2, 160)) return null;
    if (!evidenceAppearsInDream(symbol.evidence, dream)) return null;
    return {
      name: compactText(symbol.name, 80),
      contextualMeaning: compactText(symbol.contextualMeaning, 450),
      evidence: compactText(symbol.evidence, 160),
    };
  });
  if (symbols.some((symbol) => symbol === null)) return qualityRejected();

  const lifeGuidance = candidate.lifeGuidance.map((guidance) =>
    isSafeText(guidance, 15, 250) ? compactText(guidance, 250) : null
  );
  if (lifeGuidance.some((guidance) => guidance === null)) return qualityRejected();

  const validatedSymbols = symbols as ContextualDreamInterpretation["symbols"];
  const sceneEvidence = [
    ...validatedSymbols.map((symbol) => symbol.evidence),
    flow.beginning,
    flow.change,
    flow.ending,
  ].filter((evidence, index, all) => sceneRelatesToDream(evidence, dream) && all.indexOf(evidence) === index);
  if (sceneEvidence.length < 3 || !sceneRelatesToDream(flow.ending, dream)) return qualityRejected();

  const repeatedText = [
    candidate.summary,
    emotion.expressedEmotion,
    emotion.contrast,
    emotion.interpretation,
    flow.beginning,
    flow.change,
    flow.ending,
    flow.meaning,
    candidate.integratedInterpretation,
    candidate.caution,
    ...validatedSymbols.map((symbol) => symbol.contextualMeaning),
    ...(lifeGuidance as string[]),
  ] as string[];
  if (containsRepeatedSentences(repeatedText)) return qualityRejected();

  return {
    ok: true,
    value: {
      summary: compactText(candidate.summary, 450),
      symbols: validatedSymbols,
      emotionAnalysis: {
        expressedEmotion: compactText(emotion.expressedEmotion, 250),
        contrast: compactText(emotion.contrast, 350),
        interpretation: compactText(emotion.interpretation, 600),
      },
      flowAnalysis: {
        beginning: compactText(flow.beginning, 350),
        change: compactText(flow.change, 350),
        ending: compactText(flow.ending, 350),
        meaning: compactText(flow.meaning, 700),
      },
      integratedInterpretation: compactText(candidate.integratedInterpretation, 1600),
      lifeGuidance: lifeGuidance as string[],
      caution: DEFAULT_INTERPRETATION_CAUTION,
    },
  };
}

export function validateCachedInterpretation(value: unknown): DreamInterpretation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.title !== "꿈풀이" ||
    !isSafeText(candidate.summary, 150, 500) ||
    !isSafeText(candidate.emotion, 150, 1400) ||
    !isSafeText(candidate.flow, 180, 1800) ||
    !isSafeText(candidate.interpretation, 600, 2200) ||
    !isSafeText(candidate.guidance, 45, 1400) ||
    candidate.caution !== DEFAULT_INTERPRETATION_CAUTION ||
    !Array.isArray(candidate.symbols) ||
    candidate.symbols.length > 6
  ) return null;

  const symbols = candidate.symbols.map((symbol) => {
    if (!symbol || typeof symbol !== "object" || Array.isArray(symbol)) return null;
    const item = symbol as Record<string, unknown>;
    if (!isSafeText(item.name, 1, 80) || !isSafeText(item.meaning, 5, 400)) return null;
    return { name: compactText(item.name, 80), meaning: compactText(item.meaning, 400) };
  });
  if (symbols.some((symbol) => symbol === null)) return null;

  const guidance = compactMultilineText(candidate.guidance, 1400);
  if (guidance.split("\n").filter(Boolean).length < 3) return null;

  return {
    title: "꿈풀이",
    summary: compactText(candidate.summary, 500),
    symbols: symbols as DreamInterpretation["symbols"],
    emotion: compactText(candidate.emotion, 1400),
    flow: compactMultilineText(candidate.flow, 1800),
    interpretation: compactText(candidate.interpretation, 2200),
    guidance,
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}

export function mergeInterpretations(
  dictionary: DreamInterpretation,
  contextual: ContextualDreamInterpretation,
  detectedEmotions: string[]
): DreamInterpretation {
  const contextualSymbols = [...contextual.symbols];
  const mergedDictionarySymbols = dictionary.symbols.map((dictionarySymbol) => {
    const dictionaryKey = symbolKey(dictionarySymbol.name);
    const matchingIndex = contextualSymbols.findIndex((symbol) => {
      const contextualKey = symbolKey(symbol.name);
      return contextualKey.includes(dictionaryKey) || dictionaryKey.includes(contextualKey);
    });
    if (matchingIndex < 0) return dictionarySymbol;
    const [matching] = contextualSymbols.splice(matchingIndex, 1);
    return { name: dictionarySymbol.name, meaning: matching.contextualMeaning };
  });

  const additionalSymbols = contextualSymbols.map(({ name, contextualMeaning }) => ({
    name,
    meaning: contextualMeaning,
  }));
  const emotionPrefix = detectedEmotions.length
    ? `직접 드러난 감정: ${detectedEmotions.join(", ")}\n`
    : "";

  return {
    title: "꿈풀이",
    summary: contextual.summary,
    symbols: [...mergedDictionarySymbols, ...additionalSymbols].slice(0, 6),
    emotion: `${emotionPrefix}${contextual.emotionAnalysis.expressedEmotion}\n${contextual.emotionAnalysis.contrast}\n${contextual.emotionAnalysis.interpretation}`,
    flow: `시작: ${contextual.flowAnalysis.beginning}\n변화: ${contextual.flowAnalysis.change}\n마지막: ${contextual.flowAnalysis.ending}\n${contextual.flowAnalysis.meaning}`,
    interpretation: contextual.integratedInterpretation,
    guidance: contextual.lifeGuidance.map((item) => `• ${item}`).join("\n"),
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}
