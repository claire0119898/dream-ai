import type { DreamInterpretation } from "../types/dream";

export type DreamResultPresentation = {
  coreConclusion: string;
  dreamType: DreamInterpretation["dreamType"];
  keyScenes: DreamInterpretation["keyScenes"];
  relationshipMeaning: string;
  objectMeaning: string;
  interpretationParagraphs: string[];
  realLifeConnections: string[];
  reflectionQuestions: string[];
  caution: string;
};

function compact(value: string, maxLength: number) {
  const text = value.replace(/\s+/gu, " ").trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("?"),
    shortened.lastIndexOf("!"),
  );
  return sentenceEnd >= Math.floor(maxLength * 0.62)
    ? shortened.slice(0, sentenceEnd + 1)
    : `${shortened.trimEnd()}…`;
}

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value
      .normalize("NFKC")
      .replace(/\s+/gu, "")
      .toLocaleLowerCase("ko-KR");
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function buildDreamResultPresentation(
  interpretation: DreamInterpretation,
): DreamResultPresentation {
  return {
    coreConclusion: compact(interpretation.coreConclusion, 180),
    dreamType: interpretation.dreamType,
    keyScenes: interpretation.keyScenes.slice(0, 4).map((scene) => ({
      title: compact(scene.title, 100),
      meaning: compact(scene.meaning, 280),
    })),
    relationshipMeaning: compact(interpretation.relationshipMeaning, 280),
    objectMeaning: compact(interpretation.objectMeaning, 280),
    interpretationParagraphs: interpretation.integratedInterpretation
      .split(/\n\s*\n/gu)
      .map((paragraph) => paragraph.replace(/\s+/gu, " ").trim())
      .filter(Boolean)
      .slice(0, 3),
    realLifeConnections: unique(
      interpretation.realLifeConnections.slice(0, 2),
    ).map((item) => compact(item, 200)),
    reflectionQuestions: unique(
      interpretation.reflectionQuestions.slice(0, 2),
    ).map((item) => compact(item, 170)),
    caution: compact(interpretation.caution, 180),
  };
}

export function countVisibleResultCharacters(result: DreamResultPresentation) {
  return [
    result.coreConclusion,
    ...result.keyScenes.flatMap((scene) => [scene.title, scene.meaning]),
    result.relationshipMeaning,
    result.objectMeaning,
    ...result.interpretationParagraphs,
    ...result.realLifeConnections,
    ...result.reflectionQuestions,
    result.caution,
  ].join("").length;
}
