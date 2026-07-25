import { buildDreamRequestContext } from "../lib/dreamContext.ts";
import {
  createDictionaryInterpretation,
  DEFAULT_INTERPRETATION_CAUTION,
} from "../lib/dreamInterpretation.ts";
import {
  buildDreamResultPresentation,
  countVisibleResultCharacters,
} from "../lib/dreamPresentation.ts";

const dream =
  "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.";
const emptyAnalysis = {
  summary: "",
  keywords: [],
  emotions: [],
  situations: [],
  interpretation: "",
  advice: "",
  relatedKeywords: [],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sentenceCount(value) {
  return (
    value
      .match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean).length ?? 0
  );
}

function normalizedSentences(values) {
  return values
    .flatMap((value) => value.split(/[.!?。！？\n]+/))
    .map((sentence) =>
      sentence
        .replace(/\s+/g, "")
        .replace(/["'“”‘’.,!?·:;()[\]{}•→]/g, "")
        .toLocaleLowerCase("ko-KR")
    )
    .filter((sentence) => sentence.length >= 16);
}

const context = buildDreamRequestContext(dream, emptyAnalysis, 8);
const interpretation = createDictionaryInterpretation(emptyAnalysis, context);
const result = buildDreamResultPresentation(interpretation);
const visibleCharacters = countVisibleResultCharacters(result);

// 이전 결과 화면은 감정·흐름·현실 연결·생활 참고를 각각 표시했고,
// 종합 풀이에도 감정 부재·고정 안내·질문을 다시 포함했습니다.
const previousVisibleValues = [
  interpretation.summary,
  ...interpretation.symbols.flatMap((symbol) => [symbol.name, symbol.meaning]),
  interpretation.emotion,
  interpretation.flow,
  interpretation.interpretation,
  interpretation.interpretation.split(/\n\s*\n/).at(-1) ?? "",
  "꿈속에서 특별한 기쁨이나 불안은 직접 드러나지 않습니다. 따라서 인물의 마음을 하나로 단정하기보다, 서로의 몫을 나누고 마음을 건네는 장면으로 보는 편이 자연스럽습니다.",
  "이 꿈을 특정 사건의 예고로 단정하기보다, 장면에 담긴 관계와 행동을 현실의 경험과 나란히 놓아보는 정도가 알맞습니다.",
  ...interpretation.reflectionPoints,
  interpretation.guidance,
  DEFAULT_INTERPRETATION_CAUTION,
];
const previousVisibleCharacters = previousVisibleValues.join("").length;
const reductionPercent = Math.round(
  (1 - visibleCharacters / previousVisibleCharacters) * 100
);

assert(result.summary.length >= 120 && result.summary.length <= 180, "요약은 120~180자여야 합니다.");
assert(sentenceCount(result.summary) >= 2 && sentenceCount(result.summary) <= 3, "요약은 2~3문장이어야 합니다.");
assert(
  interpretation.interpretation.length >= 450 &&
    interpretation.interpretation.length <= 700,
  "종합 풀이는 450~700자여야 합니다."
);
assert(
  result.interpretationParagraphs.length >= 2 &&
    result.interpretationParagraphs.length <= 3,
  "종합 풀이는 2~3문단이어야 합니다."
);
assert(result.scenes.length <= 3, "눈여겨볼 장면은 최대 3개여야 합니다.");
assert(
  result.thoughtPoints.length <= 3 &&
    result.thoughtPoints.every((point) => point.endsWith("?")),
  "함께 생각해볼 점은 질문만 최대 3개여야 합니다."
);
assert(result.emotion === null, "직접 표현된 감정이 없는 꿈은 감정 내용을 숨겨야 합니다.");
assert(result.flow === null, "한 장면 꿈은 흐름 내용을 숨겨야 합니다.");
assert(reductionPercent >= 35 && reductionPercent <= 50, "표시 분량은 기존보다 35~50% 줄어야 합니다.");

const visibleSentences = normalizedSentences([
  result.summary,
  ...result.interpretationParagraphs,
  ...result.scenes.map((scene) => scene.meaning),
  ...result.thoughtPoints,
  result.caution,
]);
assert(
  new Set(visibleSentences).size === visibleSentences.length,
  "결과 영역에 동일 문장이 반복되면 안 됩니다."
);

console.log(
  JSON.stringify(
    {
      cards: { before: 8, after: 5 },
      characters: {
        before: previousVisibleCharacters,
        after: visibleCharacters,
        reductionPercent,
      },
      summaryLength: result.summary.length,
      interpretationLength: interpretation.interpretation.length,
      interpretationParagraphs: result.interpretationParagraphs.length,
      notableScenes: result.scenes.length,
      thoughtPoints: result.thoughtPoints.length,
      emotionShown: Boolean(result.emotion),
      flowShown: Boolean(result.flow),
      duplicateSentences: visibleSentences.length - new Set(visibleSentences).size,
    },
    null,
    2
  )
);
