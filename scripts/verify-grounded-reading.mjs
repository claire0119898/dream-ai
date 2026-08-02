import { buildDreamRequestContext } from "../lib/dreamContext.ts";
import { buildDreamSceneAnalysis, extractDreamFacts, validateExtractedFacts } from "../lib/dreamFacts.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cases = [
  {
    dream: "108개의 염주알이나 묵주알이 알마다 용이 되어 하늘로 올라가는 꿈",
    verify(scene) {
      assert(scene.objects.some((item) => item.quantity === "108개"), "108개 수량을 보존해야 합니다.");
      assert(scene.transformations.some((item) => /염주알 또는 묵주알/.test(item.from) && item.to === "용" && /각각/.test(item.scope)), "각 구슬이 용으로 변한 범위를 보존해야 합니다.");
      assert(scene.actions.some((item) => item.subject === "용" && item.action === "올라가다"), "하늘로 올라간 주체는 용이어야 합니다.");
    },
  },
  {
    dream: "집 안에 물이 차오르는데 이상하게 무섭지 않고 물고기들이 헤엄쳤다",
    verify(scene) {
      assert(scene.actions.some((item) => item.subject === "물" && item.action === "차오르다"), "집 안에 물이 차오른 사실을 읽어야 합니다.");
      assert(scene.actions.some((item) => item.subject === "물고기" && item.action === "헤엄치다"), "물고기가 헤엄친 사실을 읽어야 합니다.");
      assert(scene.emotionsExplicitlyMentioned.includes("무섭지 않음"), "무섭지 않았다는 명시 감정을 보존해야 합니다.");
    },
  },
  {
    dream: "친구가 뱀으로 변해서 나를 바라봤다",
    verify(scene) {
      assert(scene.transformations.some((item) => item.from === "친구" && item.to === "뱀"), "친구가 뱀으로 변한 방향을 보존해야 합니다.");
      assert(scene.actions.some((item) => item.subject === "뱀" && item.action === "바라보다"), "바라본 주체는 변한 뱀이어야 합니다.");
    },
  },
  {
    dream: "이가 하나 빠졌는데 피는 나지 않았다",
    verify(scene) {
      assert(scene.objects.some((item) => item.name === "이" && item.quantity === "한 개"), "빠진 이는 한 개여야 합니다.");
      assert(scene.actions.some((item) => item.subject === "이" && item.action === "빠지다"), "이가 빠진 행동을 보존해야 합니다.");
    },
  },
  {
    dream: "정확히 기억나지 않지만 큰 새 같은 것이 날아갔다",
    verify(scene) {
      assert(scene.uncertainElements.some((item) => /새인지는 확정할 수 없/.test(item)), "대상을 새로 확정하지 않아야 합니다.");
      assert(scene.actions.some((item) => item.target === "새 같은 것"), "불확실한 비행 대상을 그대로 보존해야 합니다.");
    },
  },
];

const emptyAnalysis = {
  summary: "", keywords: [], emotions: [], situations: [],
  interpretation: "", advice: "", relatedKeywords: [],
};

for (const testCase of cases) {
  const context = buildDreamRequestContext(testCase.dream, emptyAnalysis, 8);
  const facts = extractDreamFacts(testCase.dream, context);
  const factValidation = validateExtractedFacts(testCase.dream, facts);
  assert(factValidation.ok, `${testCase.dream}: 추출 사실 검증 실패 (${factValidation.issue ?? "unknown"})`);
  const scene = buildDreamSceneAnalysis(testCase.dream, facts);
  testCase.verify(scene);
}

console.log(`구조화 장면·최종 해석 입력 검증: ${cases.length}/${cases.length} 통과`);
