import { fileURLToPath } from "node:url";
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
    name: "친정아버지가 남편에게 소유물을 전달한 장면",
    input: "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
    verify(context) {
      const scene = context.scenes[0];
      assert(scene.subject?.mention === "친정아빠", "주는 사람을 친정아빠로 유지해야 합니다.");
      assert(scene.target?.mention === "남편", "받는 사람을 남편으로 유지해야 합니다.");
      assert(scene.object?.name === "은팔찌", "전달 물건을 은팔찌로 유지해야 합니다.");
      assert(scene.object.owner === "친정아빠", "은팔찌 소유자를 친정아빠로 유지해야 합니다.");
      assert(scene.purpose.meanings.includes("생활 지원"), "살림에 보태라는 목적을 유지해야 합니다.");
    },
  },
  {
    name: "돌아가신 할머니가 사용자에게 밥그릇을 건넨 장면",
    input: "돌아가신 할머니가 아무 말 없이 제 손에 따뜻한 밥그릇을 쥐여주셨어요.",
    verify(context) {
      const scene = context.scenes[0];
      assert(scene.subject?.mention === "돌아가신 할머니", "할머니의 관계 정보를 보존해야 합니다.");
      assert(scene.target?.mention === "나", "받는 대상을 사용자로 유지해야 합니다.");
      assert(scene.object?.name === "밥그릇", "밥그릇을 중심 물건으로 유지해야 합니다.");
      assert(scene.object.attributes.includes("따뜻함"), "따뜻한 상태를 보존해야 합니다.");
      assert(context.expressedEmotions.length === 0, "입력에 없는 감정을 추가하면 안 됩니다.");
      assert(!JSON.stringify(context).includes("예언"), "생존이나 죽음에 관한 예언을 만들면 안 됩니다.");
    },
  },
  {
    name: "남편의 수리와 친정어머니의 조명을 분리한 장면",
    input: "남편이 낡은 집의 문을 고치고 있었는데 친정엄마가 옆에서 불을 밝혀주고 있었어요.",
    verify(context) {
      const repair = context.scenes.find((scene) => scene.action.normalized === "고치다");
      const light = context.scenes.find((scene) => scene.action.normalized === "밝히다");
      assert(repair?.subject?.mention === "남편", "문을 고치는 주체를 남편으로 유지해야 합니다.");
      assert(repair?.object?.name === "문", "고치는 대상을 문으로 유지해야 합니다.");
      assert(light?.subject?.mention === "친정엄마", "불을 밝히는 주체를 친정엄마로 유지해야 합니다.");
      assert(light?.target?.mention === "남편", "도움의 대상을 남편으로 연결해야 합니다.");
    },
  },
  {
    name: "아들의 신발을 모르는 아이에게 준 장면",
    input: "아들이 신던 작은 신발을 모르는 아이에게 주었는데 이상하게 아깝지 않았어요.",
    verify(context) {
      const scene = context.scenes[0];
      assert(scene.object?.name === "신발", "중심 물건을 신발로 유지해야 합니다.");
      assert(scene.object.owner === "아들", "신발 소유자를 아들로 유지해야 합니다.");
      assert(scene.target?.mention === "모르는 아이", "받는 대상을 모르는 아이로 유지해야 합니다.");
      assert(context.expressedEmotions.includes("아깝지 않음"), "직접 표현한 감정을 보존해야 합니다.");
    },
  },
  {
    name: "회사 상사가 사용자의 가방을 대신 들어준 장면",
    input: "회사 상사가 제 가방을 대신 들어주면서 이제 내려놓아도 된다고 말했어요.",
    verify(context) {
      const help = context.scenes.find((scene) => scene.action.normalized === "돕다");
      const speech = context.scenes.find((scene) => scene.action.normalized === "말하다");
      assert(help?.subject?.mention === "상사", "도움을 준 주체를 상사로 유지해야 합니다.");
      assert(help?.target?.mention === "나", "도움을 받은 대상을 사용자로 유지해야 합니다.");
      assert(help?.object?.name === "가방", "대신 들어준 물건을 가방으로 유지해야 합니다.");
      assert(help?.object?.owner === "나", "가방 소유자를 사용자로 유지해야 합니다.");
      assert(speech?.dialogue?.speaker === "상사", "대사의 화자를 상사로 연결해야 합니다.");
      assert(speech?.dialogue?.intentions.includes("부담 완화"), "내려놓아도 된다는 뜻을 부담 완화로 보존해야 합니다.");
      assert(!JSON.stringify(context).includes("퇴사"), "입력에 없는 퇴사를 추가하면 안 됩니다.");
    },
  },
];

export function runRelationChecks({ quiet = false } = {}) {
  const details = cases.map((testCase) => {
    try {
      const context = buildDreamRequestContext(testCase.input, emptyAnalysis, 8);
      testCase.verify(context);
      if (!quiet) console.log(`[통과] ${testCase.name}`);
      return { name: testCase.name, passed: true, message: "" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!quiet) console.error(`[실패] ${testCase.name}: ${message}`);
      return { name: testCase.name, passed: false, message };
    }
  });
  return {
    total: details.length,
    passed: details.filter(({ passed }) => passed).length,
    details,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = runRelationChecks();
  console.log(`관계·대상 표본 검증: ${summary.passed}/${summary.total} 통과`);
  if (summary.passed !== summary.total) process.exitCode = 1;
}
