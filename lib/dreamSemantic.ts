import type { DreamInterpretation } from "../types/dream";
import { DEFAULT_INTERPRETATION_CAUTION } from "./dreamInterpretation.ts";

export type DreamUnderstanding = {
  summaryOfDream: string;
  settings: string[];
  scenes: Array<{
    order: number;
    description: string;
    emotion: string | null;
    evidence: string;
  }>;
  importantSymbols: string[];
  transitions: Array<{
    from: string;
    to: string;
    meaningCandidate: string;
    evidence: string;
  }>;
  emotionalArc: {
    beginning: string | null;
    middle: string | null;
    ending: string | null;
  };
  agencyArc: {
    beginning: string | null;
    ending: string | null;
    change: string | null;
  };
  ending: string;
  ambiguities: string[];
  needsClarification: boolean;
  clarificationQuestion: string | null;
};

export type SemanticReading = {
  title: string;
  overallInterpretation: string;
  flowAssessment: string;
  keyTransitions: string[];
  symbols: Array<{
    symbol: string;
    generalMeaning: string;
    meaningInThisDream: string;
    connectedMeaning: string;
    sourceSceneOrders: number[];
  }>;
  integratedInterpretation: string;
  traditionalInterpretation: string;
  psychologicalInterpretation: string;
  fortuneFlow: string;
  oneSentenceSummary: string;
  disclaimer: string;
  groundingChecks: {
    noInventedPeoplePlacesActions: boolean;
    sequencePreserved: boolean;
    explicitEmotionsPreserved: boolean;
    endingPreserved: boolean;
  };
};

export const understandingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summaryOfDream", "settings", "scenes", "importantSymbols", "transitions", "emotionalArc", "agencyArc", "ending", "ambiguities", "needsClarification", "clarificationQuestion"],
  properties: {
    summaryOfDream: { type: "string", minLength: 15, maxLength: 400 },
    settings: { type: "array", maxItems: 8, items: { type: "string", minLength: 2, maxLength: 100 } },
    scenes: {
      type: "array", minItems: 1, maxItems: 10,
      items: {
        type: "object", additionalProperties: false,
        required: ["order", "description", "emotion", "evidence"],
        properties: {
          order: { type: "integer", minimum: 1, maximum: 10 },
          description: { type: "string", minLength: 8, maxLength: 300 },
          emotion: { type: ["string", "null"] },
          evidence: { type: "string", minLength: 2, maxLength: 300 },
        },
      },
    },
    importantSymbols: { type: "array", minItems: 1, maxItems: 8, items: { type: "string", minLength: 2, maxLength: 80 } },
    transitions: {
      type: "array", maxItems: 6,
      items: {
        type: "object", additionalProperties: false,
        required: ["from", "to", "meaningCandidate", "evidence"],
        properties: {
          from: { type: "string", minLength: 2, maxLength: 140 },
          to: { type: "string", minLength: 2, maxLength: 140 },
          meaningCandidate: { type: "string", minLength: 2, maxLength: 160 },
          evidence: { type: "string", minLength: 2, maxLength: 300 },
        },
      },
    },
    emotionalArc: {
      type: "object", additionalProperties: false,
      required: ["beginning", "middle", "ending"],
      properties: { beginning: { type: ["string", "null"] }, middle: { type: ["string", "null"] }, ending: { type: ["string", "null"] } },
    },
    agencyArc: {
      type: "object", additionalProperties: false,
      required: ["beginning", "ending", "change"],
      properties: { beginning: { type: ["string", "null"] }, ending: { type: ["string", "null"] }, change: { type: ["string", "null"] } },
    },
    ending: { type: "string", minLength: 2, maxLength: 300 },
    ambiguities: { type: "array", maxItems: 5, items: { type: "string", minLength: 2, maxLength: 180 } },
    needsClarification: { type: "boolean" },
    clarificationQuestion: { type: ["string", "null"] },
  },
} as const;

