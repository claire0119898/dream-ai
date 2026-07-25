import type { DreamInterpretation } from "../types/dream";

export type DreamResultPresentation = {
  summary: string;
  interpretationParagraphs: string[];
  scenes: DreamInterpretation["symbols"];
  emotion: string | null;
  flow: string | null;
  thoughtPoints: string[];
  caution: string;
};

function normalized(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/["'“”‘’.,!?·:;()[\]{}•→]/g, "")
    .toLocaleLowerCase("ko-KR");
}

function uniqueTexts(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalized(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compact(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("?"),
    shortened.lastIndexOf("!")
  );
  return sentenceEnd >= Math.floor(maxLength * 0.55)
    ? shortened.slice(0, sentenceEnd + 1)
    : `${shortened.trimEnd()}…`;
}

function paragraphs(value: string) {
  const parsed = value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (parsed.length <= 3) return parsed;
  return [parsed[0], parsed.slice(1, -1).join(" "), parsed.at(-1) ?? ""].filter(Boolean);
}

function visibleEmotion(interpretation: DreamInterpretation) {
  if (!interpretation.hasExplicitEmotion) return null;
  const lines = uniqueTexts(
    interpretation.emotion
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
  const directEmotion = lines.find((line) => /직접 드러난 감정|직접 표현된 감정/u.test(line));
  const contextualEmotion = [...lines]
    .reverse()
    .find((line) => line !== directEmotion && !/직접 드러난 감정:/u.test(line));
  return compact([directEmotion, contextualEmotion].filter(Boolean).join(" "), 280) || null;
}

function visibleFlow(interpretation: DreamInterpretation) {
  if (!interpretation.hasNarrativeFlow) return null;
  const stages = interpretation.flow
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^(?:시작|변화|마지막):/u.test(line))
    .slice(0, 3);
  if (stages.length < 2) return null;
  return compact(stages.join(" → "), 320);
}

export function buildDreamResultPresentation(
  interpretation: DreamInterpretation
): DreamResultPresentation {
  const questions = uniqueTexts(
    interpretation.reflectionPoints
      .map((point) => point.replace(/^[•\-]\s*/u, "").trim())
      .filter((point) => point.endsWith("?"))
  ).slice(0, 3);

  return {
    summary: compact(interpretation.summary, 180),
    interpretationParagraphs: paragraphs(interpretation.interpretation).slice(0, 3),
    scenes: interpretation.symbols.slice(0, 3).map((symbol) => ({
      name: compact(symbol.name, 80),
      meaning: compact(symbol.meaning, 240),
    })),
    emotion: visibleEmotion(interpretation),
    flow: visibleFlow(interpretation),
    thoughtPoints: questions.length
      ? questions
      : ["이 꿈에서 가장 오래 남은 장면은 무엇이며, 왜 그 부분이 마음에 남았나요?"],
    caution: compact(interpretation.caution, 180),
  };
}

export function countVisibleResultCharacters(result: DreamResultPresentation) {
  return [
    result.summary,
    ...result.interpretationParagraphs,
    ...result.scenes.flatMap((scene) => [scene.name, scene.meaning]),
    result.emotion ?? "",
    result.flow ?? "",
    ...result.thoughtPoints,
    result.caution,
  ].join("").length;
}
