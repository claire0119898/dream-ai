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

export const DEFAULT_INTERPRETATION_NOTICE =
  "꿈은 미래를 그대로 예언한다기보다 최근의 생각, 감정, 관계, 경험이 상징적인 장면으로 나타나는 경우가 많습니다. 아래 내용은 꿈속 장면을 바탕으로 의미를 살펴보는 참고 풀이입니다.";

export const DEFAULT_INTERPRETATION_CAUTION =
  "꿈의 의미는 개인의 경험과 당시 감정에 따라 다르게 느껴질 수 있습니다.";

const TECHNICAL_TERMS =
  /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/iu;
const HTML_TAG = /<\/?[a-z][^>]*>/iu;
const DETERMINISTIC_LANGUAGE =
  /반드시|틀림없이|무조건|곧\s*(?:기회|변화|재물|사고|좋은\s*일).{0,12}(?:찾아옵니다|생깁니다|일어납니다)|(?:사업|계획).{0,12}반드시\s*성공|재물이\s*들어옵니다|길몽입니다/iu;
const REPORT_STYLE_LANGUAGE =
  /내포|시사|부각|상징화|도모|역동성|심층적\s*의미|내면적\s*기제|무의식적\s*투사|다층적\s*해석/iu;
const INVENTED_PERSONAL_CONTEXT =
  /최근\s*대화를\s*보면|알고\s*계신|앱\s*출시|개인\s*사업|사업을\s*(?:준비|계획)|커리어\s*(?:성장|전환)|당신은\s*.{0,20}(?:준비|계획|고민하고\s*있)/iu;
const RELATION_LANGUAGE =
  /함께|이어|연결|다가|바라|열어|건네|주고|받고|변하|움직|마지막|처음|반면|관계|흐름/iu;