export const readingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "overallInterpretation", "flowAssessment", "keyTransitions", "symbols", "integratedInterpretation", "traditionalInterpretation", "psychologicalInterpretation", "fortuneFlow", "oneSentenceSummary", "disclaimer", "groundingChecks"],
  properties: {
    title: { type: "string", minLength: 4, maxLength: 50 },
    overallInterpretation: { type: "string", minLength: 180, maxLength: 700 },
    flowAssessment: { type: "string", minLength: 2, maxLength: 80 },
    keyTransitions: { type: "array", maxItems: 5, items: { type: "string", minLength: 5, maxLength: 100 } },
    symbols: {
      type: "array", minItems: 2, maxItems: 7,
      items: {
        type: "object", additionalProperties: false,
        required: ["symbol", "generalMeaning", "meaningInThisDream", "connectedMeaning", "sourceSceneOrders"],
        properties: {
          symbol: { type: "string", minLength: 2, maxLength: 100 },
          generalMeaning: { type: "string", minLength: 40, maxLength: 360 },
          meaningInThisDream: { type: "string", minLength: 90, maxLength: 560 },
          connectedMeaning: { type: "string", minLength: 50, maxLength: 420 },
          sourceSceneOrders: { type: "array", minItems: 1, maxItems: 4, items: { type: "integer", minimum: 1, maximum: 10 } },
        },
      },
    },
    integratedInterpretation: { type: "string", minLength: 650, maxLength: 2400 },
    traditionalInterpretation: { type: "string", minLength: 140, maxLength: 850 },
    psychologicalInterpretation: { type: "string", minLength: 140, maxLength: 850 },
    fortuneFlow: { type: "string", minLength: 100, maxLength: 600 },
    oneSentenceSummary: { type: "string", minLength: 20, maxLength: 220 },
    disclaimer: { type: "string", minLength: 30, maxLength: 240 },
    groundingChecks: {
      type: "object", additionalProperties: false,
      required: ["noInventedPeoplePlacesActions", "sequencePreserved", "explicitEmotionsPreserved", "endingPreserved"],
      properties: {
        noInventedPeoplePlacesActions: { type: "boolean" }, sequencePreserved: { type: "boolean" },
        explicitEmotionsPreserved: { type: "boolean" }, endingPreserved: { type: "boolean" },
      },
    },
  },
} as const;

const INTERNAL_LANGUAGE = /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model|grounding|confidence|ambiguity)\b|인공지능|프롬프트|토큰|주체가\s*(?:원문에\s*)?(?:없|나오지)|원문에\s*없는|파서|파싱|검증(?:된| 결과)|사실관계|추출(?:된| 결과)|물살을\s*변하는\s*행동|(?:^|\s)이(?:$|[.!?])/iu;
const PREDICTION = /반드시|틀림없이|무조건|복권|당첨|죽게\s*됩니다|임신하게\s*됩니다|재물이\s*들어옵니다|사업이\s*성공합니다|취업이\s*확정됩니다|사고가\s*생깁니다|(?:행운|변화|기회|성공)[을를]?\s*예고합니다/iu;
const POSITIVE_EMOTION = /행복|기쁨|즐거|편안|홀가분|안도|개방감|황홀|평온|신나/u;
const NEGATIVE_EMOTION = /공포|두려|불안|무서|답답|고통|슬픔|분노|초조|괴로/u;
const INVENTED_NEGATIVE_CONTEXT = /(?:현재|삶|내면|심리|현실).{0,20}(?:혼란|갈등|방향(?:을|감각)?\s*(?:잃|상실)|통제력\s*상실|복잡한\s*문제|어려움)|(?:혼란|갈등|방향\s*상실|통제력\s*상실)(?:한|의)?\s*(?:상태|상황)/u;

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalize(value: string) {
  return value.normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "").toLocaleLowerCase("ko-KR");
}

function evidenceMatches(dream: string, evidence: string) {
  const source = normalize(dream);
  const quote = normalize(evidence);
  return quote.length >= 2 && source.includes(quote);
}

