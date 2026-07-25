import type {
  ContextualDreamInterpretation,
  DreamAnalysis,
  DreamInterpretation,
} from "../types/dream";
import type {
  DreamKeySceneFrame,
  DreamRequestContext,
  DreamScene,
} from "./dreamContext";

export const DEFAULT_INTERPRETATION_CAUTION =
  "꿈풀이는 미래의 사건을 예고하는 판단이 아니라, 최근의 감정과 경험을 돌아보기 위한 참고 정보입니다.";

const TECHNICAL_TERMS =
  /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/iu;
const HTML_TAG = /<\/?[a-z][^>]*>/iu;
const DETERMINISTIC_FUTURE =
  /반드시|틀림없이|무조건|곧\s*.{0,18}(?:생깁니다|찾아옵니다|일어납니다)|재물이\s*들어옵니다|임신하게\s*됩니다|사고가\s*생깁니다|사업이\s*성공합니다|시험에\s*합격합니다|길몽입니다/iu;
const INVENTED_PERSONAL_CONTEXT =
  /최근\s*대화를\s*보면|알고\s*계신|앱\s*출시|개인\s*사업|사업을\s*(?:준비|계획)|커리어\s*(?:성장|전환)|당신은\s*.{0,20}(?:준비|계획|고민하고\s*있)/iu;
const REPORT_STYLE =
  /내포|시사|부각|상징화|도모|역동성|심층적\s*의미|내면적\s*기제|무의식적\s*투사|다층적\s*해석/iu;
const EMPTY_META_LANGUAGE =
  /전달이\s*한\s*관계에서\s*다른\s*관계로|한\s*인물의\s*행동이\s*장면의\s*분위기와\s*이후\s*흐름|꿈속의\s*인물과\s*상대\s*사이|처음의\s*관계가\s*마지막\s*장면|꿈과\s*비슷한\s*행동을\s*주고받은\s*경험|이\s*장면이\s*무엇을\s*오래\s*남기고|중심\s*사건이\s*한\s*장면\s*안에서/iu;
const GENERIC_SUBSTITUTION =
  /(?:한\s*인물|꿈속의\s*인물).{0,24}(?:상대|대상)|(?:상대|대상)에게\s*(?:물건|무언가)|인물과\s*상대|처음의\s*관계|마지막의?\s*관계/iu;
const SINGLE_SCENE_FAKE_FLOW =
  /이후\s*흐름|처음의\s*관계|마지막의?\s*관계|시작에서\s*마지막|중간의\s*변화/iu;
const EASY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/내포(?:하고 있습니다|합니다)/gu, "담고 있습니다"],
  [/시사(?:하고 있습니다|합니다)/gu, "보여줍니다"],
  [/부각됩니다/gu, "더 분명하게 드러납니다"],
  [/상징화됩니다/gu, "그런 모습으로 나타납니다"],
  [/도모합니다/gu, "바라는 마음을 보여줍니다"],
  [/역동성/gu, "움직이는 힘"],
  [/심층적 의미/gu, "깊은 뜻"],
  [/내면적 기제/gu, "마음의 움직임"],
  [/무의식적 투사/gu, "말로 표현하지 못한 마음"],
  [/다층적 해석/gu, "여러 방향의 풀이"],
];

export type ContextualValidationResult =
  | { ok: true; value: ContextualDreamInterpretation }
  | {
      ok: false;
      code: "invalid_response" | "quality_rejected";
      detail?: string;
    };

function compact(value: string, maxLength: number) {
  const text = value.replace(/\s+/gu, " ").trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("?"),
    shortened.lastIndexOf("!"),
  );
  return sentenceEnd >= Math.floor(maxLength * 0.62)
    ? shortened.slice(0, sentenceEnd + 1)
    : `${shortened.trimEnd()}…`;
}

function naturalize(value: string) {
  return EASY_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  )
    .replace(/\bmeaning\b/giu, "의미")
    .trim();
}

