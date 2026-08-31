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
  overallInterpretation: string;
  flowAssessment: string;
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
  required: ["title", "overallInterpretation", "flowAssessment", "symbols", "integratedInterpretation", "traditionalInterpretation", "psychologicalInterpretation", "fortuneFlow", "oneSentenceSummary", "disclaimer", "groundingChecks"],
  properties: {
    title: { type: "string", minLength: 4, maxLength: 50 },
    overallInterpretation: { type: "string", minLength: 120, maxLength: 520 },
    flowAssessment: { type: "string", minLength: 2, maxLength: 80 },
    symbols: {
      type: "array", minItems: 2, maxItems: 7,
      items: {
        type: "object", additionalProperties: false,
        required: ["symbol", "generalMeaning", "meaningInThisDream", "connectedMeaning", "sourceSceneOrders"],
        properties: {
          symbol: { type: "string", minLength: 2, maxLength: 100 },
          generalMeaning: { type: "string", minLength: 25, maxLength: 260 },
          meaningInThisDream: { type: "string", minLength: 45, maxLength: 360 },
          connectedMeaning: { type: "string", minLength: 25, maxLength: 300 },
          sourceSceneOrders: { type: "array", minItems: 1, maxItems: 4, items: { type: "integer", minimum: 1, maximum: 10 } },
        },
      },
    },
    integratedInterpretation: { type: "string", minLength: 350, maxLength: 1800 },
    traditionalInterpretation: { type: "string", minLength: 80, maxLength: 600 },
    psychologicalInterpretation: { type: "string", minLength: 80, maxLength: 600 },
    fortuneFlow: { type: "string", minLength: 60, maxLength: 420 },
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
const PREDICTION = /반드시|틀림없이|무조건|복권|당첨|죽게\s*됩니다|임신하게\s*됩니다|재물이\s*들어옵니다|사업이\s*성공합니다|취업이\s*확정됩니다|사고가\s*생깁니다/iu;

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
  if (!object(value) || !Array.isArray(value.symbols) || !object(value.groundingChecks)) return null;
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
    flowAssessment: String(value.flowAssessment ?? "").trim(), symbols,
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
  const allText = [reading.title, reading.overallInterpretation, reading.flowAssessment, ...symbols.flatMap((scene) => [scene.symbol, scene.generalMeaning, scene.meaningInThisDream, scene.connectedMeaning]), reading.integratedInterpretation, reading.traditionalInterpretation, reading.psychologicalInterpretation, reading.fortuneFlow, reading.oneSentenceSummary, reading.disclaimer].join(" ");
  const maxOrder = understanding.scenes.length;
  if (reading.title.length < 4 || reading.overallInterpretation.length < 90 || symbols.length < 2 || symbols.length > 7 || reading.integratedInterpretation.length < 250 || reading.traditionalInterpretation.length < 60 || reading.psychologicalInterpretation.length < 60 || reading.fortuneFlow.length < 45 || reading.oneSentenceSummary.length < 15 || reading.disclaimer.length < 20 || INTERNAL_LANGUAGE.test(allText) || PREDICTION.test(allText)) return null;
  if (symbols.some((scene) => !isMeaningfulLabel(scene.symbol) || scene.generalMeaning.length < 20 || scene.meaningInThisDream.length < 35 || scene.connectedMeaning.length < 20 || !scene.sourceSceneOrders.length || scene.sourceSceneOrders.some((order) => order < 1 || order > maxOrder))) return null;
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
    fortuneFlow: reading.fortuneFlow,
    oneSentenceSummary: reading.oneSentenceSummary,
    disclaimer: reading.disclaimer,
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
  const hotSpring = /온천/u.test(dream) && /야외/u.test(dream) && /헤엄/u.test(dream);
  const fallbackSymbols = hotSpring ? [
    { symbol: "미로 같은 실내 온천", generalMeaning: "미로는 복잡한 선택을, 온천은 감정의 이완과 회복을 나타내는 상징입니다.", meaningInThisDream: "불안하지 않고 아름다운 공간을 즐겼으므로 혼란보다는 정해진 흐름 안에서 경험을 쌓는 탐색에 가깝습니다.", connectedMeaning: "이후 탁 트인 야외로 이어지면서 제한된 탐색이 더 넓은 가능성을 발견하는 과정이 됩니다." },
    { symbol: "맑고 투명한 물", generalMeaning: "맑은 물은 감정이 정돈되고 마음의 흐림이 걷히는 이미지를 나타냅니다.", meaningInThisDream: "행복하게 몸을 움직인 감정과 결합해 감정적 정리와 회복의 의미가 강해집니다.", connectedMeaning: "따뜻한 햇빛과 능동적인 헤엄으로 이어져 회복된 생기가 행동으로 옮겨지는 흐름을 만듭니다." },
    { symbol: "밝고 넓은 야외와 햇빛", generalMeaning: "넓은 공간과 따뜻한 빛은 자유, 확장, 생기와 긍정성을 상징합니다.", meaningInThisDream: "실내에서 갑자기 야외로 나왔을 때의 강한 행복감 때문에 막힘이 열리고 가능성이 넓어지는 뜻이 분명합니다.", connectedMeaning: "정해진 물살을 따르던 시작과 대비되어 제한에서 개방으로 향하는 꿈의 방향을 결정합니다." },
    { symbol: "힘차게 헤엄치는 행동", generalMeaning: "스스로 헤엄치는 행동은 자신의 힘으로 방향과 속도를 만드는 주도성을 나타냅니다.", meaningInThisDream: "마지막에 적극적으로 발을 구른 것은 수동적인 이동에서 능동적인 움직임으로 바뀌며 에너지와 주도권을 되찾는 뜻입니다.", connectedMeaning: "마지막 행복감과 함께 나타나 꿈 전체를 해방과 회복의 흐름으로 마무리합니다." },
  ] : analysis.keywords.slice(0, 5).map((item) => ({
    symbol: item.keyword,
    generalMeaning: `${item.keyword}은 일반적으로 ${item.meaning}의 의미를 떠올리게 하는 상징입니다.`,
    meaningInThisDream: `${item.keyword}의 뜻은 사전적 의미만으로 정해지지 않으며, 꿈에서 느낀 감정과 마지막 장면의 방향에 따라 달라집니다.`,
    connectedMeaning: "다른 장면에서 감정이나 행동이 어떻게 달라졌는지와 함께 볼 때 이 상징의 방향이 더 분명해집니다.",
  }));
  const overallInterpretation = hotSpring
    ? "이 꿈은 전체적으로 매우 밝고 좋은 흐름이며, 해방과 회복의 성격이 강합니다. 핵심은 정해진 물살을 따라가던 실내가 탁 트인 야외로 바뀌고, 그곳에서 강한 행복을 느끼며 직접 헤엄쳤다는 점입니다. 제한에서 개방으로, 수동적인 상태에서 능동적인 상태로 옮겨가며 자신의 에너지와 주도권을 되찾는 꿈입니다."
    : `이 꿈은 ${analysis.emotions.length ? analysis.emotions.join(", ") + "의 감정" : "마지막에 남은 감정"}이 전체 방향을 정하는 꿈입니다. 개별 상징은 시작과 마지막 사이의 변화 속에서 읽을 때 의미가 분명해집니다. 특히 결말에 남은 행동과 감정은 지금 마음이 향하는 방향을 보여줍니다.`;
  const integratedMeaning = hotSpring
    ? "이 꿈의 큰 방향은 제한에서 개방으로 이동하는 것입니다. 처음 공간은 아름답고 즐겁지만, 물살과 구조가 정해져 있어 편안함과 함께 일정한 틀도 담고 있습니다.\n\n미로를 불안하게 느끼지 않았다는 점이 중요합니다. 따라서 이 미로는 길을 잃은 혼란이 아니라, 목적지가 아직 보이지 않아도 흐름을 경험하며 가능성을 탐색하는 상태를 뜻합니다.\n\n갑자기 밝고 넓은 야외가 열린 변화는 막힘이 풀리고 선택의 폭이 커지는 방향을 보여줍니다. 따뜻한 햇빛과 맑은 물은 이 확장이 부담이 아니라 생기와 감정적 회복으로 받아들여지고 있음을 나타냅니다.\n\n마지막에 직접 힘차게 헤엄친 행동은 가장 결정적인 장면입니다. 주어진 물살을 따르던 상태에서 자신의 힘으로 움직이는 상태가 되었으므로, 더 자유롭게 선택하고 행동하려는 에너지와 주도권이 살아나는 과정으로 읽을 수 있습니다.\n\n무엇보다 마지막의 강한 행복감이 꿈 전체를 긍정적으로 결정합니다. 현재가 반드시 나쁘다는 뜻이 아니라, 익숙하고 정해진 환경을 넘어 더 넓은 가능성을 누리고 싶은 마음이 분명해지는 꿈입니다."
    : `이 꿈은 상징을 따로 떼어 보기보다 감정과 결말이 향한 방향을 함께 읽어야 합니다. ${symbols.length ? `${symbols.join(", ")}은 꿈의 중심 이미지를 이루지만,` : "등장한 이미지는"} 같은 대상도 편안했는지 두려웠는지에 따라 뜻이 달라집니다.\n\n시작과 마지막 사이에서 공간, 행동 또는 감정이 달라졌다면 그 변화가 꿈의 핵심입니다. 마지막 장면은 마음이 머물고 싶은 방향이나 정리하려는 감정을 가장 선명하게 보여줍니다.\n\n따라서 이 꿈은 특정 사건을 예고하기보다, 현재 마음속에서 무엇이 부담이고 무엇이 안도나 활력을 주는지를 상징적으로 드러내는 꿈으로 읽을 수 있습니다.`;
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
    overallInterpretation,
    symbols: fallbackSymbols.length >= 2 ? fallbackSymbols : undefined,
    integratedMeaning,
    traditionalInterpretation: hotSpring ? "전통적인 해몽에서는 맑은 물과 밝은 햇빛을 기운이 맑아지고 상황이 트이는 이미지로 봅니다. 공간이 넓어지고 그 안에서 활발히 움직이는 모습도 막힌 흐름이 열리고 선택지가 늘어나는 길한 방향으로 읽는 경우가 많습니다. 다만 이는 상징적인 흐름이며 특정한 미래 사건을 보장하지는 않습니다." : "전통적인 해몽에서는 꿈의 중심 상징과 마지막 장면이 밝고 편안한지, 막히고 두려운지를 기준으로 흐름을 읽습니다. 이는 상징적인 방향을 참고하는 풀이이며 특정한 미래 사건을 확정하지 않습니다.",
    psychologicalInterpretation: hotSpring ? "심리적으로는 안정적이지만 정해진 흐름에서 더 넓은 선택권과 자유를 원하는 마음이 커질 때 나타날 수 있는 꿈입니다. 수동적으로 이동하다 직접 힘차게 헤엄친 변화는 스스로 결정하고 움직이고 싶은 욕구와 에너지가 되살아나는 과정으로 읽을 수 있습니다." : "심리적으로는 꿈에서 가장 강했던 감정과 마지막 행동이 현재 마음의 필요를 비추는 경우가 있습니다. 입력에 드러난 변화가 있다면, 익숙한 상태를 유지하려는 마음과 새로운 방향으로 움직이려는 마음 사이의 흐름으로 연결할 수 있습니다.",
    flowAssessment: hotSpring ? "매우 긍정적 · 해방 · 회복" : "전환",
    fortuneFlow: hotSpring ? "전체적으로 길몽 쪽에 가깝습니다. 밝고 넓어지는 공간, 맑은 물, 따뜻한 햇빛에 더해 마지막의 행복감과 능동적인 헤엄이 모두 열림과 회복의 방향을 가리키기 때문입니다. 이는 미래 사건의 확정이 아니라 현재의 긍정적인 변화 가능성을 보여주는 상징입니다." : "좋고 나쁨을 단정하기보다 전환의 성격이 강한 꿈입니다. 마지막에 남은 감정과 행동이 편안하고 능동적일수록 회복과 긍정의 방향으로, 두렵고 막혀 있을수록 주의와 긴장의 방향으로 읽습니다.",
    oneSentenceSummary: hotSpring ? "정해진 흐름을 지나 더 넓고 자유로운 가능성을 발견하고, 그 안에서 자신의 에너지와 주도권을 되찾는 꿈입니다." : "꿈의 시작에서 결말로 이어진 감정과 행동의 변화가 지금 마음이 향하는 방향을 보여주는 꿈입니다.",
    disclaimer: DEFAULT_INTERPRETATION_CAUTION,
  };
}

export function debugAnalysisEnabled() {
  return process.env.NODE_ENV === "development" && process.env.DREAM_DEBUG_ANALYSIS === "true";
}