export function validateUnderstanding(value: unknown, dream: string): DreamUnderstanding | null {
  if (!object(value) || !Array.isArray(value.scenes) || !Array.isArray(value.settings) || !Array.isArray(value.importantSymbols) || !Array.isArray(value.transitions) || !object(value.emotionalArc) || !object(value.agencyArc) || !Array.isArray(value.ambiguities)) return null;
  const scenes = value.scenes.filter(object).map((scene) => ({
    order: Number(scene.order), description: String(scene.description ?? "").trim(),
    emotion: scene.emotion === null ? null : String(scene.emotion ?? "").trim() || null,
    evidence: String(scene.evidence ?? "").trim(),
  }));
  if (!scenes.length || scenes.some((scene, index) => scene.order !== index + 1 || scene.description.length < 8 || !evidenceMatches(dream, scene.evidence))) return null;
  const transitions = value.transitions.filter(object).map((item) => ({
    from: String(item.from ?? "").trim(), to: String(item.to ?? "").trim(),
    meaningCandidate: String(item.meaningCandidate ?? "").trim(), evidence: String(item.evidence ?? "").trim(),
  }));
  if (transitions.some((item) => !item.from || !item.to || !evidenceMatches(dream, item.evidence))) return null;
  const understanding: DreamUnderstanding = {
    summaryOfDream: String(value.summaryOfDream ?? "").trim(),
    settings: value.settings.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8),
    scenes,
    importantSymbols: value.importantSymbols.map(String).map((item) => item.trim()).filter((item) => isMeaningfulLabel(item)).slice(0, 8),
    transitions,
    emotionalArc: { beginning: nullable(value.emotionalArc.beginning), middle: nullable(value.emotionalArc.middle), ending: nullable(value.emotionalArc.ending) },
    agencyArc: { beginning: nullable(value.agencyArc.beginning), ending: nullable(value.agencyArc.ending), change: nullable(value.agencyArc.change) },
    ending: String(value.ending ?? "").trim(),
    ambiguities: value.ambiguities.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 5),
    needsClarification: value.needsClarification === true,
    clarificationQuestion: nullable(value.clarificationQuestion),
  };
  return understanding.summaryOfDream.length >= 15 && understanding.ending.length >= 2 && understanding.importantSymbols.length ? understanding : null;
}

function nullable(value: unknown) {
  if (value === null || value === undefined) return null;
  return String(value).trim() || null;
}

function paragraphs(value: string) {
  return value.split(/\n\s*\n/gu).map((item) => item.replace(/\s+/gu, " ").trim()).filter(Boolean);
}

export function isMeaningfulLabel(value: string) {
  const text = value.trim();
  return text.length >= 2 && !/^(?:이|가|은|는|을|를|것|그것|행동|상태|요소)$/u.test(text) && !/을\s*변하는\s*행동/u.test(text);
}

