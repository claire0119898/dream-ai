import { buildDreamRequestContext } from "../lib/dreamContext.ts";
import { createDictionaryInterpretation } from "../lib/dreamInterpretation.ts";
import {
  buildDreamResultPresentation,
  countVisibleResultCharacters,
} from "../lib/dreamPresentation.ts";

const emptyAnalysis = {
  summary: "",
  keywords: [],
  emotions: [],
  situations: [],
  interpretation: "",
  advice: "",
  relatedKeywords: [],
};

const forbidden =
  /\b(?:AI|GPT|OpenAI|API|prompt|token|model)\b|인공지능|프롬프트|내포|시사|부각|상징화|심층적\s*의미|최근\s*대화를\s*보면|앱\s*출시|개인\s*사업/iu;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedSentences(values) {
  return values
    .flatMap((value) => value.split(/[.!?。！？\n]+/u))
    .map((sentence) =>
      sentence
        .replace(/\s+/gu, "")
        .replace(/["'“”‘’.,!?·:;()[\]{}•→]/gu, "")
        .toLocaleLowerCase("ko-KR"),
    )
    .filter((sentence) => sentence.length >= 16);
}

const cases = [
  {
    name: "움직이는 거대한 건물",
    dream:
      "가족들과 잔디밭에 누워 하늘을 보고 있었는데, 하늘에 닿을 만큼 높은 건물이 보였습니다. 그런데 그 건물이 갑자기 두 발로 일어나 우리 앞을 천천히 걸어 지나갔습니다. 너무 크고 선명해서 계속 바라봤습니다.",
    expected: ["높은 건물", "가족", "누워", "두 발", "걸어", "바라"],
  },
  {
    name: "가족 사이의 은팔찌 전달",
    dream:
      "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
    expected: ["친정아버지", "남편", "은팔찌", "살림", "책임", "애정"],
  },
  {
    name: "시험 종료 뒤의 해방",
    dream:
      "시험장에 늦게 도착했는데 시험지는 이미 제출되어 있었습니다. 그런데 불안하지 않았고 오히려 홀가분했습니다. 밖으로 나오자 비가 그치고 햇빛이 비쳤습니다.",
    expected: ["늦", "시험", "불안하지", "홀가분", "비가 그치", "햇빛"],
  },
  {
    name: "문을 열어준 뒤의 변화",
    dream:
      "고양이가 창문 밖에서 계속 울고 있었는데 문을 열어주자 새로 변해 날아갔습니다. 처음에는 걱정했지만 마지막에는 마음이 놓였습니다.",
    expected: ["고양이", "창문", "문을 열", "새로 변", "날아", "걱정"],
  },
];

const summaries = cases.map((testCase) => {
  const context = buildDreamRequestContext(
    testCase.dream,
    emptyAnalysis,
    8,
  );
  const interpretation = createDictionaryInterpretation(emptyAnalysis, context);
  const result = buildDreamResultPresentation(interpretation);
  const visibleText = [
    result.coreMeaning,
    ...result.keyScenes.flatMap((scene) => [
      scene.title,
      scene.evidence,
      scene.generalMeaning,
      scene.specificMeaning,
      scene.connection,
    ]),
    result.overallDirection,
    ...result.interpretationParagraphs,
    ...result.realLifeConnections,
    result.reflectionQuestion,
    result.caution,
  ].join(" ");

  assert(
    result.coreMeaning.length >= 120 && result.coreMeaning.length <= 220,
    `${testCase.name}: 핵심 의미는 120~220자여야 합니다.`,
  );
  assert(
    result.keyScenes.length >= 2 && result.keyScenes.length <= 4,
    `${testCase.name}: 핵심 장면은 2~4개여야 합니다.`,
  );
  assert(
    result.keyScenes.every((scene) => scene.specificMeaning.length >= 100),
    `${testCase.name}: 각 장면은 이 꿈에서 특별한 이유를 100자 이상 설명해야 합니다.`,
  );
  assert(
    interpretation.integratedInterpretation.length >= 500 &&
      interpretation.integratedInterpretation.length <= 850,
    `${testCase.name}: 종합 풀이는 500~850자여야 합니다.`,
  );
  assert(
    result.interpretationParagraphs.length >= 3 &&
      result.interpretationParagraphs.length <= 4,
    `${testCase.name}: 종합 풀이는 3~4문단이어야 합니다.`,
  );
  assert(
    result.realLifeConnections.length >= 2 &&
      result.realLifeConnections.length <= 3,
    `${testCase.name}: 현실 연결은 2~3개여야 합니다.`,
  );
  assert(
    result.reflectionQuestion.endsWith("?"),
    `${testCase.name}: 생각해볼 질문은 하나의 질문이어야 합니다.`,
  );
  assert(
    testCase.expected.every((term) => visibleText.includes(term)),
    `${testCase.name}: 필수 장면 또는 의미가 빠졌습니다.`,
  );
  assert(
    !forbidden.test(visibleText),
    `${testCase.name}: 기술 용어, 어려운 보고서 문체 또는 추측한 개인정보가 포함됐습니다.`,
  );
  const sentences = normalizedSentences([
    result.coreMeaning,
    ...result.keyScenes.flatMap((scene) => [
      scene.generalMeaning,
      scene.specificMeaning,
      scene.connection,
    ]),
    ...result.interpretationParagraphs,
    ...result.realLifeConnections,
    result.reflectionQuestion,
  ]);
  assert(
    new Set(sentences).size === sentences.length,
    `${testCase.name}: 동일 문장이 여러 영역에 반복됩니다.`,
  );
  return {
    name: testCase.name,
    keyScenes: result.keyScenes.length,
    coreLength: result.coreMeaning.length,
    integratedLength: interpretation.integratedInterpretation.length,
    visibleLength: countVisibleResultCharacters(result),
    paragraphs: result.interpretationParagraphs.length,
  };
});

const averageVisibleLength = Math.round(
  summaries.reduce((sum, item) => sum + item.visibleLength, 0) /
    summaries.length,
);

console.log(
  JSON.stringify(
    {
      cases: summaries,
      averageVisibleLength,
      result: "passed",
    },
    null,
    2,
  ),
);
