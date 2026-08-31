import { isMeaningfulLabel, validateReading, validateUnderstanding } from "../lib/dreamSemantic.ts";

function assert(condition, message) { if (!condition) throw new Error(message); }

const dreams = [
  "작정하고 지은 실내 온천이었다. 미로 구조였고 한 방향으로 물살을 따라 둥둥 떠가게 되어있었다. 고급진 조명과 통로 옆 장식품만으로도 눈이 즐거워 갤러리에 온 건 지 물놀이를 하러 온 건지 구분이 안갔다. 그러다가 불시에 탁 트인 야외 온천으로 연결되었다. 환하고 따사로운 햇볕에 물이 은빛 보석처럼 반짝거렸다. 개방감에 아름다움에 예고 없이 야외가 펼쳐진 거에 행복에 젖어 미친듯이 발을 구르며 헤엄쳤다. 물은 맑았고 투명했다.",
  "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
  "108개의 염주알이나 묵주알이 알마다 용이 되어 하늘로 올라가는 꿈",
  "시험에 늦었지만 이상하게 불안하지 않았고 오히려 홀가분했다.",
  "넓은 들판에 비가 내리고 마지막에 무지개가 나타났다.",
  "돌아가신 할머니가 밥은 먹었니?라고 말하셨다.",
  "개에게 쫓기다가 마지막에 개가 꼬리를 흔들었다.",
  "좁은 방의 문을 열었더니 바다가 펼쳐졌다.",
  "아들이 신던 작은 신발을 모르는 아이에게 주었는데 아깝지 않았다.",
  "물이 차올랐지만 무섭지 않았고 오히려 편안했다.",
];

for (const dream of dreams) {
  const first = dream.split(/(?<=[.!?])/u).map((item) => item.trim()).find((item) => item.length >= 2) ?? dream;
  const last = dream.split(/(?<=[.!?])/u).map((item) => item.trim()).filter(Boolean).at(-1) ?? dream;
  const understanding = validateUnderstanding({
    summaryOfDream: dream.slice(0, 180),
    settings: [],
    scenes: [
      { order: 1, description: first, emotion: null, evidence: first.replace(/[.!?]+$/u, "") },
      ...(last !== first ? [{ order: 2, description: last, emotion: null, evidence: last.replace(/[.!?]+$/u, "") }] : []),
    ],
    importantSymbols: ["꿈의 시작", "마지막 장면"], transitions: [],
    emotionalArc: { beginning: null, middle: null, ending: null },
    agencyArc: { beginning: null, ending: null, change: null },
    ending: last, ambiguities: [], needsClarification: false, clarificationQuestion: null,
  }, dream);
  assert(understanding, `의미 분석 구조가 원문 근거 검사를 통과해야 합니다: ${dream.slice(0, 25)}`);
  const reading = validateReading({
    title: "장면의 흐름이 보여주는 꿈", overallInterpretation: "이 꿈은 처음부터 마지막까지 이어지는 변화와 직접 느낀 감정이 뜻을 결정하는 전환의 꿈입니다. 시작의 상태보다 결말에 남은 감정과 행동에 더 큰 무게가 있으며, 그 방향이 현재 마음이 원하는 움직임을 보여줍니다.", flowAssessment: "전환 · 정리",
    symbols: [
      { symbol: "꿈에서 처음 펼쳐진 장면", generalMeaning: "시작 장면은 꿈이 출발한 마음의 상태와 익숙한 조건을 나타냅니다.", meaningInThisDream: "이 꿈에서는 이후 무엇이 달라지는지를 보여주는 기준점이 되어 변화의 크기를 분명하게 만듭니다.", connectedMeaning: "마지막 장면과 대비되면서 꿈이 어느 방향으로 이동했는지를 보여줍니다.", sourceSceneOrders: [1] },
      { symbol: "마지막에 남은 중요한 장면", generalMeaning: "꿈의 결말은 감정과 움직임이 최종적으로 도착한 방향을 상징합니다.", meaningInThisDream: "마지막 모습에 남은 감정이 전체 상징의 긍정적이거나 긴장된 뜻을 결정합니다.", connectedMeaning: "시작과의 차이를 통해 지금 마음이 정리하거나 향하려는 방향을 드러냅니다.", sourceSceneOrders: [understanding.scenes.length] },
    ],
    integratedInterpretation: "이 꿈은 처음 장면에서 시작해 마지막 장면으로 이동하는 흐름을 보여줍니다. 각각의 상징을 따로 떼기보다 앞뒤 장면의 차이를 함께 보는 편이 자연스럽습니다.\n\n직접 표현된 감정이 있다면 일반적인 상징 사전보다 그 감정을 먼저 보아야 합니다. 같은 장소나 대상도 꿈속에서 편안했는지 두려웠는지에 따라 의미가 달라집니다.\n\n마지막 장면은 꿈의 방향이 어디로 향했는지를 보여줍니다. 최근 비슷한 감정의 변화나 선택이 있었다면 그 경험을 돌아보는 참고로 삼을 수 있습니다.",
    traditionalInterpretation: "전통적인 해몽에서는 시작보다 마지막 장면의 밝기와 움직임을 중심으로 기운의 방향을 읽습니다. 다만 이는 상징적인 풀이이며 실제 미래 사건을 확정하지 않습니다.",
    psychologicalInterpretation: "심리적으로는 시작과 마지막 사이의 감정 변화가 현재 마음이 벗어나고 싶은 상태와 향하고 싶은 상태를 보여주는 경우가 있습니다. 구체적인 현실 문제를 단정하지 않고 가능성으로 읽습니다.",
    fortuneFlow: "좋고 나쁨을 단정하기보다 전환의 성격이 강한 꿈입니다. 마지막 감정이 편안하고 능동적이면 회복 쪽으로, 두렵고 막혀 있으면 주의 쪽으로 읽습니다.",
    oneSentenceSummary: "시작과 결말 사이의 감정과 행동 변화가 지금 마음이 향하는 방향을 보여주는 꿈입니다.",
    disclaimer: "꿈풀이는 미래의 사건을 확정하는 판단이 아니라, 최근의 감정과 경험을 돌아보기 위한 참고 정보입니다.",
    groundingChecks: { noInventedPeoplePlacesActions: true, sequencePreserved: true, explicitEmotionsPreserved: true, endingPreserved: true },
  }, understanding);
  assert(reading, "최종 해석 구조와 grounding 검사가 통과해야 합니다.");
}

for (const invalid of ["이", "것", "물살을 변하는 행동", "상태"]) assert(!isMeaningfulLabel(invalid), `의미 없는 제목을 거부해야 합니다: ${invalid}`);
console.log(`의미 이해 파이프라인 검증: ${dreams.length}/${dreams.length} 통과`);
