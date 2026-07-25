import { buildDreamRequestContext } from "../lib/dreamContext.ts";

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

const cases = [
  {
    name: "가족의 소유물 전달",
    dream: "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
    verify(context) {
      const scene = context.scenes[0];
      assert(scene.subject?.mention === "친정아빠", "주체를 친정아빠로 읽어야 합니다.");
      assert(scene.target?.mention === "남편", "대상을 남편으로 읽어야 합니다.");
      assert(scene.action.normalized === "주다", "행동을 주다로 읽어야 합니다.");
      assert(scene.object?.name === "은팔찌", "물건을 은팔찌로 읽어야 합니다.");
      assert(scene.object.owner === "친정아빠", "은팔찌의 소유자를 주체로 연결해야 합니다.");
      assert(scene.object.personalValues.includes("애착"), "착용하던 물건의 애착 가치를 읽어야 합니다.");
      assert(scene.purpose.meanings.includes("생활 지원"), "살림에 보태라는 목적을 생활 지원으로 읽어야 합니다.");
      assert(scene.action.subtypes.includes("지원"), "주다를 지원으로 세분화해야 합니다.");
      assert(scene.action.subtypes.includes("희생"), "소중한 소유물을 주는 행동의 희생 성격을 읽어야 합니다.");
      assert(context.relationships[0]?.from === "친정아빠", "관계의 출발 인물을 보존해야 합니다.");
      assert(context.relationships[0]?.to === "남편", "관계의 도착 인물을 보존해야 합니다.");
      assert(context.dialogueActs[0]?.intentions.includes("책임 분담"), "대화의 책임 분담 의도를 읽어야 합니다.");
    },
  },
  {
    name: "할머니의 따뜻한 밥그릇",
    dream: "돌아가신 할머니가 아무 말 없이 제 손에 따뜻한 밥그릇을 쥐여주셨어요.",
    verify(context) {
      const scene = context.scenes[0];
      assert(scene.subject?.mention === "돌아가신 할머니", "돌아가신 할머니라는 인물 맥락을 보존해야 합니다.");
      assert(scene.target?.mention === "나", "제 손에 건넨 대상을 꿈꾼 사람으로 연결해야 합니다.");
      assert(scene.action.normalized === "주다", "쥐여주는 행동을 전달 사건으로 읽어야 합니다.");
      assert(scene.object?.name === "밥그릇", "따뜻한 밥그릇을 중심 물건으로 읽어야 합니다.");
      assert(scene.object.attributes.includes("따뜻함"), "물건의 따뜻한 성질을 보존해야 합니다.");
      assert(context.expressedEmotions.length === 0, "사용자가 쓰지 않은 감정을 만들면 안 됩니다.");
    },
  },
  {
    name: "집을 고치는 남편과 불을 밝히는 어머니",
    dream: "남편이 낡은 집의 문을 고치고 있었는데 친정엄마가 옆에서 계속 불을 밝혀주고 있었어요.",
    verify(context) {
      assert(context.scenes.some((scene) => scene.action.normalized === "고치다"), "문을 고치는 행동을 읽어야 합니다.");
      const lightScene = context.scenes.find((scene) => scene.action.normalized === "밝히다");
      assert(lightScene?.subject?.mention === "친정엄마", "불을 밝힌 주체를 친정엄마로 읽어야 합니다.");
      assert(lightScene?.target?.mention === "남편", "어머니의 도움을 앞 장면의 남편과 연결해야 합니다.");
      assert(lightScene?.action.subtypes.includes("길잡이"), "불을 밝혀주는 행동의 길잡이 성격을 읽어야 합니다.");
    },
  },
  {
    name: "아들의 신발을 건넨 장면",
    dream: "아들이 신던 작은 신발을 모르는 아이에게 주었는데 이상하게 아깝지 않았어요.",
    verify(context) {
      const scene = context.scenes[0];
      assert(scene.object?.name === "신발", "신발을 중심 물건으로 읽어야 합니다.");
      assert(scene.object.owner === "아들", "신발의 원래 사용자를 아들로 연결해야 합니다.");
      assert(scene.target?.mention === "모르는 아이", "신발을 받은 대상을 모르는 아이로 보존해야 합니다.");
      assert(scene.object.attributes.includes("작은 크기"), "작은 신발이라는 속성을 보존해야 합니다.");
      assert(context.expressedEmotions.includes("아깝지 않음"), "아깝지 않았다는 직접 감정을 읽어야 합니다.");
    },
  },
  {
    name: "시험 장면과 반대 감정",
    dream:
      "시험장에 늦게 도착했는데 시험지는 이미 제출되어 있었습니다. 그런데 불안하지 않았고 오히려 홀가분했습니다.",
    verify(context) {
      assert(context.eventFlow.beginning.includes("시험장"), "시험장을 시작 장면으로 보존해야 합니다.");
      assert(context.expressedEmotions.includes("불안하지 않음"), "부정된 불안을 직접 감정으로 보존해야 합니다.");
      assert(context.expressedEmotions.includes("홀가분함"), "홀가분함을 직접 감정으로 보존해야 합니다.");
      assert(context.contrasts.some((item) => item.includes("홀가분함")), "상황과 감정의 대비를 읽어야 합니다.");
    },
  },
  {
    name: "동물과 관계의 결말",
    dream:
      "큰 검은 구렁이가 집 안으로 들어왔고 가족들은 가만히 있었지만 나만 도망쳤습니다. 마지막에는 뱀과 눈을 마주쳤습니다.",
    verify(context) {
      assert(context.scenes.some((scene) => scene.action.normalized === "피하다"), "도망 행동을 회피 사건으로 읽어야 합니다.");
      assert(context.eventFlow.ending.includes("눈을 마주"), "마지막 대면 장면을 보존해야 합니다.");
      assert(context.contrasts.some((item) => item.includes("주변 인물")), "가족과 나의 행동 대비를 읽어야 합니다.");
    },
  },
  {
    name: "변화와 안심",
    dream:
      "고양이가 창문 밖에서 울고 있었는데 문을 열자 새로 변해 날아갔습니다. 처음에는 걱정했지만 마지막에는 안심했습니다.",
    verify(context) {
      assert(
        context.scenes.some((scene) => scene.action.normalized === "변하다" || scene.action.subtypes.includes("변화")),
        "존재의 변화를 사건으로 읽어야 합니다."
      );
      assert(context.eventFlow.ending.includes("안심"), "마지막 감정을 결말에 보존해야 합니다.");
      assert(context.expressedEmotions.includes("안심"), "안심을 직접 감정으로 읽어야 합니다.");
    },
  },
];

for (const testCase of cases) {
  const context = buildDreamRequestContext(testCase.dream, emptyAnalysis, 8);
  testCase.verify(context);
  console.log(JSON.stringify({
    name: testCase.name,
    scenes: context.scenes.length,
    events: context.events.length,
    relationships: context.relationships.length,
    ownershipSignals: context.ownershipSignals.length,
    dialogueActs: context.dialogueActs.length,
    result: "passed",
  }));
}
