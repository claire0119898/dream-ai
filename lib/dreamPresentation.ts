import type { DreamInterpretation } from "../types/dream";

export type DreamResultPresentation = {
  notice: string;
  coreMeaning: string;
  keyScenes: DreamInterpretation["keyScenes"];
  overallDirection: string;
  interpretationParagraphs: string[];
  realLifeConnections: string[];
  reflectionQuestion: string;
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

function unique<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = key(value)
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
  const keyScenes = unique(
    interpretation.keyScenes.slice(0, 4),
    (scene) => `${scene.title}:${scene.evidence}`,
  ).map((scene) => ({
    title: compact(scene.title, 80),
    evidence: compact(scene.evidence, 180),
    generalMeaning: compact(scene.generalMeaning, 200),
    specificMeaning: compact(scene.specificMeaning, 350),
    connection: compact(scene.connection, 200),
  }));

  return {
    notice: compact(interpretation.notice, 240),
    coreMeaning: compact(interpretation.coreMeaning, 220),
    keyScenes,
    overallDirection: compact(interpretation.overallDirection, 120),
    interpretationParagraphs: interpretation.integratedInterpretation
      .split(/\n\s*\n/gu)
      .map((paragraph) => paragraph.replace(/\s+/gu, " ").trim())
      .filter(Boolean)
      .slice(0, 4),
    realLifeConnections: unique(
      interpretation.realLifeConnections.slice(0, 3),
      (item) => item,
    ).map((item) => compact(item, 190)),
    reflectionQuestion: compact(interpretation.reflectionQuestion, 150),
    caution: compact(interpretation.caution, 180),
  };
}

export function countVisibleResultCharacters(result: DreamResultPresentation) {
  return [
    result.notice,
    result.coreMeaning,
    ...result.keyScenes.flatMap((scene) => [
      scene.title,
      scene.generalMeaning,
      scene.specificMeaning,
      scene.connection,
    ]),
    result.overallDirection,
    ...result.interpretationParagraphs,
    ...result.realLifeConnections,
    result.reflectionQuestion,
    result.caution,
  ].join("").length;
}
