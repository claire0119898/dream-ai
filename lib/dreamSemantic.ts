import type { DreamAnalysis, DreamInterpretation } from "../types/dream";
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
  overview: string;
  importantScenes: Array<{
    title: string;
    interpretation: string;
    sourceSceneOrders: number[];
  }>;
  integratedInterpretation: string;
  reflectionPoints: string[];
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
  required: ["title", "overview", "importantScenes", "integratedInterpretation", "reflectionPoints", "groundingChecks"],
  properties: {
    title: { type: "string", minLength: 4, maxLength: 50 },
    overview: { type: "string", minLength: 90, maxLength: 320 },
    importantScenes: {
      type: "array", minItems: 2, maxItems: 4,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "interpretation", "sourceSceneOrders"],
        properties: {
          title: { type: "string", minLength: 6, maxLength: 120 },
          interpretation: { type: "string", minLength: 70, maxLength: 420 },
          sourceSceneOrders: { type: "array", minItems: 1, maxItems: 4, items: { type: "integer", minimum: 1, maximum: 10 } },
        },
      },
    },
    integratedInterpretation: { type: "string", minLength: 350, maxLength: 1000 },
    reflectionPoints: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", minLength: 30, maxLength: 220 } },
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

const INTERNAL_LANGUAGE = /주체가\s*(?:원문에\s*)?(?:없|나오지)|원문에\s*없는|파서|파싱|grounding|검증(?:된| 결과)|사실관계|추출(?:된| 결과)|물살을\s*변하는\s*행동|(?:^|\s)이(?:$|[.!?])/iu;
const PREDICTION = /반드시|틀림없이|무조건|복권|당첨|죽게\s*됩니다|임신하게\s*됩니다/iu;

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

export function isMeaningfulLabel(value: string) {
  const text = value.trim();
  return text.length >= 2 && !/^(?:이|가|은|는|을|를|것|그것|행동|상태|요소)$/u.test(text) && !/을\s*변하는\s*행동/u.test(text);
}

export function validateReading(value: unknown, understanding: DreamUnderstanding): SemanticReading | null {
  if (!object(value) || !Array.isArray(value.importantScenes) || !Array.isArray(value.reflectionPoints) || !object(value.groundingChecks)) return null;
  const importantScenes = value.importantScenes.filter(object).map((scene) => ({
    title: String(scene.title ?? "").trim(), interpretation: String(scene.interpretation ?? "").trim(),
    sourceSceneOrders: Array.isArray(scene.sourceSceneOrders) ? scene.sourceSceneOrders.map(Number) : [],
  }));
  const reading: SemanticReading = {
    title: String(value.title ?? "").trim(), overview: String(value.overview ?? "").trim(), importantScenes,
    integratedInterpretation: String(value.integratedInterpretation ?? "").trim(),
    reflectionPoints: value.reflectionPoints.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 2),
    groundingChecks: {
      noInventedPeoplePlacesActions: value.groundingChecks.noInventedPeoplePlacesActions === true,
      sequencePreserved: value.groundingChecks.sequencePreserved === true,
      explicitEmotionsPreserved: value.groundingChecks.explicitEmotionsPreserved === true,
      endingPreserved: value.groundingChecks.endingPreserved === true,
    },
  };
  const allText = [reading.title, reading.overview, ...importantScenes.flatMap((scene) => [scene.title, scene.interpretation]), reading.integratedInterpretation, ...reading.reflectionPoints].join(" ");
  const maxOrder = understanding.scenes.length;
  if (reading.title.length < 4 || reading.overview.length < 70 || importantScenes.length < 2 || importantScenes.length > 4 || reading.integratedInterpretation.length < 250 || !reading.reflectionPoints.length || INTERNAL_LANGUAGE.test(allText) || PREDICTION.test(allText)) return null;
  if (importantScenes.some((scene) => !isMeaningfulLabel(scene.title) || scene.interpretation.length < 45 || !scene.sourceSceneOrders.length || scene.sourceSceneOrders.some((order) => order < 1 || order > maxOrder))) return null;
  if (Object.values(reading.groundingChecks).some((passed) => !passed)) return null;
  return reading;
}

