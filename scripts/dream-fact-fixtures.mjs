import { buildDreamRequestContext } from "../lib/dreamContext.ts";
import { extractDreamFacts } from "../lib/dreamFacts.ts";

export const emptyAnalysis = {
  summary: "",
  keywords: [],
  emotions: [],
  situations: [],
  interpretation: "",
  advice: "",
  relatedKeywords: [],
};

export const factCases = [
  {
    id: "transformation_quantity",
    input: "108개의 염주알이 하나씩 용으로 변해서 하늘로 올라갔습니다.",
  },
  {
    id: "ownership_transfer",
    input:
      "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
  },
  {
    id: "separate_roles",
    input:
      "남편이 낡은 집의 문을 고치고 친정엄마는 옆에서 불을 밝혀주고 있었습니다.",
  },
  {
    id: "transformation_emotion",
    input:
      "창문 밖에서 울던 고양이에게 문을 열어주자 새로 변해 날아갔고, 저는 안심했습니다.",
  },
  {
    id: "ambiguous_transformation",
    input: "염주알이 용이 하늘을 되어 올라갔어요.",
  },
  {
    id: "quantity_attachment",
    input: "팔찌에 달린 12개의 구슬 중 하나만 깨졌습니다.",
  },
  {
    id: "negated_emotion",
    input: "시험에 늦었지만 전혀 불안하지 않았습니다.",
  },
  {
    id: "omitted_subject",
    input: "문을 열어주자 새가 날아갔습니다.",
  },
  {
    id: "exam_release_ending",
    input:
      "시험장에 늦었는데 시험지는 이미 제출되어 있었고 불안하지 않고 홀가분했습니다. 시험장을 나오자 비가 그치고 햇빛이 비쳤습니다.",
  },
];

export function factsFor(testCase, confirmedKey) {
  const context = buildDreamRequestContext(
    testCase.input,
    emptyAnalysis,
    8,
  );
  return {
    context,
    facts: extractDreamFacts(testCase.input, context, confirmedKey),
  };
}

export function safeFailure(caseId, errorType, expected, actual, field) {
  return {
    caseId,
    errorType,
    expected,
    actual,
    field,
  };
}

export function printSafeFailures(failures) {
  for (const failure of failures) {
    console.error(JSON.stringify(failure));
  }
}
