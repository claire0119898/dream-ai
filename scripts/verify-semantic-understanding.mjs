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
  const candidate = {
    title: "장면의 흐름이 보여주는 꿈", overallInterpretation: "이 꿈은 전체적으로 시작의 상태를 지나 새로운 감정적 결론에 도착하는 전환의 꿈입니다. 처음의 모습은 현재 마음이 출발한 조건을 보여주지만, 꿈의 뜻은 그 장면 자체보다 이후 무엇이 달라졌는지에서 더 선명해집니다. 특히 마지막에 남은 감정과 행동은 일반적인 상징 사전보다 큰 무게를 가지며, 지금 마음이 벗어나고 싶은 상태와 향하고 싶은 방향을 함께 드러냅니다. 따라서 이 꿈은 특정 사건을 알리는 예언이라기보다, 마음속 변화가 어느 방향으로 진행되고 있는지를 보여주는 이야기로 읽는 것이 자연스럽습니다.", flowAssessment: "전환 · 정리", keyTransitions: [],
    symbols: [
      { symbol: "꿈에서 처음 펼쳐진 장면", generalMeaning: "시작 장면은 꿈이 출발한 마음의 상태와 익숙한 조건, 아직 변화가 일어나기 전의 기준점을 나타냅니다.", meaningInThisDream: "이 꿈에서는 처음의 모습이 단순한 배경에 머물지 않습니다. 이후 무엇이 달라지는지를 비교하게 만드는 기준점이 되어 감정과 행동의 변화 폭을 분명하게 보여줍니다. 따라서 시작 장면의 의미는 그 자체의 길흉보다 결말과 얼마나 달라졌는지를 통해 결정됩니다.", connectedMeaning: "마지막 장면과 나란히 놓으면 꿈이 머물러 있던 상태에서 어느 방향으로 이동했는지 드러납니다. 이 연결이 개별 대상보다 꿈 전체의 의미를 더 강하게 결정합니다.", sourceSceneOrders: [1] },
      { symbol: "마지막에 남은 중요한 장면", generalMeaning: "꿈의 결말은 감정과 움직임이 최종적으로 도착한 방향을 보여주며 전체 해석의 무게중심이 되는 경우가 많습니다.", meaningInThisDream: "이 꿈에서는 마지막 모습에 남은 감정이 앞선 장면들의 뜻을 다시 정리합니다. 같은 상징도 마지막에 편안함이 남았다면 회복과 수용으로, 두려움이 남았다면 긴장과 주의로 읽힐 수 있습니다. 그래서 결말은 단순한 마지막 사건이 아니라 꿈이 내린 감정적 결론입니다.", connectedMeaning: "시작 장면에서 보였던 조건과 대비하면서 지금 마음이 정리하려는 것과 새롭게 향하려는 방향을 함께 드러냅니다. 앞 장면의 의미도 이 결말을 기준으로 다시 읽게 됩니다.", sourceSceneOrders: [understanding.scenes.length] },
      { symbol: "꿈속에서 직접 느낀 감정", generalMeaning: "꿈에서 직접 느낀 감정은 같은 대상이라도 의미를 긍정과 긴장으로 갈라놓는 가장 중요한 해석 기준입니다.", meaningInThisDream: "이 꿈의 감정은 상징에 붙어 있는 일반적인 뜻을 그대로 적용하지 않게 해줍니다. 편안함과 안도는 받아들임과 회복을, 공포와 압박은 해결되지 않은 부담을 강조합니다. 감정이 분명하지 않은 경우에는 마지막 행동이 편안했는지 막혀 있었는지를 대신 살피게 됩니다.", connectedMeaning: "처음의 분위기와 마지막 반응을 이어 주면서 꿈의 변화가 실제로 반가운 것인지 부담스러운 것인지 판단하게 합니다. 결국 감정은 시작과 결말 사이의 모든 상징을 한 방향으로 묶어 줍니다.", sourceSceneOrders: [understanding.scenes.length] },
    ],
    integratedInterpretation: "이 꿈은 처음 장면에 머무는 이야기가 아니라, 그 상태를 통과해 마지막 감정에 도착하는 과정을 보여줍니다. 출발점은 익숙한 조건이나 현재의 마음을 나타내고, 이후 장면은 그 조건이 어떻게 달라지고 있는지를 드러냅니다. 따라서 개별 대상을 따로 떼어 길흉을 붙이기보다 시작과 결말 사이의 거리부터 읽어야 합니다.\n\n꿈에서 직접 느낀 감정은 해석의 방향을 정하는 중심축입니다. 같은 물이나 문, 동물도 편안하게 느꼈다면 수용과 회복에 가깝고, 두렵게 느꼈다면 압박과 경계에 가까워집니다. 이 원칙을 적용하면 사전적인 상징과 이 꿈만의 뜻이 충돌할 때에도 무엇을 우선해야 하는지가 분명해집니다.\n\n행동의 변화도 중요합니다. 처음에는 기다리거나 흐름을 따르다가 마지막에 직접 움직였다면 주도권이 살아나는 과정으로 읽을 수 있습니다. 반대로 움직이던 사람이 멈추거나 갇혔다면 마음이 부담을 느끼고 속도를 늦추려는 흐름일 수 있습니다. 실제로 적히지 않은 현실 문제를 만들어내지 않더라도, 이 행동의 방향만으로 꿈이 원하는 변화는 충분히 설명할 수 있습니다.\n\n마지막 장면은 앞에서 나온 상징들의 뜻을 확정하는 감정적 결론입니다. 결말에 안도와 편안함이 남았다면 앞의 긴장도 결국 정리와 회복으로 가는 과정이 되고, 공포나 막힘이 남았다면 밝은 대상이 나왔더라도 주의의 의미가 커집니다. 그래서 마지막 모습은 단순히 이야기가 끝난 지점이 아니라 꿈 전체의 뜻이 도착한 자리입니다.\n\n종합하면 이 꿈은 마음이 현재 상태를 어떻게 받아들이고 있으며 어느 방향으로 이동하고 싶은지를 보여줍니다. 특정한 미래 사건을 확정하는 꿈으로 보기보다, 시작과 결말의 차이를 통해 지금 필요한 자유, 정리, 회복 또는 경계를 발견하게 하는 꿈으로 읽는 편이 자연스럽습니다. 그 방향을 알아차리는 것만으로도 꿈이 남긴 메시지는 충분히 구체적입니다.",
    traditionalInterpretation: "전통적인 해몽에서는 시작보다 마지막 장면의 밝기, 공간의 열림, 움직임의 방향을 중심으로 기운의 흐름을 읽는 경우가 많습니다. 맑고 편안하게 끝나는 꿈은 상황이 정리되고 흐름이 부드러워지는 쪽으로, 막히거나 두려움이 남는 꿈은 서두르지 말고 살펴야 하는 쪽으로 풀이합니다. 다만 이것은 상징적인 길흉의 방향일 뿐 실제 미래 사건을 확정하는 뜻은 아닙니다.",
    psychologicalInterpretation: "심리적으로는 시작과 마지막 사이의 감정 변화가 현재 마음이 벗어나고 싶은 상태와 향하고 싶은 상태를 보여주는 경우가 있습니다. 수동적인 행동이 능동적으로 바뀌면 선택권과 활력을 되찾고 싶은 마음으로, 긴장이 안도로 바뀌면 부담을 정리하고 안전감을 회복하려는 마음으로 읽을 수 있습니다. 구체적인 현실 문제를 단정하지 않고 꿈에서 확인되는 감정과 행동의 가능성만 연결합니다.",
    fortuneFlow: "좋고 나쁨을 한쪽으로 단정하기보다 전환의 성격이 강한 꿈입니다. 마지막 감정이 편안하고 행동이 능동적으로 바뀌었다면 회복과 긍정의 방향이 우세하며, 두려움과 막힘이 남았다면 속도를 조절하라는 주의의 성격이 커집니다. 길흉 판단의 근거는 개별 상징보다 꿈이 끝난 방향에 있습니다.",
    oneSentenceSummary: "시작과 결말 사이의 감정과 행동 변화가 지금 마음이 향하는 방향을 보여주는 꿈입니다.",
    disclaimer: "꿈풀이는 미래의 사건을 확정하는 판단이 아니라, 최근의 감정과 경험을 돌아보기 위한 참고 정보입니다.",
    groundingChecks: { noInventedPeoplePlacesActions: true, sequencePreserved: true, explicitEmotionsPreserved: true, endingPreserved: true },
  };
  const reading = validateReading(candidate, understanding);
  assert(reading, "최종 해석 구조와 grounding 검사가 통과해야 합니다.");
  if (dream.includes("실내 온천")) {
    const positiveUnderstanding = {
      ...understanding,
      scenes: understanding.scenes.map((scene, index) => ({ ...scene, emotion: index === understanding.scenes.length - 1 ? "행복과 개방감" : "즐거움" })),
      emotionalArc: { beginning: "즐거움", middle: "기대", ending: "행복과 개방감" },
    };
    const contradictory = {
      ...candidate,
      psychologicalInterpretation: "현재 내면이 심한 혼란과 통제력 상실을 겪고 있는 상태를 보여줍니다. 꿈에서 직접 느낀 즐거움과 행복보다 미로의 일반적인 부정 의미가 더 중요하며, 방향을 잃은 현실의 어려움이 이어지고 있다고 볼 수 있습니다. 이런 갈등은 구체적인 문제를 해결하지 못하고 있다는 뜻으로 해석됩니다.",
    };
    assert(!validateReading(contradictory, positiveUnderstanding), "직접 표현된 긍정 감정을 무시하고 미로를 혼란·통제력 상실로 읽은 결과는 거부해야 합니다.");
  }
}

for (const invalid of ["이", "것", "물살을 변하는 행동", "상태"]) assert(!isMeaningfulLabel(invalid), `의미 없는 제목을 거부해야 합니다: ${invalid}`);
console.log(`의미 이해 파이프라인 검증: ${dreams.length}/${dreams.length} 통과`);