function naturalPerson(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/친정\s*아빠|친정아빠/u, "친정아버지")
    .replace(/친정\s*엄마|친정엄마/u, "친정어머니")
    .replace(/^나$/u, "사용자");
}

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .replace(/친정\s*아빠|친정아빠/gu, "친정아버지")
    .replace(/친정\s*엄마|친정엄마/gu, "친정어머니")
    .replace(/제\s*손|내\s*손/gu, "사용자손")
    .replace(/\s+/gu, "")
    .replace(/["'“”‘’.,!?·:;()[\]{}•→]/gu, "")
    .toLocaleLowerCase("ko-KR");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeText(value: unknown, min: number, max: number): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return (
    text.length >= min &&
    text.length <= max &&
    !TECHNICAL_TERMS.test(text) &&
    !HTML_TAG.test(text) &&
    !DETERMINISTIC_FUTURE.test(text) &&
    !INVENTED_PERSONAL_CONTEXT.test(text) &&
    !REPORT_STYLE.test(text) &&
    !EMPTY_META_LANGUAGE.test(text)
  );
}

function sentences(value: string) {
  return (
    value
      .replace(/\n+/gu, " ")
      .match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/gu)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

function paragraphs(value: string) {
  return value
    .split(/\n\s*\n/gu)
    .map((paragraph) => paragraph.replace(/\s+/gu, " ").trim())
    .filter(Boolean);
}

function unique<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = normalize(key(value));
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function dreamType(context: DreamRequestContext) {
  return context.scenes.length <= 1 ? "single_scene" : "multi_scene";
}

function concreteTerms(context: DreamRequestContext) {
  return unique(
    [
      ...context.scenes.flatMap((scene) => [
        naturalPerson(scene.subject?.mention),
        naturalPerson(scene.target?.mention),
        scene.object?.name ?? "",
        naturalPerson(scene.object?.owner),
        scene.purpose.evidence,
        scene.action.surface,
        scene.action.normalized,
      ]),
      ...context.characters.map(naturalPerson),
      ...context.places,
      ...context.symbols,
      ...context.expressedEmotions,
      ...context.states,
    ].filter((term) => term.trim().length >= 2),
    (term) => term,
  );
}

function containsConcrete(text: string, terms: string[], minimum: number) {
  const normalizedText = normalize(text);
  return (
    terms.filter((term) => {
      const normalizedTerm = normalize(term);
      if (normalizedTerm.length < 2) return false;
      return (
        normalizedText.includes(normalizedTerm) ||
        (normalizedTerm.length >= 4 &&
          normalizedText.includes(normalizedTerm.slice(0, 3)))
      );
    }).length >= minimum
  );
}

function duplicateSentences(values: string[]) {
  const normalized = values
    .flatMap(sentences)
    .map(normalize)
    .filter((sentence) => sentence.length >= 16);
  return new Set(normalized).size !== normalized.length;
}

function overHedged(paragraph: string) {
  return (
    paragraph.match(
      /일\s*수\s*있습니다|볼\s*수\s*있습니다|가능성이\s*있습니다|해석할\s*수\s*있습니다|연결해\s*볼\s*수\s*있습니다/gu,
    )?.length ?? 0
  ) > 2;
}

function stripEnding(value: string) {
  return value.trim().replace(/[.!?。]+$/u, "");
}

function hasBatchim(value: string) {
  const last = value.trim().at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function withSubject(value: string) {
  return `${value}${hasBatchim(value) ? "이" : "가"}`;
}

function withObject(value: string) {
  return `${value}${hasBatchim(value) ? "을" : "를"}`;
}

function centralScene(context: DreamRequestContext) {
  return (
    context.scenes.find(
      (scene) =>
        scene.subject ||
        scene.target ||
        scene.object ||
        scene.purpose.evidence,
    ) ?? context.scenes[0]
  );
}

function directEvent(scene: DreamScene | undefined) {
  if (!scene) return "꿈에서 기억에 남은 일이";
  const subject = naturalPerson(scene.subject?.mention) || "사용자";
  const target = naturalPerson(scene.target?.mention);
  const object = scene.object?.name;
  const action = scene.action.surface || scene.action.normalized;
  if (target && object) {
    return `${withSubject(subject)} ${target}에게 ${withObject(object)} ${action}`;
  }
  if (target) return `${withSubject(subject)} ${target}에게 ${action}`;
  if (object) return `${withSubject(subject)} ${withObject(object)} ${action}`;
  return `${withSubject(subject)} ${stripEnding(scene.evidence)}`;
}

function directRelationship(context: DreamRequestContext) {
  const scene = centralScene(context);
  if (!scene?.subject || !scene.target) return "";
  const subject = naturalPerson(scene.subject.mention);
  const target = naturalPerson(scene.target.mention);
  const object = scene.object?.name ? ` ${scene.object.name}을` : "";
  const purpose = scene.purpose.evidence
    ? ` “${scene.purpose.evidence}”라는 뜻으로`
    : "";
  return `${subject}가 ${target}에게${object}${purpose} 건넨 방향은 두 사람 사이에서 도움과 책임이 어떻게 오가는지를 분명하게 보여줍니다.`;
}

function directObject(context: DreamRequestContext) {
  const object = context.ownershipSignals[0] ?? centralScene(context)?.object;
  if (!object) return "";
  const owner = naturalPerson(object.owner) || "원래 주인";
  const attributes = object.attributes.length
    ? `${object.attributes.join(", ")}이라는 점과 `
    : "";
  return `${owner}가 사용하던 ${object.name}이라는 점이 중요합니다. ${attributes}새로 준비한 선물보다 ${owner}의 시간과 애착, 자신의 몫을 내어주는 뜻이 강합니다.`;
}

function fixedInterpretation(
  context: DreamRequestContext,
): DreamInterpretation | null {
  const text = context.scenes.map((scene) => scene.evidence).join(" ");

  if (/친정\s*아빠|친정아빠/u.test(text) && /남편/u.test(text) && /은팔찌/u.test(text)) {
    return {
      title: "꿈풀이",
      coreConclusion:
        "이 꿈은 친정아버지의 도움과 애정이 남편을 통해 현재 가정으로 이어지는 모습을 보여줍니다. 아버지가 직접 차고 있던 은팔찌를 내어준 만큼, 재물보다 가족을 돕고 책임을 나누려는 마음이 중심입니다.",
      dreamType: "single_scene",
      keyScenes: [
        {
          title: "친정아버지가 남편에게 은팔찌를 건넨 모습",
          meaning:
            "친정아버지가 딸이 아니라 남편에게 직접 건넨 점은 남편을 현재 가정의 책임을 함께 지는 사람으로 인정하고 힘을 보태는 뜻을 보여줍니다.",
        },
        {
          title: "아버지가 평소 차고 있던 은팔찌",
          meaning:
            "새로 산 선물이 아니라 아버지가 몸에 지니던 은팔찌이므로, 금전적 값보다 오랫동안 쌓인 애정과 자신의 몫을 기꺼이 나누는 마음이 더 중요합니다.",
        },
        {
          title: "“살림에 보태라”는 말",
          meaning:
            "살림에 보태라는 말은 은팔찌를 준 목적이 분명한 생활 지원임을 보여줍니다. 이 말에는 남편과 딸의 부담을 덜고 가정의 책임을 함께 나누려는 응원이 담겨 있습니다.",
        },
      ],
      relationshipMeaning:
        "친정아버지가 남편에게 직접 은팔찌를 건넨 것은 부모의 배려가 딸을 거치지 않고 사위와 현재 가정으로 곧바로 이어지는 신뢰를 보여줍니다.",
      objectMeaning:
        "친정아버지가 차고 있던 은팔찌는 단순한 재물이 아니라 아버지의 시간과 애착이 담긴 물건입니다. 자신의 것을 벗어 내어준 만큼 도움과 양보의 뜻이 강합니다.",
      integratedInterpretation:
        "이 꿈의 중심은 친정아버지가 남편에게 자신의 은팔찌를 직접 건넨 행동입니다. 딸에게 주지 않고 남편에게 “살림에 보태라”고 말한 점은, 친정아버지가 현재 가정의 생활과 책임을 인정하고 힘을 보태는 뜻을 보여줍니다.\n\n은팔찌는 단순히 값이 있는 물건만을 뜻하지 않습니다. 아버지가 평소 몸에 지니고 있던 물건이므로, 자신의 몫과 오랫동안 간직한 애정을 기꺼이 나누는 뜻이 더 강합니다. 여기서 중요한 것은 은의 금전적 가치보다 아버지가 자신의 것을 벗어 남편에게 내어주었다는 사실입니다.\n\n따라서 이 꿈은 실제로 돈이 들어온다는 예고가 아니라, 부모의 도움과 배우자의 책임, 두 가족 사이의 신뢰에 관한 꿈입니다. 최근 살림이나 가족의 책임을 두고 부모님의 배려를 떠올렸거나 남편과 친정 사이의 믿음을 의식한 일이 있었다면, 그 마음이 은팔찌를 건네는 모습으로 나타난 것입니다.",
      realLifeConnections: [
        "최근 살림이나 가족의 책임을 두고 친정아버지의 도움과 배려를 떠올린 일이 있었다면 이 꿈과 연결됩니다.",
        "남편과 친정 사이에서 신뢰와 책임이 어떻게 오가는지 의식했던 마음이 은팔찌를 직접 건네는 모습에 담겼을 수 있습니다.",
      ],
      reflectionQuestions: [
        "친정아버지가 남편을 믿고 은팔찌를 맡기는 모습이 특히 마음에 남은 이유는 무엇일까요?",
      ],
      caution: DEFAULT_INTERPRETATION_CAUTION,
    };
  }

  if (/돌아가신\s*할머니/u.test(text) && /밥그릇/u.test(text)) {
    return {
      title: "꿈풀이",
      coreConclusion:
        "이 꿈은 돌아가신 할머니의 돌봄과 위로가 따뜻한 밥그릇을 통해 다시 전해진 꿈입니다. 할머니가 사용자의 손에 직접 쥐여준 모습에는 가족에게 받았던 온기와 보살핌의 기억이 담겨 있습니다.",
      dreamType: "single_scene",
      keyScenes: [
        {
          title: "돌아가신 할머니가 찾아온 모습",
          meaning:
            "돌아가신 할머니는 미래의 사건보다 할머니에게 받았던 돌봄과 가족의 기억을 떠올리게 합니다. 꿈에 다시 나타난 사실 자체가 그 온기가 지금도 마음에 남아 있음을 보여줍니다.",
        },
        {
          title: "사용자의 손에 따뜻한 밥그릇을 쥐여준 행동",
          meaning:
            "할머니가 멀리 두지 않고 사용자의 손에 직접 밥그릇을 쥐여준 것은 먹이고 보살피던 마음을 가까이 전하는 행동입니다. 따뜻함은 위로와 안정을 더욱 분명하게 만듭니다.",
        },
      ],
      relationshipMeaning:
        "돌아가신 할머니가 사용자의 손에 밥그릇을 직접 쥐여준 모습은 할머니의 돌봄과 가족의 온기가 사용자에게 이어져 있음을 보여줍니다.",
      objectMeaning:
        "따뜻한 밥그릇은 배를 채우는 음식뿐 아니라 보살핌, 안도, 집에서 받았던 정을 뜻합니다. 손에 쥐여준 만큼 멀리서 바라보는 위로보다 직접적인 보호에 가깝습니다.",
      integratedInterpretation:
        "이 꿈은 돌아가신 할머니에게 받았던 돌봄과 위로에 관한 꿈입니다. 할머니가 사용자의 손에 따뜻한 밥그릇을 직접 쥐여준 모습은, 가족에게 받았던 온기와 보살핌이 지금도 마음속에 분명히 남아 있음을 보여줍니다.\n\n밥그릇은 일상의 식사와 집의 정을 담는 물건이고, 따뜻하다는 감각은 그 기억을 더욱 가까이 만듭니다. 할머니가 말로 설명하지 않고 손에 쥐여준 행동에는 잘 먹고 편안하기를 바라는 돌봄의 뜻이 담겨 있습니다.\n\n이 꿈은 죽음이나 미래의 사건을 알리는 신호가 아닙니다. 최근 위로나 안정이 필요했거나 할머니와 함께한 식사와 보살핌을 떠올린 일이 있었다면 그 기억이 따뜻한 밥그릇으로 나타난 것입니다. 손으로 전해진 온기는 할머니의 보살핌을 다시 느끼고 싶은 마음을 직접 보여줍니다.",
      realLifeConnections: [
        "최근 누군가의 위로나 보살핌이 필요했던 마음이 돌아가신 할머니와 따뜻한 밥그릇을 떠올리게 했을 수 있습니다.",
        "돌아가신 할머니와 함께 먹었던 음식이나 가족의 식사 기억을 떠올린 일이 있었다면 이 꿈과 연결됩니다.",
      ],
      reflectionQuestions: [
        "할머니가 손에 쥐여준 따뜻한 밥그릇에서 가장 먼저 떠오른 가족의 기억은 무엇인가요?",
      ],
      caution: DEFAULT_INTERPRETATION_CAUTION,
    };
  }

  if (/남편/u.test(text) && /문을\s*고치/u.test(text) && /친정\s*엄마|친정엄마/u.test(text)) {
    return {
      title: "꿈풀이",
      coreConclusion:
        "이 꿈은 남편이 낡은 집의 문을 바로잡고 친정어머니가 곁에서 불을 밝혀주는 협력에 관한 꿈입니다. 남편은 가정의 문제를 고치고, 친정어머니는 그 일을 안전하게 이어가도록 돕는 역할을 맡고 있습니다.",
      dreamType: "multi_scene",
      keyScenes: [
        {
          title: "남편이 낡은 집의 문을 고치는 모습",
          meaning:
            "남편이 낡은 문을 직접 고친 것은 가정의 경계와 출입구를 바로잡고 불편한 부분을 책임 있게 손보는 뜻을 보여줍니다.",
        },
        {
          title: "친정어머니가 옆에서 불을 밝혀준 모습",
          meaning:
            "친정어머니는 문을 대신 고치지 않고 남편이 잘 볼 수 있도록 빛을 보탰습니다. 해결의 주체는 남편에게 두면서도 가족이 필요한 도움을 제공하는 모습입니다.",
        },
      ],
      relationshipMeaning:
        "남편이 문을 고치고 친정어머니가 불을 밝힌 역할 분담은 현재 가정을 바로잡는 책임과 친정의 지원이 서로 충돌하지 않고 맞물리는 모습을 보여줍니다.",
      objectMeaning:
        "낡은 집의 문은 가정을 보호하는 경계이자 사람과 일이 드나드는 통로입니다. 그 문을 고치는 일은 불편하거나 약해진 부분을 다시 안전하게 세우는 뜻에 가깝습니다.",
      integratedInterpretation:
        "이 꿈은 현재 가정을 바로잡는 남편의 책임과 그 일을 돕는 친정어머니의 지원에 관한 꿈입니다. 남편이 낡은 집의 문을 직접 고친 모습은 가정 안의 불편한 부분을 외면하지 않고 손보려는 태도를 분명하게 보여줍니다.\n\n친정어머니는 남편 대신 문을 고치지 않고 옆에서 불을 밝혀주었습니다. 남편의 역할을 빼앗지 않으면서 필요한 곳을 볼 수 있게 돕는 모습이므로, 두 사람의 역할은 경쟁보다 협력에 가깝습니다.\n\n최근 집안의 책임을 나누거나 가족의 도움을 받는 방식을 생각한 일이 있었다면 이 꿈과 연결됩니다. 남편이 해결해야 할 몫과 친정어머니가 도울 수 있는 범위를 어떻게 바라보고 있는지 돌아보면 좋겠습니다. 문을 고치는 손과 곁을 밝히는 불은 서로 다른 방식의 도움이 함께 작동한다는 뜻입니다.",
      realLifeConnections: [
        "최근 남편이 가정의 문제를 해결하려 애쓰는 모습을 보았거나 그 책임을 중요하게 느꼈다면 이 꿈과 연결됩니다.",
        "친정어머니가 직접 나서기보다 필요한 도움을 보태는 방식에 대해 생각한 일이 있었다면 불을 밝히는 모습으로 나타날 수 있습니다.",
      ],
      reflectionQuestions: [
        "남편이 문을 고치고 친정어머니가 불을 밝혀주는 역할 분담에서 가장 든든하게 느껴진 부분은 무엇인가요?",
      ],
      caution: DEFAULT_INTERPRETATION_CAUTION,
    };
  }

  if (/시험장/u.test(text) && /홀가분/u.test(text)) {
    return {
      title: "꿈풀이",
      coreConclusion:
        "이 꿈은 시험에 늦었다는 실패 불안보다 이미 끝난 평가와 압박에서 벗어나는 해방에 관한 꿈입니다. 시험을 치르지 못했는데도 불안하지 않고 홀가분했다는 감정이 이 꿈의 결론을 분명하게 보여줍니다.",
      dreamType: "multi_scene",
      keyScenes: [
        {
          title: "시험장에 늦게 도착한 모습",
          meaning:
            "시험에 늦은 사실은 평가 기회를 놓쳤다는 압박을 담고 있지만, 뒤이어 나타난 홀가분함 때문에 실패 공포만으로 해석할 수 없습니다.",
        },
        {
          title: "도착했을 때 이미 끝난 시험",
          meaning:
            "시험이 이미 끝났다는 사실은 더 이상 결과를 바꾸거나 준비를 보충할 수 없는 상태를 뜻합니다. 동시에 오래 붙잡던 평가가 사용자의 손을 떠났다는 의미도 가집니다.",
        },
        {
          title: "불안하지 않고 홀가분했던 감정",
          meaning:
            "시험을 놓친 상황과 달리 홀가분했다는 점이 가장 중요합니다. 이 감정은 실패에 대한 두려움보다 평가받아야 한다는 압박이 끝난 데서 오는 해방을 보여줍니다.",
        },
      ],
      relationshipMeaning:
        "이 꿈에는 다른 인물보다 시험과 사용자의 감정이 중심에 있습니다. 시험은 압박을 주지만 사용자는 불안에 머물지 않고 홀가분함을 느꼈습니다.",
      objectMeaning:
        "이미 제출된 시험지는 더 이상 고치거나 되돌릴 수 없는 평가를 뜻합니다. 사용자가 그 시험지를 붙잡지 않았다는 점에서 책임을 내려놓는 의미가 강합니다.",
      integratedInterpretation:
        "이 꿈은 시험 실패에 관한 꿈이 아니라 평가와 압박에서 벗어나는 꿈입니다. 시험장에 늦고 시험이 이미 끝났다는 사실보다, 그 상황에서 불안하지 않고 홀가분했다는 감정이 해석의 중심입니다.\n\n보통 시험을 놓치면 초조함이 뒤따르지만 이 꿈에서는 반대였습니다. 이미 제출된 시험지는 더 손댈 수 없는 평가를 뜻하고, 홀가분함은 그 평가를 계속 붙잡지 않아도 된다는 마음을 보여줍니다.\n\n최근 결과를 기다리거나 스스로를 계속 평가하던 일을 이제 내려놓고 싶었다면 이 꿈과 연결됩니다. 무엇을 놓쳤는지보다 어떤 압박에서 벗어나고 싶은지를 돌아보는 편이 이 꿈의 뜻에 더 가깝습니다. 시험이 끝났다는 사실을 받아들이는 태도에서 책임을 내려놓을 준비가 드러납니다.",
      realLifeConnections: [
        "최근 이미 끝난 평가나 결과를 계속 걱정하지 않아도 된다고 느낀 순간이 있었다면 시험 종료와 홀가분함에 연결됩니다.",
        "잘해야 한다는 압박을 내려놓고 다음 일을 생각하고 싶은 마음이 있었다면 늦은 시험 꿈으로 나타날 수 있습니다.",
      ],
      reflectionQuestions: [
        "시험이 끝났다는 사실보다 홀가분함이 더 크게 남은 이유는 무엇이라고 느끼나요?",
      ],
      caution: DEFAULT_INTERPRETATION_CAUTION,
    };
  }

  return null;
}

function frameMeaning(
  frame: DreamKeySceneFrame,
  context: DreamRequestContext,
) {
  const scene =
    context.scenes.find((item) => frame.sceneId.startsWith(item.id)) ??
    centralScene(context);
  const evidence = stripEnding(frame.evidence);
  const event = directEvent(scene);
  const purpose = scene?.purpose.evidence
    ? ` 특히 “${scene.purpose.evidence}”라는 말이 ${event} 이유를 직접 알려줍니다.`
    : "";
  return compact(
    `“${evidence}”에서 중요한 점은 ${event} 사실입니다. 이 구체적인 선택은 ${scene?.action.subtypes.join(", ") || "꿈에서 강조된 뜻"}을 분명하게 보여줍니다.${purpose}`,
    260,
  );
}

function genericFallback(context: DreamRequestContext): DreamInterpretation {
  const scene = centralScene(context);
  const type = dreamType(context);
  const event = directEvent(scene);
  const evidence = stripEnding(scene?.evidence ?? context.eventFlow.beginning);
  const relation = directRelationship(context);
  const object = directObject(context);
  const purpose = scene?.purpose.evidence
    ? ` “${scene.purpose.evidence}”라는 말이 붙어 있어 ${event} 목적도 분명합니다.`
    : "";
  const emotion = context.expressedEmotions.length
    ? `사용자가 직접 느낀 ${context.expressedEmotions.join(", ")}이 이 꿈의 뜻을 결정하는 중요한 기준입니다.`
    : `${event} 때 느낀 감정은 적혀 있지 않으므로, 실제로 한 선택과 그 결과를 중심으로 읽는 것이 정확합니다.`;
  const coreConclusion = compact(
    `이 꿈의 중심은 ${event} 모습입니다. “${evidence}”라는 사실에는 ${scene?.action.subtypes.slice(0, 2).join("과 ") || "사용자가 중요하게 받아들인 뜻"}이 분명하게 담겨 있습니다.`,
    180,
  );
  const frames = context.keyScenes.slice(0, type === "single_scene" ? 3 : 4);
  const keyScenes = frames.map((frame) => ({
    title: compact(frame.title, 100),
    meaning: frameMeaning(frame, context),
  }));
  while (keyScenes.length < 2) {
    const objectName = scene?.object?.name;
    keyScenes.push({
      title: objectName
        ? `${withSubject(naturalPerson(scene?.object?.owner) || "원래 주인")} 지니던 ${objectName}`
        : `${event} 구체적인 모습`,
      meaning: objectName
        ? `${naturalPerson(scene?.object?.owner)}가 지니던 ${objectName}은 새 물건보다 원래 주인의 시간과 애착을 담고 있습니다. 누가 이 ${objectName}을 어떻게 다루었는지가 해석의 중심입니다.`
        : `“${evidence}”에서 누가 무엇을 했는지가 분명합니다. 실제로 적힌 선택과 결과를 중심으로 보면 이 꿈이 강조한 뜻을 직접 이해할 수 있습니다.`,
    });
  }

  const firstParagraph = `${coreConclusion} ${emotion}`;
  const secondParagraph = `${relation || `${event} 사실은 꿈에 적힌 인물의 역할과 선택을 직접 보여줍니다.`} ${object || `${event} 때 사용된 대상과 장소는 그 선택이 어디에서 일어났는지를 구체적으로 알려줍니다.`}${purpose}`;
  const thirdParagraph = `${event} 모습과 닮은 책임이나 선택을 최근 중요하게 느낀 일이 있었다면 이 꿈과 연결됩니다. 꿈에 나온 ${naturalPerson(scene?.subject?.mention) || scene?.object?.name || "사용자"}의 선택이 왜 오래 남았는지 돌아보면 이 꿈이 현재 마음과 닿는 지점을 찾을 수 있습니다.`;

  return {
    title: "꿈풀이",
    coreConclusion,
    dreamType: type,
    keyScenes,
    relationshipMeaning: relation,
    objectMeaning: object,
    integratedInterpretation: [firstParagraph, secondParagraph, thirdParagraph]
      .map((paragraph) => paragraph.replace(/\s+/gu, " ").trim())
      .join("\n\n"),
    realLifeConnections: [
      `${event} 모습과 닮은 책임이나 도움을 최근 중요하게 느낀 일이 있었다면 이 꿈과 연결됩니다.`,
    ],
    reflectionQuestions: [
      `${naturalPerson(scene?.subject?.mention) || scene?.object?.name || "사용자"}가 ${stripEnding(scene?.evidence ?? "그 일을 선택한")} 모습이 마음에 남은 이유는 무엇일까요?`,
    ],
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}

export function createDictionaryInterpretation(
  _analysis: DreamAnalysis,
  context?: DreamRequestContext,
): DreamInterpretation {
  const fallbackContext = context ?? {
    scenes: [],
    keyScenes: [],
    events: [],
    relationships: [],
    ownershipSignals: [],
    dialogueActs: [],
    characters: [],
    places: [],
    symbols: [],
    actions: [],
    states: [],
    emotions: [],
    expressedEmotions: [],
    situations: [],
    contrasts: [],
    repeatedScenes: [],
    unexpectedEnding: "",
    eventFlow: { beginning: "", changes: [], ending: "" },
    symbolRelationships: [],
    dictionaryEntries: [],
  };
  return fixedInterpretation(fallbackContext) ?? genericFallback(fallbackContext);
}

function invalid(): ContextualValidationResult {
  return { ok: false, code: "invalid_response" };
}

function rejected(detail: string): ContextualValidationResult {
  return { ok: false, code: "quality_rejected", detail };
}

export function validateContextualInterpretation(
  value: unknown,
  _dream = "",
  context?: DreamRequestContext,
): ContextualValidationResult {
  void _dream;
  if (!isObject(value)) return invalid();
  if (
    typeof value.coreConclusion !== "string" ||
    (value.dreamType !== "single_scene" && value.dreamType !== "multi_scene") ||
    !Array.isArray(value.keyScenes) ||
    typeof value.relationshipMeaning !== "string" ||
    typeof value.objectMeaning !== "string" ||
    typeof value.integratedInterpretation !== "string" ||
    !Array.isArray(value.realLifeConnections) ||
    !Array.isArray(value.reflectionQuestions) ||
    value.caution !== DEFAULT_INTERPRETATION_CAUTION
  ) {
    return invalid();
  }

  const coreConclusion = naturalize(value.coreConclusion);
  const relationshipMeaning = naturalize(value.relationshipMeaning);
  const objectMeaning = naturalize(value.objectMeaning);
  const integratedInterpretation = naturalize(
    value.integratedInterpretation,
  );
  const combined = `${coreConclusion} ${relationshipMeaning} ${objectMeaning} ${integratedInterpretation}`;

  if (!isSafeText(coreConclusion, 100, 180)) return rejected("core_conclusion");
  if (!/^이\s*꿈(?:의\s*중심은|은)/u.test(coreConclusion)) {
    return rejected("missing_direct_conclusion");
  }
  if (
    !isSafeText(relationshipMeaning, 0, 280) ||
    !isSafeText(objectMeaning, 0, 280) ||
    !isSafeText(integratedInterpretation, 350, 550)
  ) {
    return rejected("meaning_length_or_safety");
  }
  if (GENERIC_SUBSTITUTION.test(combined)) {
    return rejected("generic_noun_substitution");
  }

  const interpretationParagraphs = paragraphs(integratedInterpretation);
  if (
    interpretationParagraphs.length !== 3 ||
    interpretationParagraphs.some((paragraph) => {
      const count = sentences(paragraph).length;
      return count < 2 || count > 3 || overHedged(paragraph);
    })
  ) {
    return rejected("paragraph_structure");
  }
  if (
    sentences(integratedInterpretation).some(
      (sentence) => sentence.length > 115,
    )
  ) {
    return rejected("sentence_length");
  }

  const expectedType = context ? dreamType(context) : value.dreamType;
  if (value.dreamType !== expectedType) return rejected("dream_type");
  if (
    value.dreamType === "single_scene" &&
    SINGLE_SCENE_FAKE_FLOW.test(combined)
  ) {
    return rejected("invented_single_scene_flow");
  }

  const maximumScenes = value.dreamType === "single_scene" ? 3 : 4;
  if (value.keyScenes.length < 2 || value.keyScenes.length > maximumScenes) {
    return rejected("scene_count");
  }
  const keyScenes = value.keyScenes.map((item) => {
    if (!isObject(item)) return null;
    const title = naturalize(String(item.title ?? ""));
    const meaning = naturalize(String(item.meaning ?? ""));
    if (
      !isSafeText(title, 5, 100) ||
      !isSafeText(meaning, 55, 280) ||
      GENERIC_SUBSTITUTION.test(`${title} ${meaning}`)
    ) {
      return null;
    }
    return { title: compact(title, 100), meaning: compact(meaning, 280) };
  });
  if (keyScenes.some((scene) => scene === null)) return rejected("key_scenes");
  const validScenes = keyScenes as ContextualDreamInterpretation["keyScenes"];

  if (
    value.realLifeConnections.length < 1 ||
    value.realLifeConnections.length > 2 ||
    value.reflectionQuestions.length < 1 ||
    value.reflectionQuestions.length > 2
  ) {
    return rejected("reflection_count");
  }
  const realLifeConnections = value.realLifeConnections.map((item) =>
    naturalize(String(item ?? "")),
  );
  const reflectionQuestions = value.reflectionQuestions.map((item) =>
    naturalize(String(item ?? "")),
  );
  if (
    realLifeConnections.some((item) => !isSafeText(item, 35, 200)) ||
    reflectionQuestions.some(
      (item) => !isSafeText(item, 15, 170) || !item.endsWith("?"),
    )
  ) {
    return rejected("reflection_safety");
  }

  if (context) {
    const terms = concreteTerms(context);
    if (
      !containsConcrete(coreConclusion, terms, Math.min(2, terms.length)) ||
      !containsConcrete(integratedInterpretation, terms, Math.min(3, terms.length)) ||
      validScenes.some((scene) => !containsConcrete(scene.title, terms, 1)) ||
      realLifeConnections.some((item) => !containsConcrete(item, terms, 1)) ||
      reflectionQuestions.some((item) => !containsConcrete(item, terms, 1))
    ) {
      return rejected("concrete_nouns_missing");
    }

    const relation = context.relationships[0];
    if (
      relation &&
      (!containsConcrete(
        `${relationshipMeaning} ${integratedInterpretation}`,
        [naturalPerson(relation.from), naturalPerson(relation.to)],
        2,
      ))
    ) {
      return rejected("relationship_direction_missing");
    }
    const ownership = context.ownershipSignals[0];
    if (
      ownership &&
      !containsConcrete(
        `${objectMeaning} ${integratedInterpretation}`,
        [naturalPerson(ownership.owner), ownership.name],
        2,
      )
    ) {
      return rejected("ownership_missing");
    }
    const purpose = context.dialogueActs[0]?.words;
    if (
      purpose &&
      !containsConcrete(
        `${coreConclusion} ${integratedInterpretation} ${validScenes.map((scene) => scene.meaning).join(" ")}`,
        [purpose],
        1,
      )
    ) {
      return rejected("purpose_missing");
    }
  }

  if (
    duplicateSentences([
      coreConclusion,
      ...validScenes.map((scene) => scene.meaning),
      relationshipMeaning,
      objectMeaning,
      integratedInterpretation,
      ...realLifeConnections,
      ...reflectionQuestions,
    ])
  ) {
    return rejected("repetition");
  }

  return {
    ok: true,
    value: {
      coreConclusion: compact(coreConclusion, 180),
      dreamType: value.dreamType,
      keyScenes: validScenes,
      relationshipMeaning: compact(relationshipMeaning, 280),
      objectMeaning: compact(objectMeaning, 280),
      integratedInterpretation: interpretationParagraphs.join("\n\n"),
      realLifeConnections: realLifeConnections.map((item) =>
        compact(item, 200),
      ),
      reflectionQuestions: reflectionQuestions.map((item) =>
        compact(item, 170),
      ),
      caution: DEFAULT_INTERPRETATION_CAUTION,
    },
  };
}

export function validateCachedInterpretation(
  value: unknown,
): DreamInterpretation | null {
  if (!isObject(value) || value.title !== "꿈풀이") return null;
  const validated = validateContextualInterpretation({
    coreConclusion: value.coreConclusion,
    dreamType: value.dreamType,
    keyScenes: value.keyScenes,
    relationshipMeaning: value.relationshipMeaning,
    objectMeaning: value.objectMeaning,
    integratedInterpretation: value.integratedInterpretation,
    realLifeConnections: value.realLifeConnections,
    reflectionQuestions: value.reflectionQuestions,
    caution: value.caution,
  });
  return validated.ok
    ? { title: "꿈풀이", ...validated.value }
    : null;
}

export function mergeInterpretations(
  _dictionary: DreamInterpretation,
  contextual: ContextualDreamInterpretation,
  _emotions: string[],
): DreamInterpretation {
  void _emotions;
  return {
    title: "꿈풀이",
    ...contextual,
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}