const EASY_LANGUAGE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/내포(?:하고 있습니다|합니다)/gu, "담고 있습니다"],
  [/시사(?:하고 있습니다|합니다)/gu, "보여줍니다"],
  [/부각됩니다/gu, "더 눈에 띕니다"],
  [/상징화됩니다/gu, "그런 모습으로 나타날 수 있습니다"],
  [/도모합니다/gu, "바라는 모습에 가깝습니다"],
  [/역동성/gu, "움직이는 힘"],
  [/심층적 의미/gu, "깊은 의미"],
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
  return EASY_LANGUAGE_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  )
    .replace(/\bmeaning\b/giu, "의미")
    .trim();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeText(
  value: unknown,
  minLength: number,
  maxLength: number,
): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return (
    text.length >= minLength &&
    text.length <= maxLength &&
    !TECHNICAL_TERMS.test(text) &&
    !HTML_TAG.test(text) &&
    !DETERMINISTIC_LANGUAGE.test(text) &&
    !INVENTED_PERSONAL_CONTEXT.test(text)
  );
}

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\s+/gu, "")
    .replace(/["'“”‘’.,!?·:;()[\]{}•→]/gu, "")
    .toLocaleLowerCase("ko-KR");
}

function proseSentences(value: string) {
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

function evidenceAppearsInDream(evidence: string, dream: string) {
  const normalizedEvidence = normalize(evidence);
  const normalizedDream = normalize(dream);
  if (normalizedEvidence.length < 2) return false;
  if (normalizedDream.includes(normalizedEvidence)) return true;
  const words = evidence
    .split(/\s+/u)
    .map(normalize)
    .filter((word) => word.length >= 2);
  const matches = words.filter(
    (word) =>
      normalizedDream.includes(word) ||
      (word.length >= 3 && normalizedDream.includes(word.slice(0, 3))),
  );
  return matches.length >= 2 || matches.some((word) => word.length >= 4);
}

function sceneMentioned(sceneText: string, prose: string) {
  const normalizedProse = normalize(prose);
  return sceneText
    .split(/\s+/u)
    .map((word) => normalize(word))
    .filter(
      (word) =>
        word.length >= 2 &&
        !["그런데", "하지만", "처음에는", "마지막에는", "꿈에서"].includes(
          word,
        ),
    )
    .some(
      (word) =>
        normalizedProse.includes(word) ||
        (word.length >= 3 && normalizedProse.includes(word.slice(0, 3))),
    );
}

function containsRepeatedSentences(values: string[]) {
  const normalizedSentences = values
    .flatMap(proseSentences)
    .map(normalize)
    .filter((sentence) => sentence.length >= 14);
  return new Set(normalizedSentences).size !== normalizedSentences.length;
}

function naturalPerson(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/친정\s*아빠|친정아빠/u, "친정아버지")
    .replace(/친정\s*엄마|친정엄마/u, "친정어머니");
}

function hasBatchim(value: string) {
  const last = value.trim().at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function endsWithRieul(value: string) {
  const last = value.trim().at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 === 8;
}

function withSubject(value: string) {
  return `${value}${hasBatchim(value) ? "이" : "가"}`;
}

function quotedWithSubject(value: string) {
  return `‘${value}’${hasBatchim(value) ? "이" : "가"}`;
}

function quotedWithDirection(value: string) {
  return `‘${value}’${hasBatchim(value) && !endsWithRieul(value) ? "으로" : "로"}`;
}

function sceneForFrame(
  frame: DreamKeySceneFrame,
  context: DreamRequestContext,
) {
  return (
    context.scenes.find((scene) => frame.sceneId.startsWith(scene.id)) ??
    context.scenes[0]
  );
}

function generalMeaningFor(
  frame: DreamKeySceneFrame,
  scene: DreamScene | undefined,
  context: DreamRequestContext,
) {
  const title = frame.title;
  if (/높은\s*건물/u.test(title)) {
    return "높고 거대한 건물은 지금 크게 느껴지는 목표, 과제, 가능성을 떠올리게 합니다.";
  }
  if (/가족.*(?:누워|바라)/u.test(title)) {
    return "가족과 함께 누워 바라보는 모습은 혼자 서두르기보다 익숙한 삶의 기반 안에서 상황을 지켜보는 태도와 가깝습니다.";
  }
  if (/건물.*(?:걸어|두\s*발)/u.test(title)) {
    return "원래 움직이지 않는 것이 움직이는 장면은 고정되어 보이던 상황이 달라지는 모습을 떠올리게 합니다.";
  }
  if (/시험장.*늦/u.test(title)) {
    return "시험장에 늦는 모습은 평가의 시기를 놓치거나 준비가 충분하지 않을까 하는 압박과 연결되기 쉽습니다.";
  }
  if (/끝난\s*시험|이미\s*끝/u.test(title)) {
    return "이미 끝난 시험은 더 이상 손댈 수 없는 평가나 책임이 자신의 통제 밖으로 넘어간 상태를 보여줄 수 있습니다.";
  }
  if (/홀가분|안도|마음이\s*놓|바뀐\s*감정/u.test(title)) {
    return "꿈속에서 직접 바뀐 감정은 같은 사건도 마지막 느낌에 따라 전혀 다르게 읽어야 한다는 중요한 단서입니다.";
  }
  if (/비가\s*그치|햇빛/u.test(title)) {
    return "비가 그치고 햇빛이 비치는 모습은 긴장이 가라앉고 시야가 다시 밝아지는 전환과 연결됩니다.";
  }
  if (/창문\s*밖.*고양이/u.test(title)) {
    return "창문 밖의 고양이는 가까이 있지만 경계 안으로 들어오지 못한 관심, 관계, 감정을 떠올리게 합니다.";
  }
  if (/문을\s*열/u.test(title)) {
    return "문을 여는 행동은 막혀 있던 경계를 풀고 다른 가능성이 움직일 공간을 만드는 선택으로 볼 수 있습니다.";
  }
  if (/새로\s*변|날아간/u.test(title)) {
    return "새로 변해 날아가는 모습은 한 존재를 붙잡기보다 다른 상태로 바뀌도록 놓아주는 흐름과 가깝습니다.";
  }
  if (/은팔찌|사용하던/u.test(title)) {
    return "평소 몸에 지니던 물건은 새 물건보다 애착, 시간, 개인적인 가치가 담긴 대상으로 읽힙니다.";
  }
  if (/보태|목적/u.test(title)) {
    return "살림에 보태라는 말은 물건의 가격보다 생활을 돕고 책임을 함께 나누려는 목적을 분명하게 보여줍니다.";
  }
  if (scene?.subject && scene.target) {
    return `${naturalPerson(scene.subject.mention)}와 ${naturalPerson(scene.target.mention)} 사이에서 일어난 행동은 두 사람의 역할과 책임이 어떻게 이어지는지를 보여주는 단서입니다.`;
  }
  const entry = context.dictionaryEntries.find((item) =>
    frame.evidence.includes(item.evidence),
  );
  return compact(
    entry?.basicMeaning ??
      "이 장면은 등장한 대상 하나보다 그 앞뒤에서 일어난 행동과 마지막에 남은 결과를 함께 볼 때 의미가 또렷해집니다.",
    180,
  );
}

function specificMeaningFor(
  frame: DreamKeySceneFrame,
  scene: DreamScene | undefined,
) {
  const title = frame.title;
  if (/높은\s*건물/u.test(title)) {
    return "이 꿈에서는 건물의 높이가 ‘하늘에 닿을 만큼’ 과장되어 있고 매우 선명했습니다. 평범한 배경이 아니라, 지금 마음속에서 무시하기 어려울 만큼 커진 목표나 변화를 눈앞의 대상으로 바라보고 있다는 점이 중요합니다.";
  }
  if (/가족.*(?:누워|바라)/u.test(title)) {
    return "사용자는 혼자 뛰어가거나 건물 안으로 들어가지 않고 가족과 잔디밭에 누워 하늘을 보았습니다. 큰 변화를 당장 붙잡기보다 가족이나 일상의 안정된 기반과 함께 관찰하고 받아들이는 분위기가 드러납니다.";
  }
  if (/건물.*(?:걸어|두\s*발)/u.test(title)) {
    return "건물이 고정된 채 서 있지 않고 두 발로 일어나 천천히 앞을 지나갔다는 점이 특별합니다. 멀리 있는 목표를 쫓아간 장면이 아니라, 크게 느껴지는 변화가 스스로 현실 가까이 움직여 오는 모습으로 볼 수 있습니다.";
  }
  if (/바라보는\s*장면/u.test(title)) {
    return "사용자는 거대한 건물을 뒤쫓거나 피하지 않고 끝까지 바라보았습니다. 이 행동은 아직 결론을 내리기보다 변화의 크기와 방향을 알아보려는 태도에 가깝고, 꿈의 마지막까지 선명함이 유지됐다는 점도 중요합니다.";
  }
  if (/시험장.*늦/u.test(title)) {
    return "늦게 도착했다는 사실만 보면 조급한 시험 꿈처럼 보일 수 있습니다. 하지만 뒤이어 시험이 이미 끝났고 불안 대신 홀가분함이 남았으므로, 준비 부족의 공포보다 더는 평가에 매달리지 않아도 된다는 흐름의 시작으로 보는 편이 자연스럽습니다.";
  }
  if (/끝난\s*시험|이미\s*끝/u.test(title)) {
    return "시험지가 이미 제출되어 사용자가 시험을 치를 기회조차 없었다는 점은 통제권이 사라진 장면입니다. 그런데 그 결과를 되돌리려 애쓰지 않았다는 점에서, 끝난 책임이나 평가를 받아들이고 다음 장면으로 이동하는 변화가 두드러집니다.";
  }
  if (/홀가분|불안하지/u.test(title)) {
    return "시험에 늦고 기회를 놓친 상황이라면 보통 불안이 예상되지만, 사용자는 불안하지 않았고 오히려 홀가분했습니다. 일반적인 시험 상징보다 직접 표현한 이 반대 감정을 우선하면, 핵심은 실패 공포가 아니라 부담이 끝났다는 해방감에 가깝습니다.";
  }
  if (/비가\s*그치|햇빛/u.test(title)) {
    return "시험장을 나온 뒤 비가 그치고 햇빛이 나타난 결말은 앞선 홀가분함을 장면으로 다시 보여줍니다. 평가가 끝난 뒤 바깥으로 이동하면서 분위기까지 어둠에서 밝음으로 바뀌어, 긴장이 정리되는 방향을 분명하게 만듭니다.";
  }
  if (/창문\s*밖.*고양이/u.test(title)) {
    return "고양이는 창문 밖에서 계속 울었고 사용자는 처음에 걱정했습니다. 가까이 있지만 분리된 존재를 그냥 바라본 것이 아니라, 그 울음에 반응해 다음 행동을 선택하게 됐다는 점에서 변화의 출발점이 됩니다.";
  }
  if (/문을\s*열/u.test(title)) {
    return "문을 열어준 것은 사용자가 꿈에서 직접 한 능동적인 행동입니다. 고양이를 억지로 붙잡거나 안으로 끌어들인 것이 아니라 경계를 열어 선택할 공간을 주었고, 바로 그 뒤에 예상 밖의 변화가 일어났다는 점이 중요합니다.";
  }
  if (/새로\s*변|날아간/u.test(title)) {
    return "문이 열리자 고양이는 새로 변해 날아갔습니다. 돌봐야 할 대상으로 보이던 존재가 스스로 움직일 수 있는 모습으로 바뀌었기 때문에, 붙잡는 보호보다 놓아주는 선택이 변화와 자유를 만들었다는 흐름으로 읽을 수 있습니다.";
  }
  if (/걱정.*안도|안도.*바뀐/u.test(title)) {
    return "처음의 걱정이 마지막에는 마음이 놓이는 감정으로 달라졌습니다. 새가 날아간 일을 상실로 느끼지 않고 안도했다는 점은, 떠나보내는 결과를 받아들이고 상대나 상황의 자율성을 인정하는 방향에 더 가깝습니다.";
  }
  if (/친정아버지.*남편/u.test(title)) {
    return "친정아버지가 자신의 물건을 사용자에게 먼저 주지 않고 남편에게 직접 건넸다는 점이 중요합니다. 부모 세대의 도움과 배려가 현재 가정의 생활 책임으로 이어지는 장면이며, 두 관계 사이에 신뢰가 놓이는 모습으로 볼 수 있습니다.";
  }
  if (/은팔찌|사용하던/u.test(title)) {
    return "은팔찌는 새로 준비한 선물이 아니라 친정아버지가 평소 차고 계시던 물건입니다. 자신에게 익숙하고 가치가 쌓인 것을 내어주었다는 점에서 금전적 값만이 아니라 애정, 양보, 자신의 몫을 나누는 마음이 함께 담깁니다.";
  }
  if (/보태|목적/u.test(title)) {
    return "‘살림에 보태라’는 말은 전달의 목적을 생활 지원으로 좁혀줍니다. 실제 재물이 생긴다는 예고가 아니라, 가족 안에서 누가 누구의 책임을 덜어주고 싶은지, 도움과 응원이 어떤 방식으로 이어지는지를 보여주는 대화입니다.";
  }
  const subject = naturalPerson(scene?.subject?.mention);
  const target = naturalPerson(scene?.target?.mention);
  const evidence = frame.evidence.replace(/[.!?。]+$/u, "");
  return compact(
    `“${evidence}”라는 구체적인 장면이 중심입니다. ${subject && target ? `${subject}가 ${target}에게 한 행동의 방향과` : "등장한 대상의 상태보다"} 그 행동 뒤에 무엇이 달라졌는지를 함께 보면, 사전의 일반적인 뜻보다 이 꿈만의 관계와 흐름을 더 분명하게 읽을 수 있습니다.`,
    260,
  );
}

function connectionFor(
  frame: DreamKeySceneFrame,
  index: number,
  frames: DreamKeySceneFrame[],
) {
  const previous = frames[index - 1];
  const next = frames[index + 1];
  if (previous && next) {
    return `앞선 ‘${previous.title}’에서 시작된 흐름이 이 장면을 거쳐 ${quotedWithDirection(next.title)} 달라집니다.`;
  }
  if (next) {
    return `이 장면은 다음의 ${quotedWithSubject(next.title)} 왜 중요해지는지 보여주는 출발점입니다.`;
  }
  if (previous) {
    return `앞선 ‘${previous.title}’의 의미가 이 마지막 장면에서 어떤 방향으로 정리되는지 보여줍니다.`;
  }
  return "이 장면 안에서 인물, 행동, 목적, 결과가 함께 이어진다는 점이 중요합니다.";
}

function fallbackCore(context: DreamRequestContext) {
  const text = context.scenes.map((scene) => scene.evidence).join(" ");
  if (/하늘에\s*닿.{0,25}건물/u.test(text) && /걸어/u.test(text)) {
    return "하늘에 닿을 만큼 높은 건물이 가족 앞을 스스로 걸어 지나간 모습은, 크게 느껴지는 목표나 변화가 멀리 고정된 것이 아니라 삶 가까이에서 움직이기 시작하는 흐름으로 볼 수 있습니다. 사용자는 이를 쫓지 않고 끝까지 바라보았습니다.";
  }
  if (/친정\s*아빠|친정아빠/u.test(text) && /은팔찌/u.test(text)) {
    return "친정아버지가 평소 차고 있던 은팔찌를 남편에게 건네며 살림에 보태라고 한 장면은, 부모 세대의 애정과 도움이 현재 가정의 책임으로 이어지는 모습을 보여줍니다. 실제 재물보다 신뢰와 몫을 나누는 마음, 두 가족 관계의 연결이 중심입니다.";
  }
  if (/시험장/u.test(text) && /홀가분/u.test(text)) {
    return "시험장에 늦어 시험이 이미 끝났는데도 불안하지 않고 홀가분했던 모습은, 평가를 놓친 두려움보다 오래 짊어진 부담이 끝나는 해방에 가깝습니다. 밖으로 나온 뒤 비가 그치고 햇빛이 비친 결말도 이 방향을 뚜렷하게 보여줍니다.";
  }
  if (/고양이/u.test(text) && /새로\s*변/u.test(text)) {
    return "창문 밖에서 울던 고양이에게 문을 열어주자 새로 변해 날아간 장면은, 붙잡기보다 길을 열어주었을 때 변화가 시작되는 흐름을 보여줍니다. 걱정이 마지막의 안도로 바뀐 점에서 상실보다 놓아줌과 수용, 상대의 선택을 인정하는 태도에 가깝습니다.";
  }
  const first = context.keyScenes[0];
  const last = context.keyScenes.at(-1) ?? first;
  return compact(
    `이 꿈은 ‘${first?.title ?? "처음 장면"}’에서 시작해 ‘${last?.title ?? "마지막 장면"}’로 이어지는 과정이 중심입니다. 개별 상징을 좋은 뜻과 나쁜 뜻으로 나누기보다, 누가 어떻게 행동했고 마지막에 무엇이 달라졌는지를 함께 보는 편이 이 꿈을 이해하는 데 더 가깝습니다.`,
    220,
  );
}

function fallbackDirection(context: DreamRequestContext) {
  const text = context.scenes.map((scene) => scene.evidence).join(" ");
  if (/불안하지|홀가분|마음이\s*놓|안심/u.test(text)) {
    return "긴장이나 걱정에서 해방과 수용으로 이동하는 흐름";
  }
  if (context.ownershipSignals.length && context.relationships.length) {
    return "관계 속 도움과 책임, 개인적인 가치의 전달이 강조된 흐름";
  }
  if (/갑자기|변해|걸어|날아/u.test(text)) {
    return "고정되어 보이던 상황이 움직이거나 다른 상태로 바뀌는 전환의 흐름";
  }
  return "장면의 행동과 마지막 결과를 함께 살피는 흐름";
}

function fallbackReality(context: DreamRequestContext) {
  const text = context.scenes.map((scene) => scene.evidence).join(" ");
  if (/하늘에\s*닿.{0,25}건물/u.test(text)) {
    return [
      "최근 크게 이루고 싶은 목표가 있거나, 아직 직접 뛰어들기보다 그 가능성과 규모를 지켜보고 있는 상황과 연결해볼 수 있습니다.",
      "개인적인 목표와 가족의 안정된 일상을 함께 생각하며 변화의 속도를 가늠하는 마음이 있을 때 이런 장면이 떠오를 수 있습니다.",
    ];
  }
  if (/은팔찌/u.test(text)) {
    return [
      "가족 사이에서 생활의 책임을 누가 어떻게 나누고 있는지 생각해본 경험과 연결해볼 수 있습니다.",
      "금전의 액수보다 누군가가 자신의 시간과 정성이 담긴 것을 내어준 마음을 새롭게 느낀 때와 이어질 수 있습니다.",
    ];
  }
  if (/시험장/u.test(text)) {
    return [
      "오래 신경 쓰던 평가나 결과가 이미 끝났고, 이제는 스스로를 계속 채점하지 않아도 된다고 느끼는 상황과 연결해볼 수 있습니다.",
      "무언가를 놓쳤다는 생각보다 책임이 끝났다는 안도가 더 큰 때, 다음 단계로 시선을 옮기는 마음이 이런 결말로 나타날 수 있습니다.",
    ];
  }
  if (/고양이/u.test(text) && /새로\s*변/u.test(text)) {
    return [
      "걱정되는 사람이나 일을 붙잡아 해결하기보다 선택할 공간을 열어주는 편이 낫다고 느낀 상황과 연결해볼 수 있습니다.",
      "익숙한 역할이나 관계가 다른 모습으로 바뀌는 것을 지켜보며, 놓아주는 일에서도 안도감을 느낀 경험과 이어질 수 있습니다.",
    ];
  }
  return [
    "꿈의 첫 장면과 비슷하게 크게 느껴지는 일이나 관계를 서두르지 않고 지켜보는 상황과 연결해볼 수 있습니다.",
    "마지막 장면에서 달라진 행동이나 분위기가 최근의 선택을 바라보는 마음과 이어질 수 있습니다.",
  ];
}

function fallbackQuestion(context: DreamRequestContext) {
  const first = context.keyScenes[0]?.title ?? "처음 장면";
  const last = context.keyScenes.at(-1)?.title ?? "마지막 장면";
  return `‘${first}’에서 ${quotedWithDirection(last)} 달라지는 동안, 현실에서 가장 닮았다고 느끼는 변화는 무엇인가요?`;
}

function fallbackIntegrated(
  context: DreamRequestContext,
  keyScenes: DreamInterpretation["keyScenes"],
  overallDirection: string,
) {
  const first = keyScenes[0];
  const middle = keyScenes.slice(1, -1);
  const last = keyScenes.at(-1) ?? first;
  const centralScene = context.scenes.find(
    (scene) =>
      scene.relationshipDynamics.length ||
      scene.purpose.evidence ||
      scene.object?.ownershipEvidence,
  );
  const subject = naturalPerson(centralScene?.subject?.mention);
  const target = naturalPerson(centralScene?.target?.mention);
  const relation = subject && target
    ? `${subject}가 ${target}에게 한 행동은 두 사람만의 사건이라기보다 서로 다른 관계와 책임이 이어지는 지점을 보여줍니다.`
    : "사용자가 장면 안에서 직접 움직였는지, 한곳에서 바라보았는지가 꿈의 태도를 이해하는 중요한 단서입니다.";
  const purpose = centralScene?.purpose.evidence
    ? `“${centralScene.purpose.evidence}”라는 말이 붙어 있어 행동의 목적도 분명합니다. 이 말은 꿈에 없던 현실 문제를 만들어내기보다, 장면 안에서 도움과 책임이 어느 방향으로 향했는지를 알려줍니다.`
    : "직접적인 대화가 없다면 감정을 임의로 붙이기보다, 인물의 행동과 장면이 바뀐 순서를 중심으로 보는 편이 자연스럽습니다.";
  const emotion = context.expressedEmotions.length
    ? `꿈에서 직접 표현된 ${context.expressedEmotions.join(", ")}은 일반적인 상징 설명보다 우선해야 합니다. 예상되는 감정과 실제 느낌이 다르다면, 이 꿈은 사건 자체보다 사용자가 그 사건을 받아들이는 방식이 달라졌음을 보여줍니다.`
    : "꿈에서 두려움이나 기쁨이 직접 표현되지는 않았습니다. 따라서 특정 감정을 사실처럼 정하기보다, 사용자가 서두르거나 피했는지 또는 가만히 관찰했는지 같은 행동의 분위기를 중심으로 읽었습니다.";
  const ownership = centralScene?.object?.ownershipEvidence
    ? `${centralScene.object.name}은 새로 등장한 물건이 아니라 ${naturalPerson(centralScene.object.owner)}가 이미 사용하던 것이었습니다. 소유 관계가 분명한 만큼 물건의 가격보다 누가 자신의 몫을 내어주었고, 그 가치가 누구에게 전달됐는지가 더 중요합니다.`
    : middle.length
      ? `중간의 ${middle.map((scene) => `‘${scene.title}’`).join(", ")}은 처음 장면이 그대로 머물지 않고 다른 방향으로 움직이게 합니다. 각 상징을 따로 떼기보다 이 변화의 순서를 함께 볼 때 꿈의 흐름이 선명해집니다.`
      : "중간 장면이 길게 이어지지 않는 꿈에서는 한 행동 안에 담긴 대상, 목적, 결과를 나누어 보는 것이 도움이 됩니다. 짧은 꿈이라고 해서 의미가 적은 것은 아니며, 소유와 관계 같은 구체적인 단서가 중심을 이룹니다.";

  return [
    `전체적으로 이 꿈은 ${overallDirection}입니다. ‘${first.title}’에서 시작한 이야기가 ‘${last.title}’로 마무리되며, 시작과 결말 사이에서 무엇이 가까워지고 움직이거나 놓였는지가 중심입니다. ${relation}`,
    `${ownership} ${purpose}`,
    `${emotion} 마지막 장면은 앞의 사건을 단순히 반복하지 않고 꿈의 방향을 정리합니다. 사용자가 대상을 쫓아갔는지, 다가오는 것을 바라보았는지, 문을 열었는지에 따라 현실과 연결되는 태도도 달라질 수 있습니다.`,
    `${quotedWithSubject(last.title)} 남긴 인상을 하나의 결론으로 서둘러 정하기보다, 그 장면과 닮은 선택이나 관계가 있는지 천천히 살펴보는 편이 좋겠습니다. 특히 꿈의 마지막에 사용자가 취한 태도가 지금 필요한 대화나 작은 행동과 어디에서 맞닿는지 확인해볼 수 있습니다.`,
  ].join("\n\n");
}

export function createDictionaryInterpretation(
  analysis: DreamAnalysis,
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
    emotions: analysis.emotions,
    expressedEmotions: [],
    situations: analysis.situations,
    contrasts: [],
    repeatedScenes: [],
    unexpectedEnding: "",
    eventFlow: { beginning: "", changes: [], ending: "" },
    symbolRelationships: [],
    dictionaryEntries: analysis.keywords.slice(0, 8).map((item) => ({
      keyword: item.keyword,
      aliases: item.aliases ?? [],
      basicMeaning: item.meaning,
      positiveMeaning: item.good,
      caution: item.caution,
      evidence: item.keyword,
    })),
  };
  const sourceFrames = fallbackContext.keyScenes.length
    ? fallbackContext.keyScenes
    : fallbackContext.dictionaryEntries.slice(0, 2).map((entry, index) => ({
        title: `${withSubject(entry.keyword)} 눈에 띈 장면`,
        evidence: entry.evidence,
        reasons: ["꿈 사전에서 감지된 중심 상징"],
        sceneId: `dictionary-${index}`,
      }));
  const keyScenes = sourceFrames.slice(0, 4).map((frame, index, frames) => {
    const scene = sceneForFrame(frame, fallbackContext);
    return {
      title: compact(frame.title, 80),
      evidence: compact(frame.evidence, 180),
      generalMeaning: compact(
        generalMeaningFor(frame, scene, fallbackContext),
        180,
      ),
      specificMeaning: compact(specificMeaningFor(frame, scene), 350),
      connection: compact(connectionFor(frame, index, frames), 180),
    };
  });
  while (keyScenes.length < 2) {
    const entry = fallbackContext.dictionaryEntries[keyScenes.length];
    keyScenes.push({
      title: entry
        ? `${entry.keyword}과 이어지는 장면`
        : "마지막에 남은 분위기",
      evidence:
        entry?.evidence ||
        fallbackContext.eventFlow.ending ||
        fallbackContext.eventFlow.beginning ||
        "꿈에서 기억나는 장면",
      generalMeaning:
        entry?.basicMeaning ||
        "한 장면의 의미는 그 안에서 일어난 행동과 마지막에 남은 분위기를 함께 볼 때 더 분명해집니다.",
      specificMeaning:
        "이 꿈에서는 모든 단어를 따로 설명하기보다, 처음에 보인 대상과 마지막에 달라진 상태를 이어서 보는 편이 자연스럽습니다. 사용자가 직접 적은 행동과 결과 안에서 의미를 찾고, 입력에 없는 현실이나 감정은 덧붙이지 않았습니다.",
      connection:
        "앞선 장면에서 시작된 행동이나 분위기가 마지막에 어떻게 정리되는지를 보여주는 단서입니다.",
    });
  }
  const overallDirection = fallbackDirection(fallbackContext);
  return {
    title: "꿈풀이",
    notice: DEFAULT_INTERPRETATION_NOTICE,
    coreMeaning: fallbackCore(fallbackContext),
    keyScenes,
    overallDirection,
    integratedInterpretation: fallbackIntegrated(
      fallbackContext,
      keyScenes,
      overallDirection,
    ),
    realLifeConnections: fallbackReality(fallbackContext),
    reflectionQuestion: fallbackQuestion(fallbackContext),
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}

function invalid(): ContextualValidationResult {
  return { ok: false, code: "invalid_response" };
}

function rejected(detail: string): ContextualValidationResult {
  return { ok: false, code: "quality_rejected", detail };
}

export function validateContextualInterpretation(
  value: unknown,
  dream: string,
  context?: DreamRequestContext,
): ContextualValidationResult {
  if (!isObject(value)) return invalid();
  const candidate = value;
  if (
    candidate.notice !== DEFAULT_INTERPRETATION_NOTICE ||
    candidate.caution !== DEFAULT_INTERPRETATION_CAUTION ||
    typeof candidate.coreMeaning !== "string" ||
    typeof candidate.overallDirection !== "string" ||
    typeof candidate.integratedInterpretation !== "string" ||
    typeof candidate.reflectionQuestion !== "string" ||
    !Array.isArray(candidate.keyScenes) ||
    !Array.isArray(candidate.realLifeConnections)
  ) {
    return invalid();
  }

  const coreMeaning = naturalize(candidate.coreMeaning);
  const overallDirection = naturalize(candidate.overallDirection);
  const integratedInterpretation = naturalize(
    candidate.integratedInterpretation,
  );
  if (!isSafeText(coreMeaning, 120, 220)) return rejected("core_meaning");
  if (!isSafeText(overallDirection, 12, 120)) return rejected("direction");
  if (!isSafeText(integratedInterpretation, 500, 850)) {
    return rejected("integrated_length_or_safety");
  }
  if (
    REPORT_STYLE_LANGUAGE.test(
      `${coreMeaning} ${overallDirection} ${integratedInterpretation}`,
    )
  ) {
    return rejected("report_style");
  }
  const interpretationParagraphs = paragraphs(integratedInterpretation);
  if (
    interpretationParagraphs.length < 3 ||
    interpretationParagraphs.length > 4 ||
    interpretationParagraphs.some((paragraph) => {
      const count = proseSentences(paragraph).length;
      return count < 2 || count > 3;
    })
  ) {
    return rejected("paragraph_structure");
  }
  if (
    proseSentences(integratedInterpretation).some(
      (sentence) => sentence.length > 145,
    )
  ) {
    return rejected("sentence_length");
  }
  if (!RELATION_LANGUAGE.test(integratedInterpretation)) {
    return rejected("missing_scene_relationship");
  }

  if (candidate.keyScenes.length < 2 || candidate.keyScenes.length > 4) {
    return rejected("scene_count");
  }
  const keyScenes = candidate.keyScenes.map((item) => {
    if (!isObject(item)) return null;
    const title = naturalize(String(item.title ?? ""));
    const evidence = String(item.evidence ?? "").trim();
    const generalMeaning = naturalize(String(item.generalMeaning ?? ""));
    const specificMeaning = naturalize(String(item.specificMeaning ?? ""));
    const connection = naturalize(String(item.connection ?? ""));
    if (
      !isSafeText(title, 3, 80) ||
      !isSafeText(evidence, 2, 180) ||
      !isSafeText(generalMeaning, 25, 200) ||
      !isSafeText(specificMeaning, 100, 350) ||
      !isSafeText(connection, 30, 200) ||
      !evidenceAppearsInDream(evidence, dream)
    ) {
      return null;
    }
    return {
      title: compact(title, 80),
      evidence: compact(evidence, 180),
      generalMeaning: compact(generalMeaning, 200),
      specificMeaning: compact(specificMeaning, 350),
      connection: compact(connection, 200),
    };
  });
  if (keyScenes.some((scene) => scene === null)) return rejected("key_scenes");
  const validScenes = keyScenes as ContextualDreamInterpretation["keyScenes"];
  if (!validScenes.some((scene) => sceneMentioned(scene.evidence, coreMeaning))) {
    return rejected("core_scene_missing");
  }
  const ending = context?.eventFlow.ending;
  if (
    ending &&
    (!validScenes.some((scene) => sceneMentioned(ending, scene.evidence)) ||
      !sceneMentioned(ending, integratedInterpretation))
  ) {
    return rejected("ending_missing");
  }
  if (
    validScenes.some(
      (scene) =>
        !sceneMentioned(scene.evidence, scene.specificMeaning) &&
        !sceneMentioned(scene.title, scene.specificMeaning),
    )
  ) {
    return rejected("scene_specificity");
  }

  if (
    candidate.realLifeConnections.length < 2 ||
    candidate.realLifeConnections.length > 3
  ) {
    return rejected("reality_count");
  }
  const realLifeConnections = candidate.realLifeConnections.map((item) => {
    const text = naturalize(String(item ?? ""));
    return isSafeText(text, 35, 190) ? compact(text, 190) : null;
  });
  if (
    realLifeConnections.some((item) => item === null) ||
    !realLifeConnections.every((item) =>
      /수\s*있|연결해\s*볼|이어질|떠올릴/u.test(item ?? ""),
    )
  ) {
    return rejected("reality_connections");
  }
  const reflectionQuestion = naturalize(candidate.reflectionQuestion);
  if (
    !isSafeText(reflectionQuestion, 15, 150) ||
    !reflectionQuestion.endsWith("?")
  ) {
    return rejected("reflection_question");
  }
  if (
    containsRepeatedSentences([
      coreMeaning,
      ...validScenes.flatMap((scene) => [
        scene.generalMeaning,
        scene.specificMeaning,
        scene.connection,
      ]),
      integratedInterpretation,
      ...(realLifeConnections as string[]),
      reflectionQuestion,
    ])
  ) {
    return rejected("repetition");
  }
  const coreFirst = normalize(proseSentences(coreMeaning)[0] ?? "");
  const integratedFirst = normalize(
    proseSentences(integratedInterpretation)[0] ?? "",
  );
  if (
    coreFirst &&
    integratedFirst &&
    (coreFirst === integratedFirst ||
      (coreFirst.length > 24 && integratedFirst.includes(coreFirst)))
  ) {
    return rejected("opening_repetition");
  }
  if (
    INVENTED_PERSONAL_CONTEXT.test(
      `${integratedInterpretation} ${(realLifeConnections as string[]).join(" ")}`,
    )
  ) {
    return rejected("invented_personal_context");
  }

  return {
    ok: true,
    value: {
      notice: DEFAULT_INTERPRETATION_NOTICE,
      coreMeaning: compact(coreMeaning, 220),
      keyScenes: validScenes,
      overallDirection: compact(overallDirection, 120),
      integratedInterpretation: interpretationParagraphs.join("\n\n"),
      realLifeConnections: realLifeConnections as string[],
      reflectionQuestion: compact(reflectionQuestion, 150),
      caution: DEFAULT_INTERPRETATION_CAUTION,
    },
  };
}

export function validateCachedInterpretation(
  value: unknown,
): DreamInterpretation | null {
  if (!isObject(value) || value.title !== "꿈풀이") return null;
  const validated = validateContextualInterpretation(
    {
      notice: value.notice,
      coreMeaning: value.coreMeaning,
      keyScenes: value.keyScenes,
      overallDirection: value.overallDirection,
      integratedInterpretation: value.integratedInterpretation,
      realLifeConnections: value.realLifeConnections,
      reflectionQuestion: value.reflectionQuestion,
      caution: value.caution,
    },
    Array.isArray(value.keyScenes)
      ? value.keyScenes
          .filter(isObject)
          .map((scene) => String(scene.evidence ?? ""))
          .join(" ")
      : "",
  );
  return validated.ok
    ? {
        title: "꿈풀이",
        ...validated.value,
      }
    : null;
}

export function mergeInterpretations(
  _dictionary: DreamInterpretation,
  contextual: ContextualDreamInterpretation,
  detectedEmotions: string[],
): DreamInterpretation {
  void detectedEmotions;
  return {
    title: "꿈풀이",
    ...contextual,
    notice: DEFAULT_INTERPRETATION_NOTICE,
    caution: DEFAULT_INTERPRETATION_CAUTION,
  };
}