export function validateReading(value: unknown, understanding: DreamUnderstanding): SemanticReading | null {
  if (!object(value) || !Array.isArray(value.symbols) || !Array.isArray(value.keyTransitions) || !object(value.groundingChecks)) return null;
  const symbols = value.symbols.filter(object).map((scene) => ({
    symbol: String(scene.symbol ?? "").trim(),
    generalMeaning: String(scene.generalMeaning ?? "").trim(),
    meaningInThisDream: String(scene.meaningInThisDream ?? "").trim(),
    connectedMeaning: String(scene.connectedMeaning ?? "").trim(),
    sourceSceneOrders: Array.isArray(scene.sourceSceneOrders) ? scene.sourceSceneOrders.map(Number) : [],
  }));
  const reading: SemanticReading = {
    title: String(value.title ?? "").trim(),
    overallInterpretation: String(value.overallInterpretation ?? "").trim(),
    flowAssessment: String(value.flowAssessment ?? "").trim(),
    keyTransitions: value.keyTransitions.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 5),
    symbols,
    integratedInterpretation: String(value.integratedInterpretation ?? "").trim(),
    traditionalInterpretation: String(value.traditionalInterpretation ?? "").trim(),
    psychologicalInterpretation: String(value.psychologicalInterpretation ?? "").trim(),
    fortuneFlow: String(value.fortuneFlow ?? "").trim(),
    oneSentenceSummary: String(value.oneSentenceSummary ?? "").trim(),
    disclaimer: String(value.disclaimer ?? "").trim(),
    groundingChecks: {
      noInventedPeoplePlacesActions: value.groundingChecks.noInventedPeoplePlacesActions === true,
      sequencePreserved: value.groundingChecks.sequencePreserved === true,
      explicitEmotionsPreserved: value.groundingChecks.explicitEmotionsPreserved === true,
      endingPreserved: value.groundingChecks.endingPreserved === true,
    },
  };
  const allText = [reading.title, reading.overallInterpretation, reading.flowAssessment, ...reading.keyTransitions, ...symbols.flatMap((scene) => [scene.symbol, scene.generalMeaning, scene.meaningInThisDream, scene.connectedMeaning]), reading.integratedInterpretation, reading.traditionalInterpretation, reading.psychologicalInterpretation, reading.fortuneFlow, reading.oneSentenceSummary, reading.disclaimer].join(" ");
  const maxOrder = understanding.scenes.length;
  const isLongDream = understanding.summaryOfDream.length >= 140 || understanding.scenes.length >= 3;
  const integratedParagraphs = paragraphs(reading.integratedInterpretation);
  const minimumSymbols = isLongDream ? 3 : 2;
  const minimumIntegratedLength = isLongDream ? 650 : 420;
  const minimumParagraphs = isLongDream ? 4 : 3;
  const minimumTotalLength = isLongDream ? 2200 : 1250;
  if (reading.title.length < 4 || reading.overallInterpretation.length < 170 || symbols.length < minimumSymbols || symbols.length > 7 || reading.integratedInterpretation.length < minimumIntegratedLength || reading.traditionalInterpretation.length < 130 || reading.psychologicalInterpretation.length < 130 || reading.fortuneFlow.length < 90 || reading.oneSentenceSummary.length < 20 || reading.disclaimer.length < 20 || integratedParagraphs.length < minimumParagraphs || integratedParagraphs.length > 7 || allText.length < minimumTotalLength || INTERNAL_LANGUAGE.test(allText) || PREDICTION.test(allText)) return null;
  if (understanding.transitions.length && reading.keyTransitions.length === 0) return null;
  if (symbols.some((scene) => !isMeaningfulLabel(scene.symbol) || scene.generalMeaning.length < 35 || scene.meaningInThisDream.length < 80 || scene.connectedMeaning.length < 45 || !scene.sourceSceneOrders.length || scene.sourceSceneOrders.some((order) => order < 1 || order > maxOrder))) return null;
  const explicitEmotionText = [
    ...understanding.scenes.map((scene) => scene.emotion ?? ""),
    understanding.emotionalArc.beginning ?? "",
    understanding.emotionalArc.middle ?? "",
    understanding.emotionalArc.ending ?? "",
  ].join(" ");
  const contextualText = [
    reading.overallInterpretation,
    ...symbols.flatMap((scene) => [scene.meaningInThisDream, scene.connectedMeaning]),
    reading.integratedInterpretation,
    reading.psychologicalInterpretation,
    reading.fortuneFlow,
  ].join(" ");
  if (POSITIVE_EMOTION.test(explicitEmotionText) && !NEGATIVE_EMOTION.test(explicitEmotionText) && INVENTED_NEGATIVE_CONTEXT.test(contextualText)) return null;
  if (Object.values(reading.groundingChecks).some((passed) => !passed)) return null;
  return reading;
}

export function toDreamInterpretation(reading: SemanticReading): DreamInterpretation {
  return {
    title: reading.title,
    factVersion: "v1",
    coreConclusion: reading.overallInterpretation,
    dreamType: reading.symbols.length > 2 ? "multi_scene" : "single_scene",
    keyScenes: reading.symbols.map((scene) => ({ title: scene.symbol, meaning: `${scene.generalMeaning} ${scene.meaningInThisDream} ${scene.connectedMeaning}` })),
    relationshipMeaning: "",
    objectMeaning: "",
    integratedInterpretation: reading.integratedInterpretation,
    realLifeConnections: [],
    reflectionQuestions: [],
    caution: DEFAULT_INTERPRETATION_CAUTION,
    grounding: [],
    overallInterpretation: reading.overallInterpretation,
    symbols: reading.symbols.map(({ symbol, generalMeaning, meaningInThisDream, connectedMeaning }) => ({ symbol, generalMeaning, meaningInThisDream, connectedMeaning })),
    integratedMeaning: reading.integratedInterpretation,
    traditionalInterpretation: reading.traditionalInterpretation,
    psychologicalInterpretation: reading.psychologicalInterpretation,
    flowAssessment: reading.flowAssessment,
    keyTransitions: reading.keyTransitions,
    fortuneFlow: reading.fortuneFlow,
    oneSentenceSummary: reading.oneSentenceSummary,
    disclaimer: reading.disclaimer,
  };
}


export function debugAnalysisEnabled() {
  return process.env.NODE_ENV === "development" && process.env.DREAM_DEBUG_ANALYSIS === "true";
}
