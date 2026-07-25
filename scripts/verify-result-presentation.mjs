import { buildDreamRequestContext } from "../lib/dreamContext.ts";
import {
  createDictionaryInterpretation,
  validateContextualInterpretation,
} from "../lib/dreamInterpretation.ts";
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
  /\b(?:AI|GPT|OpenAI|API|prompt|token|model)\b|인공지능|프롬프트|내포|시사|부각|상징화|심층적\s*의미|최근\s*대화를\s*보면|앱\s*출시|개인\s*사업|전달이\s*한\s*관계에서|한\s*인물의\s*행동|꿈속의\s*인물과\s*상대|처음의\s*관계|중심\s*사건이\s*한\s*장면/iu;
const deterministicFuture =
  /재물이\s*들어옵니다|임신하게\s*됩니다|사고가\s*생깁니다|반드시\s*성공|곧\s*.{0,15}생깁니다|길몽입니다/iu;

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
    name: "친정아버지의 은팔찌",
    dream:
      "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
    type: "single_scene",
    expected: ["친정아버지", "남편", "은팔찌", "차고", "살림", "도움", "애정", "책임"],
    forbiddenForCase: /한\s*인물|상대|처음|변화|마지막|이후\s*흐름/u,
  },
  {
    name: "할머니의 따뜻한 밥그릇",
    dream: "돌아가신 할머니가 제 손에 따뜻한 밥그릇을 쥐여주셨어요.",
    type: "single_scene",
    expected: ["돌아가신 할머니", "손", "따뜻한 밥그릇", "쥐여", "돌봄", "위로", "가족"],
    forbiddenForCase: /죽음.{0,12}(?:예고|발생)|처음의\s*관계|이후\s*흐름/u,
  },
  {
    name: "문을 고치는 남편과 불을 밝히는 어머니",
    dream:
      "남편이 낡은 집의 문을 고치고 있었고 친정엄마가 옆에서 불을 밝혀주고 있었어요.",
    type: "multi_scene",
    expected: ["남편", "문을", "고치", "친정어머니", "불을", "밝", "가정", "지원"],
  },
  {
    name: "시험 종료 뒤의 홀가분함",
    dream:
      "시험장에 늦게 도착했지만 시험은 이미 끝났고, 불안하지 않고 홀가분했습니다.",
    type: "multi_scene",
    expected: ["시험", "늦", "끝", "불안하지", "홀가분", "압박", "해방"],
  },
];

const summaries = cases.map((testCase) => {
  const context = buildDreamRequestContext(testCase.dream, emptyAnalysis, 8);
  const interpretation = createDictionaryInterpretation(emptyAnalysis, context);
  const contextualCandidate = Object.fromEntries(
    Object.entries(interpretation).filter(([key]) => key !== "title"),
  );
  assert(
    validateContextualInterpretation(
      contextualCandidate,
      testCase.dream,
      context,
    ).ok,
    `${testCase.name}: 구체 명사를 보존한 구조화 결과가 품질 검사를 통과해야 합니다.`,
  );
  const result = buildDreamResultPresentation(interpretation);
  const visibleText = [
    result.coreConclusion,
    ...result.keyScenes.flatMap((scene) => [scene.title, scene.meaning]),
    result.relationshipMeaning,
    result.objectMeaning,
    ...result.interpretationParagraphs,
    ...result.realLifeConnections,
    ...result.reflectionQuestions,
    result.caution,
  ].join(" ");

  assert(
    result.coreConclusion.length >= 100 && result.coreConclusion.length <= 180,
    `${testCase.name}: 결론은 100~180자여야 합니다.`,
  );
  assert(
    result.coreConclusion.startsWith("이 꿈"),
    `${testCase.name}: 첫 문장에서 결론을 말해야 합니다.`,
  );
  assert(
    result.dreamType === testCase.type,
    `${testCase.name}: 단일·다중 장면 분기가 잘못됐습니다.`,
  );
  assert(
    result.keyScenes.length >= 2 &&
      result.keyScenes.length <= (testCase.type === "single_scene" ? 3 : 4),
    `${testCase.name}: 핵심 장면 수가 기준과 다릅니다.`,
  );
  assert(
    interpretation.integratedInterpretation.length >= 350 &&
      interpretation.integratedInterpretation.length <= 550,
    `${testCase.name}: 종합 풀이는 350~550자여야 합니다.`,
  );
  assert(
    result.interpretationParagraphs.length === 3,
    `${testCase.name}: 종합 풀이는 3문단이어야 합니다.`,
  );
  assert(
    result.realLifeConnections.length >= 1 &&
      result.realLifeConnections.length <= 2,
    `${testCase.name}: 현실 연결은 1~2개여야 합니다.`,
  );
  assert(
    result.reflectionQuestions.length >= 1 &&
      result.reflectionQuestions.length <= 2 &&
      result.reflectionQuestions.every((question) => question.endsWith("?")),
    `${testCase.name}: 구체적인 질문은 1~2개여야 합니다.`,
  );
  assert(
    testCase.expected.every((term) => visibleText.includes(term)),
    `${testCase.name}: 필수 인물·물건·행동·의미가 빠졌습니다.`,
  );
  assert(
    !forbidden.test(visibleText) &&
      !deterministicFuture.test(visibleText) &&
      !(testCase.forbiddenForCase?.test(visibleText)),
    `${testCase.name}: 추상 문장, 가짜 흐름 또는 미래 단정이 포함됐습니다.`,
  );
  const allSentences = normalizedSentences([
    result.coreConclusion,
    ...result.keyScenes.map((scene) => scene.meaning),
    result.relationshipMeaning,
    result.objectMeaning,
    ...result.interpretationParagraphs,
    ...result.realLifeConnections,
    ...result.reflectionQuestions,
  ]);
  assert(
    new Set(allSentences).size === allSentences.length,
    `${testCase.name}: 동일 문장이 여러 영역에 반복됩니다.`,
  );

  return {
    name: testCase.name,
    dreamType: result.dreamType,
    keyScenes: result.keyScenes.length,
    coreLength: result.coreConclusion.length,
    integratedLength: interpretation.integratedInterpretation.length,
    visibleLength: countVisibleResultCharacters(result),
    paragraphs: result.interpretationParagraphs.length,
  };
});

const averageVisibleLength = Math.round(
  summaries.reduce((sum, item) => sum + item.visibleLength, 0) /
    summaries.length,
);

const abstractDream = cases[0].dream;
const abstractContext = buildDreamRequestContext(
  abstractDream,
  emptyAnalysis,
  8,
);
const abstractCandidate = Object.fromEntries(
  Object.entries(
    createDictionaryInterpretation(emptyAnalysis, abstractContext),
  ).filter(([key]) => key !== "title"),
);
const rejectedAbstract = validateContextualInterpretation(
  {
    ...abstractCandidate,
    relationshipMeaning:
      "한 인물의 행동이 장면의 분위기와 이후 흐름을 이끌고 있습니다. 전달이 한 관계에서 다른 관계로 이어지는 모습을 담고 있습니다.",
  },
  abstractDream,
  abstractContext,
);
assert(
  !rejectedAbstract.ok && rejectedAbstract.code === "quality_rejected",
  "구체 명사를 숨기는 추상 결과는 품질 실패로 처리해야 합니다.",
);

console.log(
  JSON.stringify(
    { cases: summaries, averageVisibleLength, result: "passed" },
    null,
    2,
  ),
);