export function toDreamInterpretation(reading: SemanticReading): DreamInterpretation {
  return {
    title: reading.title,
    factVersion: "v1",
    coreConclusion: reading.overview,
    dreamType: reading.importantScenes.length > 2 ? "multi_scene" : "single_scene",
    keyScenes: reading.importantScenes.map((scene) => ({ title: scene.title, meaning: scene.interpretation })),
    relationshipMeaning: "",
    objectMeaning: "",
    integratedInterpretation: reading.integratedInterpretation,
    realLifeConnections: reading.reflectionPoints,
    reflectionQuestions: [],
    caution: DEFAULT_INTERPRETATION_CAUTION,
    grounding: [],
  };
}

export function createSemanticFallback(dream: string, analysis: DreamAnalysis): DreamInterpretation {
  const sentences = dream.split(/(?<=[.!?。！？])|(?:그러다가|그런데|마지막에는|결국)/u).map((item) => item.trim()).filter((item) => item.length >= 8);
  const groupSize = Math.max(1, Math.ceil(sentences.length / 4));
  const selected = sentences.length > 4
    ? Array.from({ length: Math.ceil(sentences.length / groupSize) }, (_, index) => sentences.slice(index * groupSize, (index + 1) * groupSize).join(" ")).slice(0, 4)
    : sentences;
  const emotions = analysis.emotions.length ? ` 꿈에서 직접 느낀 ${analysis.emotions.join(", ")}의 감정이 이 풀이의 방향을 정합니다.` : "";
  const symbols = analysis.keywords.slice(0, 6).map((item) => item.keyword);
  const scenes = selected.length >= 2 ? selected : [dream.slice(0, 100), dream.slice(-100)];
  return {
    title: "꿈의 흐름을 따라 본 풀이", factVersion: "v1",
    coreConclusion: `이 꿈은 처음의 장면에서 마지막 장면으로 이어지는 흐름과 그때의 감정에 중심을 둔 꿈입니다.${emotions}`,
    dreamType: scenes.length > 2 ? "multi_scene" : "single_scene",
    keyScenes: scenes.map((scene) => {
      const clean = scene.replace(/\s+/gu, " ").trim();
      const title = clean.replace(/[.!?。！？].*$/u, "").slice(0, 58).replace(/[은는이가을를]$/u, "").trim();
      return { title: isMeaningfulLabel(title) ? title : "꿈에서 이어진 중요한 장면", meaning: `${clean} 이 장면이 앞뒤 장면과 어떻게 달라지는지를 중심으로 살펴보는 것이 자연스럽습니다.` };
    }),
    relationshipMeaning: "", objectMeaning: "",
    integratedInterpretation: `이 꿈에서는 개별 단어 하나보다 장면이 이어지는 방향이 중요합니다. ${scenes.join(" ")} ${emotions}\n\n${symbols.length ? `${symbols.join(", ")} 같은 상징은 참고할 수 있지만, 일반적인 뜻보다 꿈에서 실제로 느낀 분위기와 마지막 장면을 우선해야 합니다.` : "꿈에서 직접 묘사한 분위기와 마지막 장면을 우선해 읽는 편이 자연스럽습니다."}\n\n최근 비슷한 감정의 변화나 시야가 달라지는 경험이 있었다면, 그 경험을 돌아보는 참고로 삼아보세요.`,
    realLifeConnections: ["꿈의 시작과 마지막 사이에서 감정이나 행동이 어떻게 달라졌는지 현실의 경험과 연결해 살펴보세요."],
    reflectionQuestions: [], caution: DEFAULT_INTERPRETATION_CAUTION, grounding: [],
  };
}

export function debugAnalysisEnabled() {
  return process.env.NODE_ENV === "development" && process.env.DREAM_DEBUG_ANALYSIS === "true";
}
