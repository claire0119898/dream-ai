import type {
  ContextualDreamInterpretation,
  DreamAnalysis,
  DreamInterpretation,
} from "../types/dream";
import type { DreamRequestContext, DreamScene } from "./dreamContext";

export const DEFAULT_INTERPRETATION_CAUTION =
  "꿈풀이는 현재의 감정과 경험을 돌아보기 위한 참고이며, 미래의 사건이나 건강·재물의 변화를 단정하지 않습니다.";

const TECHNICAL_TERMS = /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/i;
const HTML_TAG = /<\/?[a-z][^>]*>/i;
const DETERMINISTIC_LANGUAGE = /반드시|틀림없이|곧\s*일어난다|확실하게\s*(?:일어난다|된다)|(?:당첨|임신|질병|사고|죽음)(?:할|한다|이다|입니다)/;
const RELATION_LANGUAGE = /함께|이어|연결|변화|흐름|결말|감정|영향|반면|때문|따라|상호|관계/;
const GENERIC_DICTIONARY_OPENING = /^(?:일반적으로|보통|꿈 사전에서|사전적으로).{0,40}(?:상징|의미)/;
const POSSIBILITY_LANGUAGE = /(?:수 있습니다|수도 있습니다|수 있어요|수도 있어요|가능성|가능해 보입니다|지도 모릅니다)/g;
const EMOTION_LANGUAGE = /감정|느낌|불안|두려|긴장|홀가분|걱정|안심|위협|부담|편안|해방|당황|답답|공포|놀람/;
const DICTIONARY_STYLE_LANGUAGE = /(?:을|를|은|는)\s*(?:상징합니다|의미합니다)|(?:으로|라고)\s*해석됩니다/g;
const GENERIC_ENDING = /(?:긍정적으로 생각|편안하게 받아들|마음을 돌아보|좋게 생각|걱정하지 마)(?:세요|보세요)?[.!?。！？]*$/u;
const NO_EXPLICIT_EMOTION =
  /(?:직접|분명하게).{0,18}(?:감정|느낌).{0,18}(?:드러나지|표현되지|적혀 있지|확인되지|언급되지|없)|(?:감정|느낌).{0,18}(?:직접|분명하게|명시).{0,18}(?:드러나지|표현되지|적혀 있지|확인되지|언급되지|않|없|분명하지)/u;
const REPORT_STYLE_LANGUAGE =
  /도모|부각|내포|상징화|범위로서|긍정적인\s*(?:메시지|정서|기운)|유대감.{0,12}(?:깊|단단|견고)|모든\s*(?:고민|문제).{0,10}극복|주위의\s*도움.{0,12}적극적으로/u;
const INVENTED_REALITY_PROBLEM =
  /(?:현재|현실).{0,24}(?:경제적|생활적|가족|관계)?\s*(?:문제|갈등|어려움).{0,12}(?:있|겪)|(?:지원|도움|협력)이\s*필요한\s*시점/u;
const INVENTED_EMOTION_ASSERTION =
  /(?:애정|염원|기쁨|불안|안정감|긍정적인\s*정서|마음).{0,24}(?:나타난\s*것|표출|드러납니다|확인됩니다|느낍니다)/u;
const GENERIC_PHRASES = [
  "현재 마음 상태를 돌아보세요",
  "변화가 필요한 시기입니다",
  "스트레스를 받고 있을 수 있습니다",
  "긍정적으로 생각해보세요",
  "새로운 시작을 의미합니다",
  "전체 분위기를 살펴보는 것이 중요합니다",
  "꿈은 현실을 그대로 예언하지 않습니다",
  "편안하게 받아들여보세요",
];

export type ContextualValidationResult =
  | { ok: true; value: ContextualDreamInterpretation }
  | { ok: false; code: "invalid_response" | "quality_rejected"; detail?: string };

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function naturalizeReportLanguage(value: string) {
  return value
    .replace(/\bmeaning\b/gi, "의미")
    .replace(/도모하고 있습니다/gu, "바라는 흐름으로 이어집니다")
    .replace(/도모합니다/gu, "바라는 모습에 가깝습니다")
    .replace(/부각됩니다/gu, "더 눈에 띕니다")
    .replace(/내포하고 있습니다/gu, "담고 있습니다")
    .replace(/내포합니다/gu, "담고 있습니다")
    .replace(/상징화됩니다/gu, "그렇게 비칠 수 있습니다")
    .replace(/범위로서의?/gu, "면에서의")
    .replace(/긍정적인 메시지/gu, "부드럽게 읽어볼 여지")
    .replace(/긍정적인 정서적 흐름/gu, "한결 편안한 분위기");
}

function compactMultilineText(value: string, maxLength: number) {
  return value
    .split(/\r?\n/)
    .map((line) => compactText(line, maxLength))
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function compactParagraphText(value: string, maxLength: number) {
  return interpretationParagraphs(value)
    .map((paragraph) => compactText(paragraph, maxLength))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, maxLength);
}

function interpretationParagraphs(value: string) {
  const blankLineParagraphs = value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (blankLineParagraphs.length >= 2) return blankLineParagraphs;
  const lineParagraphs = value
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return lineParagraphs.length >= 2 ? lineParagraphs : blankLineParagraphs;
}

function reflowInterpretationParagraphs(value: string) {
  const existing = interpretationParagraphs(value);
  if (
    existing.length >= 2 &&
    existing.length <= 3 &&
    existing.every((paragraph) => {
      const sentenceCount = proseSentences(paragraph).length;
      return sentenceCount >= 2 && sentenceCount <= 4;
    })
  ) return existing.join("\n\n");
  if (existing.length > 3) {
    const groups: string[][] = Array.from({ length: 3 }, () => []);
    existing.forEach((paragraph, index) => {
      groups[Math.min(2, Math.floor((index * 3) / existing.length))].push(paragraph);
    });
    return groups.filter((group) => group.length).map((group) => group.join(" ")).join("\n\n");
  }

  const sentences = value
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];
  if (sentences.length < 3) return value.trim();

  const targetParagraphs = Math.min(3, Math.max(2, Math.ceil(sentences.length / 3)));
  const paragraphs: string[] = [];
  let cursor = 0;
  for (let index = 0; index < targetParagraphs; index += 1) {
    const remainingSentences = sentences.length - cursor;
    const remainingParagraphs = targetParagraphs - index;
    const take = Math.ceil(remainingSentences / remainingParagraphs);
    paragraphs.push(sentences.slice(cursor, cursor + take).join(" "));
    cursor += take;
  }
  return paragraphs.filter(Boolean).join("\n\n");
}

function paragraphCount(value: string) {
  return interpretationParagraphs(value).length;
}

function isSafeText(value: unknown, minLength: number, maxLength: number): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return (
    text.length >= minLength &&
    text.length <= maxLength &&
    !TECHNICAL_TERMS.test(text) &&
    !HTML_TAG.test(text) &&
    !DETERMINISTIC_LANGUAGE.test(text)
  );
}

function normalized(value: string) {
  return value.replace(/\s+/g, "").replace(/["'“”‘’.,!?·:;()[\]{}]/g, "").toLocaleLowerCase("ko-KR");
}

function evidenceAppearsInDream(evidence: string, dream: string) {
  const normalizedEvidence = normalized(evidence);
  const normalizedDream = normalized(dream);
  if (normalizedEvidence.length < 2) return false;
  if (normalizedDream.includes(normalizedEvidence)) return true;

  const evidenceWords = evidence
    .split(/\s+/)
    .map((word) => normalized(word))
    .filter((word) => word.length >= 2);
  const matchingWords = evidenceWords.filter((word) =>
    normalizedDream.includes(word) || (word.length >= 3 && normalizedDream.includes(word.slice(0, 3)))
  );
  return matchingWords.length >= 2 || matchingWords.some((word) => word.length >= 4);
}

const SCENE_STOP_WORDS = new Set(["그리고", "그런데", "하지만", "마지막에는", "처음에는", "꿈에서", "장면", "상황"]);

function sceneRelatesToDream(scene: string, dream: string) {
  if (evidenceAppearsInDream(scene, dream)) return true;
  const dreamText = normalized(dream);
  return scene
    .split(/\s+/)
    .map((word) => word.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter((word) => word.length >= 2 && !SCENE_STOP_WORDS.has(word))
    .some((word) => {
      const normalizedWord = normalized(word);
      return dreamText.includes(normalizedWord) || (normalizedWord.length >= 3 && dreamText.includes(normalizedWord.slice(0, 3)));
    });
}

function sceneMentionedInText(scene: string, text: string) {
  const normalizedText = normalized(text);
  return scene
    .split(/\s+/)
    .map((word) => word.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter((word) => word.length >= 2 && !SCENE_STOP_WORDS.has(word))
    .some((word) => {
      const normalizedWord = normalized(word);
      return normalizedText.includes(normalizedWord) ||
        (normalizedWord.length >= 3 && normalizedText.includes(normalizedWord.slice(0, 3)));
    });
}

function sceneFrameCoverage(context: DreamRequestContext, text: string) {
  const central =
    context.scenes.find((scene) => scene.relationshipDynamics.length || scene.purpose.meanings.length) ??
    context.scenes.find((scene) => scene.subject || scene.object) ??
    context.scenes[0];
  if (!central) return { matched: 0, required: 0 };

  const anchorGroups = [
    [central.subject?.mention, central.subject?.normalizedRole],
    [central.target?.mention, central.target?.normalizedRole],
    [central.object?.name],
    [central.purpose.evidence, ...central.purpose.meanings],
    [central.action.surface, central.action.normalized, ...central.action.subtypes],
  ]
    .map((group) => group.filter((item): item is string => Boolean(item && item.length >= 2)))
    .filter((group) => group.length);
  const matched = anchorGroups.filter((group) =>
    group.some((anchor) => sceneMentionedInText(anchor, text))
  ).length;
  return { matched, required: Math.min(3, anchorGroups.length) };
}

function possibilityCount(value: string) {
  return value.match(POSSIBILITY_LANGUAGE)?.length ?? 0;
}

function genericPhraseCount(value: string) {
  return GENERIC_PHRASES.filter((phrase) => value.includes(phrase)).length;
}

function containsRepeatedSentences(values: string[]) {
  const sentences = values
    .flatMap((value) => value.split(/[.!?。！？\n]+/))
    .map((sentence) => normalized(sentence))
    .filter((sentence) => sentence.length >= 12);
  return new Set(sentences).size !== sentences.length;
}

function proseSentences(value: string) {
  return value
    .replace(/\n+/g, " ")
    .match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];
}

function hasLongCopiedPhrase(dream: string, interpretation: string) {
  const dreamWords = dream
    .replace(/[“”"'‘’.,!?。！？()[\]{}]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (dreamWords.length < 9) {
    return normalized(dream).length >= 28 && normalized(interpretation).includes(normalized(dream));
  }
  const normalizedInterpretation = normalized(interpretation);
  for (let index = 0; index <= dreamWords.length - 9; index += 1) {
    const phrase = normalized(dreamWords.slice(index, index + 9).join(" "));
    if (phrase.length >= 24 && normalizedInterpretation.includes(phrase)) return true;
  }
  return false;
}

function ownershipContextCovered(context: DreamRequestContext, text: string) {
  if (!context.ownershipSignals.length) return true;
  return context.ownershipSignals.some((object) =>
    sceneMentionedInText(object.name, text) &&
    (
      sceneMentionedInText(object.ownershipEvidence, text) ||
      (
        sceneMentionedInText(object.owner, text) &&
        /차고|끼고|신던|입던|평소.{0,10}(?:쓰|차|끼|신|입)|몸에\s*지니|사용하던|간직하던|아끼던/u.test(text)
      )
    )
  );
}

function excessiveCoreWordRepetition(value: string) {
  return ["지원", "관계", "가정", "의미", "상징"].some((word) => value.split(word).length - 1 > 6);
}

function symbolKey(value: string) {
  return value.replace(/[^가-힣a-zA-Z0-9]/g, "").toLocaleLowerCase("ko-KR");
}

function invalid(): ContextualValidationResult {
  return { ok: false, code: "invalid_response" };
}

function qualityRejected(detail: string): ContextualValidationResult {
  return { ok: false, code: "quality_rejected", detail };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasBatchim(word: string) {
  const code = word.charCodeAt(word.length - 1);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

function withObjectParticle(word: string) {
  return `${word}${hasBatchim(word) ? "을" : "를"}`;
}

function withSubjectParticle(word: string) {
  return `${word}${hasBatchim(word) ? "이" : "가"}`;
}

function withDirectionParticle(word: string) {
  return `${word}${hasBatchim(word) ? "으로" : "로"}`;
}

function actionModifier(action: string) {
  const modifiers: Record<string, string> = {
    "주다": "주는",
    "받다": "받는",
    "돕다": "돕는",
    "피하다": "피하는",
    "쫓다": "쫓는",
    "맞서다": "맞서는",
    "사라지다": "사라지는",
    "결혼하다": "결혼하는",
    "태어나다": "태어나는",
    "평가받다": "평가받는",
    "올라가다": "올라가는",
    "내려가다": "내려가는",
    "떨어지다": "떨어지는",
    "날다": "나는",
    "변하다": "변하는",
    "열고 닫다": "열거나 닫는",
    "찾다": "찾는",
    "잃다": "잃는",
    "들어오다": "들어오는",
    "나오다": "나오는",
    "말하다": "말하는",
    "고치다": "고치는",
    "밝히다": "밝혀주는",
    "상태가 이어지다": "상태가 이어지는",
  };
  return modifiers[action] ?? `${action.replace(/다$/u, "")}는`;
}

function naturalPersonName(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/친정\s*아빠/u, "친정아버지")
    .replace(/친정아빠/u, "친정아버지")
    .replace(/친정\s*엄마/u, "친정어머니")
    .replace(/친정엄마/u, "친정어머니");
}

function sceneSentence(scene: DreamScene) {
  const subject = naturalPersonName(scene.subject?.mention) || "꿈속의 인물";
  const targetName = naturalPersonName(scene.target?.mention);
  const target = targetName ? `${targetName}에게 ` : "";
  const descriptiveObject =
    scene.object?.attributes.includes("따뜻함")
      ? `따뜻한 ${scene.object.name}`
      : scene.object?.name === "문" && /낡은\s*집/u.test(scene.evidence)
        ? "낡은 집의 문"
        : scene.object?.name ?? "";
  const ownedObject = scene.object?.ownershipEvidence || descriptiveObject;
  const object = ownedObject ? `${withObjectParticle(ownedObject)} ` : "";
  const purpose = scene.purpose.evidence ? `“${scene.purpose.evidence}”라는 뜻을 전하며 ` : "";
  const silence = /아무\s*말\s*없이|말없이/u.test(scene.evidence) ? "아무 말 없이 " : "";
  const action =
    scene.action.normalized === "주다" || scene.action.normalized === "선물하다"
      ? "건네는"
      : actionModifier(scene.action.normalized);
  return `${subject}가 ${target}${silence}${object}${purpose}${action} 장면`;
}

function relationshipProse(scene: DreamScene) {
  const subject = naturalPersonName(scene.subject?.mention) || "한 인물";
  const target = naturalPersonName(scene.target?.mention) || "다른 대상";
  if (!scene.target) {
    return `${subject}의 행동이 장면의 분위기와 이후 흐름을 이끌고 있습니다.`;
  }
  if (scene.action.subtypes.includes("지원") || scene.action.normalized === "주다") {
    const familyBridge =
      scene.subject?.familySystem && scene.target?.familySystem
        ? `${scene.subject.familySystem}에서 건넨 마음이 ${withDirectionParticle(scene.target.familySystem)} 이어지는`
        : "두 사람 사이에서 도움과 책임이 오가는";
    return `${subject}가 ${target}에게 직접 행동했다는 점은, ${familyBridge} 모습에 가깝습니다.`;
  }
  if (scene.action.subtypes.includes("갈등")) {
    return `${subject}와 ${target}의 관계에서 느껴지는 거리나 긴장이 행동을 통해 드러난 장면으로 볼 수 있습니다.`;
  }
  return `${subject}와 ${withSubjectParticle(target)} 맺고 있는 관계가 말보다 행동을 통해 드러난다는 점이 중요합니다.`;
}

function purposeProse(scene: DreamScene) {
  if (!scene.purpose.evidence) return "";
  if (scene.purpose.meanings.some((meaning) => /생활 지원|책임 분담|가정의 안정/u.test(meaning))) {
    return `특히 “${scene.purpose.evidence}”라는 말이 함께 있어, 물건의 값보다 생활을 돕고 서로의 몫을 나누려는 뜻에 무게가 실립니다.`;
  }
  return `“${scene.purpose.evidence}”라는 말은 이 행동이 우연히 일어난 것이 아니라, 상대에게 전하고 싶은 뜻이 있었음을 보여줍니다.`;
}

function ownershipProse(scene: DreamScene) {
  const object = scene.object;
  if (!object?.ownershipEvidence) return "";
  const subject = naturalPersonName(scene.subject?.mention) || object.owner || "그 인물";
  const target = naturalPersonName(scene.target?.mention);
  const transfer = target ? `${target}에게 내어주었다는 점` : "다른 이에게 내어놓았다는 점";
  return `${withSubjectParticle(object.name)} 특별하게 느껴지는 이유는 ${subject}가 이미 몸에 지니거나 사용하던 물건이기 때문입니다. 새로 마련한 것이 아니라 자신의 것을 ${transfer}에서, 도움뿐 아니라 개인적인 정과 신뢰까지 함께 읽어볼 수 있습니다. 이는 자신이 맡아온 몫을 다음 관계와 나누는 모습이기도 합니다.`;
}

function objectContextProse(scene: DreamScene) {
  const object = scene.object;
  if (!object) return "";
  if (object.attributes.includes("따뜻함") && /그릇/u.test(object.name)) {
    return `따뜻한 ${object.name}은 값비싼 물건이라기보다 한 끼를 챙겨주는 돌봄과 온기에 가깝습니다. 더구나 아무 말 없이 손에 쥐여주었다는 점에서, 설명보다 오래 남은 기억이나 보살핌이 조용히 전해지는 모습으로 볼 수 있습니다.`;
  }
  if (object.name === "문" && object.attributes.includes("시간이 지난 상태")) {
    return `낡은 집의 문을 고치는 모습은 오래 불편했던 경계나 생활의 한 부분을 다시 손보는 장면에 가깝습니다. 망가진 것을 버리는 대신 고쳐 쓰려 했다는 점에서, 관계나 일상을 천천히 회복하려는 방향을 떠올려볼 수 있습니다.`;
  }
  return "";
}

function atmosphereProse(scene: DreamScene) {
  if (scene.action.subtypes.includes("지원") || scene.action.normalized === "주다") {
    return "서로의 몫을 나누고 마음을 건네는";
  }
  if (scene.action.subtypes.includes("갈등") || scene.action.subtypes.includes("회피")) {
    return "관계의 거리와 긴장을 살피게 하는";
  }
  if (scene.action.subtypes.includes("변화") || scene.action.subtypes.includes("전환")) {
    return "한 상태가 다른 방향으로 움직이는";
  }
  return "인물과 행동의 관계를 천천히 살피게 하는";
}

function sceneBasedInterpretation(_analysis: DreamAnalysis, context: DreamRequestContext) {
  const meaningfulScenes = context.scenes.filter(
    (scene) =>
      scene.subject ||
      scene.target ||
      scene.object ||
      scene.action.normalized !== "상태가 이어지다"
  );
  const central =
    meaningfulScenes.find((scene) => scene.relationshipDynamics.length || scene.purpose.meanings.length) ??
    meaningfulScenes[0] ??
    context.scenes[0];
  if (!central) return null;

  const centralSentence = sceneSentence(central);
  const relationship = relationshipProse(central);
  const purpose = purposeProse(central);
  const ownership = ownershipProse(central);
  const objectContext = objectContextProse(central);
  const beginning = context.eventFlow.beginning;
  const ending = context.eventFlow.ending;
  const endingChanged = beginning !== ending;
  const hasNarrativeFlow =
    meaningfulScenes.length > 1 &&
    context.eventFlow.changes.length > 0 &&
    endingChanged;
  const lastScene = meaningfulScenes.at(-1);
  const lastSceneSentence = lastScene && lastScene !== central ? sceneSentence(lastScene) : "";
  const subject = naturalPersonName(central.subject?.mention) || "장면의 인물";
  const target = naturalPersonName(central.target?.mention) || "상대";
  const purposeTopic = central.purpose.meanings.some((meaning) => /생활|책임|가정|지원/u.test(meaning));

  const paragraph1 = [
    `이 꿈에서 가장 눈에 띄는 부분은 ${centralSentence}입니다.`,
    relationship,
    purpose,
  ].filter(Boolean).join(" ");
  const paragraph2 = ownership || objectContext || (
    context.expressedEmotions.length
      ? `꿈에서 직접 드러난 ${context.expressedEmotions.join(", ")}은 이 장면을 이해하는 중요한 단서입니다. 같은 행동도 마지막에 남은 느낌에 따라 전혀 다르게 받아들여질 수 있습니다.`
      : `꿈속에서 기쁨이나 불안 같은 감정이 직접 표현되지는 않았습니다. 그래서 어느 한 감정을 사실처럼 정하기보다, ${atmosphereProse(central)} 분위기로 조심스럽게 읽는 편이 자연스럽습니다.`
  );
  const flowParagraph = hasNarrativeFlow && lastSceneSentence
    ? `꿈은 ${centralSentence}에서 ${lastSceneSentence} 쪽으로 움직입니다. 처음의 관계가 마지막 장면에서 어떻게 달라졌는지를 보면, 이 꿈이 무엇을 오래 남기고 있는지 이해하는 데 도움이 됩니다.`
    : "";
  const isDeceasedGrandparent = /돌아가신\s+(?:할머니|할아버지)/u.test(central.subject?.mention ?? "");
  const isSharedRepair = meaningfulScenes.some((scene) => scene.action.normalized === "고치다") &&
    meaningfulScenes.some((scene) => scene.action.normalized === "밝히다");
  const isChildShoes = central.object?.name === "신발" && central.object.owner.includes("아들");
  const realitySentence = isDeceasedGrandparent
    ? `할머니와 함께했던 식사나 보살핌의 기억이 문득 가까워졌거나, 요즘 누군가에게 따뜻하게 챙김을 받고 싶은 마음이 있을 때 이런 장면이 떠오를 수 있습니다.`
    : isSharedRepair
      ? `최근 집안의 일을 가족과 함께 바로잡고 있거나, 한 사람이 문제를 고칠 때 다른 사람이 곁을 밝혀주는 관계를 의식했다면 이 장면과 연결해 볼 수 있습니다.`
      : isChildShoes
        ? `아이의 성장을 실감했거나, 이제는 맞지 않는 것을 필요한 누군가에게 자연스럽게 나누어도 좋겠다고 느낀 경험과 이어질 수 있습니다.`
        : purposeTopic
          ? `최근 살림이나 가족의 책임을 두고 누군가의 도움을 떠올렸거나, ${subject}와 ${target} 사이의 관계를 마음에 두고 있었다면 이런 장면이 나타날 수 있습니다.`
          : `최근 ${subject}와 ${target} 사이에서 꿈과 비슷한 행동을 주고받은 경험이 마음에 남아 있었다면 이 장면과 연결해 볼 수 있습니다.`;
  const question = isDeceasedGrandparent
    ? `최근 할머니의 밥이나 보살핌을 떠올리게 한 순간이 있었나요?`
    : isSharedRepair
      ? `요즘 함께 고쳐가고 싶은 집안의 일과, 그 곁에서 힘을 보태는 사람은 누구인가요?`
      : isChildShoes
        ? `아이의 성장과 함께 이제 자연스럽게 놓아주어도 좋겠다고 느끼는 것은 무엇인가요?`
        : central.purpose.evidence
          ? `요즘 “${central.purpose.evidence}”라는 말처럼 누군가의 도움이나 배려를 새삼 크게 느낀 일이 있었나요?`
          : `꿈의 마지막 장면을 다시 떠올렸을 때, 관계에서 가장 마음에 남는 부분은 무엇인가요?`;
  const middleParagraph = [paragraph2, flowParagraph].filter(Boolean).join(" ");
  const integratedParagraphs = [paragraph1, middleParagraph, realitySentence].filter(Boolean);
  const mainThemes = [...new Set([
    ...central.purpose.meanings,
    ...central.relationshipDynamics,
    ...central.action.subtypes,
  ])].slice(0, 2);
  const summary = compactText(
    central.action.normalized === "주다" || central.action.subtypes.includes("지원")
      ? `이 꿈은 ${mainThemes.join("과 ") || "도움과 책임"}이 한 관계에서 다른 관계로 이어지는 모습을 담고 있습니다. ${central.object?.name ?? "물건"} 자체보다 누가 자신의 몫을 내어주었고 그 마음이 누구에게 향했는지가 중심이며, 가까운 사람 사이에서 오간 배려의 무게를 돌아보게 합니다.`
      : `이 꿈은 ${mainThemes.join("과 ") || atmosphereProse(central)} 흐름을 담고 있습니다. 개별 상징보다 ${subject}와 ${target} 사이에서 어떤 행동이 일어났고 마지막에 무엇이 달라졌는지가 중심입니다. 최근 비슷한 관계나 선택을 마주한 경험과 나란히 살펴볼 수 있습니다.`,
    180
  );

  return {
    summary,
    emotion: context.expressedEmotions.length
      ? `꿈에서 직접 드러난 감정은 ${context.expressedEmotions.join(", ")}입니다. 장면에서 예상되는 분위기보다 사용자가 실제로 느낀 감정을 먼저 놓고 보는 편이 자연스럽습니다.`
      : `꿈속에서 직접 표현된 감정은 없습니다. 따라서 특정 감정을 만들어내기보다, ${atmosphereProse(central)} 장면의 분위기만 조심스럽게 살펴봅니다.`,
    flow: `시작: ${compactText(beginning, 150)}\n변화: ${context.eventFlow.changes.length ? `${context.eventFlow.changes.length}개의 장면을 거쳐 흐름이 이어집니다.` : "중심 사건이 한 장면 안에서 이어집니다."}\n마지막: ${compactText(ending, 150)}\n${endingChanged ? "처음과 마지막 사이에서 인물의 행동과 관계가 어떻게 달라지는지가 중요한 단서입니다." : "한 장면에 머문 만큼 행동의 이유와 관계의 방향이 중심이 됩니다."}`,
    interpretation: integratedParagraphs.join("\n\n"),
    reflectionPoints: [question],
    guidance:
      `• ${subject}와 ${target} 사이에서 실제로 오간 행동을 한 문장으로 적어보세요.\n• ${central.object?.name ? `${withSubjectParticle(central.object.name)} 누구의 것이었고 왜 특별했는지` : "그 행동이 왜 일어났고 무엇으로 이어졌는지"} 떠올려보세요.\n• 꿈의 마지막 분위기와 최근 비슷하게 느낀 장면이 있었는지 가볍게 비교해보세요.`,
    hasExplicitEmotion: context.expressedEmotions.length > 0,
    hasNarrativeFlow,
  };
}

export function createDictionaryInterpretation(
  analysis: DreamAnalysis,
  context?: DreamRequestContext
): DreamInterpretation {
  const sceneBased = context ? sceneBasedInterpretation(analysis, context) : null;
  const contextualObjects = context?.ownershipSignals.map((object) => ({
    name: object.name,
    meaning: `${object.owner ? `${naturalPersonName(object.owner)}가 ` : ""}“${object.ownershipEvidence || object.name}”라는 점 때문에, 새 물건보다 개인적인 정과 시간이 담긴 대상으로 볼 수 있습니다.`,
  })) ?? [];
  const dictionarySymbols = analysis.keywords.slice(0, 6).map((item) => ({
    name: `${item.emoji ?? ""} ${item.keyword}`.trim(),
    meaning: `${item.meaning} ${item.good}`.trim(),
  }));

  return {
    title: "꿈풀이",
    summary: sceneBased?.summary ?? analysis.summary,
    symbols: [...contextualObjects, ...dictionarySymbols]
      .filter((symbol, index, all) =>
        all.findIndex((item) => symbolKey(item.name) === symbolKey(symbol.name)) === index
      )
      .slice(0, 5),
    emotion: sceneBased?.emotion ?? (analysis.emotions.length
      ? `꿈속에서 ${analysis.emotions.join(", ")}의 감정이 두드러집니다. 이 감정은 최근 경험이나 마음의 긴장과 이어져 있을 수 있습니다.`
      : "꿈속 감정이 분명하게 드러나지 않았다면, 깨어난 직후 가장 오래 남았던 기분을 함께 떠올려보세요."),
    flow: sceneBased?.flow ?? (analysis.situations.length
      ? `${analysis.situations.join(", ")}의 흐름이 나타납니다. 장면이 어떻게 시작되고 끝났는지도 의미를 이해하는 단서가 됩니다.`
      : "뚜렷한 상황 유형보다 등장한 상징과 전체 분위기를 중심으로 살펴보는 편이 자연스럽습니다."),
    interpretation: sceneBased?.interpretation ?? analysis.interpretation,
    reflectionPoints: sceneBased?.reflectionPoints ?? [],
    guidance: sceneBased?.guidance ?? analysis.advice,
    caution: DEFAULT_INTERPRETATION_CAUTION,
    hasExplicitEmotion: sceneBased?.hasExplicitEmotion ?? analysis.emotions.length > 0,
    hasNarrativeFlow: sceneBased?.hasNarrativeFlow ?? analysis.situations.length > 1,
  };
}

export function validateContextualInterpretation(
  value: unknown,
  dream: string,
  context?: DreamRequestContext
): ContextualValidationResult {
  if (!isObject(value)) return invalid();
  const candidate = value;
  if (!isObject(candidate.emotionAnalysis) || !isObject(candidate.flowAnalysis)) return invalid();
  if (
    typeof candidate.summary !== "string" ||
    typeof candidate.integratedInterpretation !== "string" ||
    typeof candidate.caution !== "string"
  ) return invalid();
  if (!Array.isArray(candidate.symbols) || candidate.symbols.length < 1 || candidate.symbols.length > 3) {
    return invalid();
  }
  if (!Array.isArray(candidate.lifeGuidance) || candidate.lifeGuidance.length !== 3) {
    return invalid();
  }
  if (!Array.isArray(candidate.personalConnection) || candidate.personalConnection.length < 1 || candidate.personalConnection.length > 2) {
    return invalid();
  }
  if (!Array.isArray(candidate.reflectionQuestions) || candidate.reflectionQuestions.length !== 1) {
    return invalid();
  }
  const summary = naturalizeReportLanguage(candidate.summary);
  const integratedInterpretation = naturalizeReportLanguage(
    reflowInterpretationParagraphs(candidate.integratedInterpretation)
  );
  const emotion = candidate.emotionAnalysis;
  const flow = candidate.flowAnalysis;
  if (
    typeof emotion.expressedEmotion !== "string" ||
    typeof emotion.contrast !== "string" ||
    typeof emotion.interpretation !== "string" ||
    typeof flow.beginning !== "string" ||
    typeof flow.change !== "string" ||
    typeof flow.ending !== "string" ||
    typeof flow.meaning !== "string"
  ) return invalid();
  const expressedEmotion = naturalizeReportLanguage(emotion.expressedEmotion);
  const emotionContrast = naturalizeReportLanguage(emotion.contrast);
  const emotionInterpretation = naturalizeReportLanguage(emotion.interpretation);
  const flowBeginning = naturalizeReportLanguage(flow.beginning);
  const flowChange = naturalizeReportLanguage(flow.change);
  const flowEnding = naturalizeReportLanguage(flow.ending);
  const flowMeaning = naturalizeReportLanguage(flow.meaning);

  if (!isSafeText(summary, 120, 180)) {
    const rejectedSummary = String(summary);
    if (rejectedSummary.length < 120 || rejectedSummary.length > 180) return qualityRejected("summary_length");
    if (TECHNICAL_TERMS.test(rejectedSummary)) return qualityRejected("summary_technical");
    if (HTML_TAG.test(rejectedSummary)) return qualityRejected("summary_html");
    return qualityRejected("summary_deterministic");
  }
  if (!isSafeText(expressedEmotion, 2, 160)) return qualityRejected("expressed_emotion");
  if (!isSafeText(emotionContrast, 5, 220)) return qualityRejected("emotion_contrast");
  if (!isSafeText(emotionInterpretation, 150, 350)) return qualityRejected("emotion_interpretation");
  if (!isSafeText(flowBeginning, 2, 180)) return qualityRejected("flow_beginning");
  if (!isSafeText(flowChange, 2, 220)) return qualityRejected("flow_change");
  if (!isSafeText(flowEnding, 2, 180)) return qualityRejected("flow_ending");
  if (!isSafeText(flowMeaning, 150, 400)) return qualityRejected("flow_meaning");
  if (!isSafeText(integratedInterpretation, 450, 700)) return qualityRejected("integrated_length_or_safety");
  if (paragraphCount(integratedInterpretation) < 2 || paragraphCount(integratedInterpretation) > 3) {
    return qualityRejected("paragraph_count");
  }
  if (genericPhraseCount(integratedInterpretation) > 1) return qualityRejected("generic_phrases");
  if (REPORT_STYLE_LANGUAGE.test(`${summary} ${emotionInterpretation} ${integratedInterpretation}`)) {
    return qualityRejected("report_style");
  }
  if (/\bmeaning\b/i.test(integratedInterpretation)) return qualityRejected("foreign_placeholder");
  if ((integratedInterpretation.match(DICTIONARY_STYLE_LANGUAGE) ?? []).length >= 3) {
    return qualityRejected("dictionary_style_repetition");
  }
  if (GENERIC_ENDING.test(integratedInterpretation.trim())) return qualityRejected("generic_ending");
  if (proseSentences(integratedInterpretation).some((sentence) => sentence.length > 150)) {
    return qualityRejected("sentence_too_long");
  }
  if (
    interpretationParagraphs(integratedInterpretation).some((paragraph) => {
      const count = proseSentences(paragraph).length;
      return count < 2 || count > 4;
    })
  ) return qualityRejected("paragraph_rhythm");
  if (possibilityCount(integratedInterpretation) > 2) return qualityRejected("too_many_possibilities");
  if (excessiveCoreWordRepetition(integratedInterpretation)) return qualityRejected("word_repetition");
  if (hasLongCopiedPhrase(dream, integratedInterpretation)) return qualityRejected("copied_dream_text");
  if (candidate.caution !== DEFAULT_INTERPRETATION_CAUTION) return qualityRejected("caution");
  if (!RELATION_LANGUAGE.test(integratedInterpretation)) return qualityRejected("missing_relationship");
  if (GENERIC_DICTIONARY_OPENING.test(summary.trim())) return qualityRejected("dictionary_opening");

  const symbols = candidate.symbols.map((symbol) => {
    if (!isObject(symbol)) return null;
    if (typeof symbol.name !== "string" || typeof symbol.contextualMeaning !== "string" || typeof symbol.evidence !== "string") {
      return null;
    }
    if (!isSafeText(symbol.name, 1, 80)) return null;
    if (!isSafeText(symbol.contextualMeaning, 50, 260)) return null;
    if (!isSafeText(symbol.evidence, 2, 160)) return null;
    if (!evidenceAppearsInDream(symbol.evidence, dream)) return null;
    return {
      name: compactText(symbol.name, 80),
      contextualMeaning: compactText(symbol.contextualMeaning, 260),
      evidence: compactText(symbol.evidence, 160),
    };
  });
  const validSymbols = symbols.filter(
    (symbol): symbol is NonNullable<(typeof symbols)[number]> => symbol !== null
  );
  const requiredSymbols = context?.scenes.length === 1 ? 1 : 2;
  if (validSymbols.length < requiredSymbols) return qualityRejected("symbols");

  const lifeGuidance = candidate.lifeGuidance.map((guidance) =>
    isSafeText(guidance, 15, 160) ? compactText(guidance, 160) : null
  );
  if (lifeGuidance.some((guidance) => guidance === null)) return qualityRejected("guidance");

  const personalConnection = candidate.personalConnection.map((connection) =>
    isSafeText(connection, 35, 180)
      ? compactText(connection, 180)
      : null
  );
  if (
    personalConnection.some((connection) => connection === null) ||
    new Set(personalConnection.map((connection) => normalized(connection ?? ""))).size !== personalConnection.length ||
    possibilityCount((personalConnection as string[]).join(" ")) < 1
  ) return qualityRejected("personal_connection");

  const reflectionQuestions = candidate.reflectionQuestions.map((question) =>
    isSafeText(question, 15, 140) && question.trim().endsWith("?")
      ? compactText(question, 140)
      : null
  );
  if (
    reflectionQuestions.some((question) => question === null) ||
    new Set(reflectionQuestions.map((question) => normalized(question ?? ""))).size !== reflectionQuestions.length
  ) return qualityRejected("reflection_questions");

  const validatedSymbols = validSymbols as ContextualDreamInterpretation["symbols"];
  const sceneEvidence = [
    ...validatedSymbols.map((symbol) => symbol.evidence),
    flowBeginning,
    flowChange,
    flowEnding,
  ].filter((evidence, index, all) => sceneRelatesToDream(evidence, dream) && all.indexOf(evidence) === index);
  // 한 문장 안에 주체·대상·물건·목적이 모두 담긴 꿈은 동일한 원문 구절이
  // 여러 출력 필드의 근거가 될 수 있습니다. 서로 다른 근거 문구 수를 억지로
  // 늘리기보다 아래 sceneFrameCoverage에서 관계 요소 3개 이상을 따로 확인합니다.
  const requiredSceneEvidence = context?.scenes.length === 1 ? 1 : 3;
  if (sceneEvidence.length < requiredSceneEvidence || !sceneRelatesToDream(flowEnding, dream)) {
    return qualityRejected("scene_evidence");
  }
  const integratedScenes = sceneEvidence.filter((scene) =>
    sceneMentionedInText(scene, integratedInterpretation)
  );
  if (
    integratedScenes.length < requiredSceneEvidence ||
    !sceneMentionedInText(flowEnding, integratedInterpretation) ||
    !EMOTION_LANGUAGE.test(integratedInterpretation)
  ) return qualityRejected("integrated_scene_coverage");
  if (context) {
    const central =
      context.scenes.find((scene) => scene.relationshipDynamics.length || scene.purpose.meanings.length) ??
      context.scenes.find((scene) => scene.subject || scene.object) ??
      context.scenes[0];
    const coverage = sceneFrameCoverage(context, `${summary} ${integratedInterpretation}`);
    if (coverage.matched < coverage.required) return qualityRejected("scene_frame_coverage");
    const firstParagraph = interpretationParagraphs(integratedInterpretation)[0] ?? "";
    const openingCoverage = sceneFrameCoverage(context, firstParagraph);
    if (openingCoverage.matched < openingCoverage.required) return qualityRejected("opening_scene_coverage");
    if (
      central?.purpose.evidence &&
      !sceneMentionedInText(central.purpose.evidence, firstParagraph)
    ) return qualityRejected("opening_purpose");
    if (!ownershipContextCovered(context, integratedInterpretation)) {
      return qualityRejected("ownership_context");
    }
    if (
      context.expressedEmotions.length === 0 &&
      !NO_EXPLICIT_EMOTION.test(expressedEmotion)
    ) {
      return qualityRejected("invented_emotion");
    }
    if (
      context.expressedEmotions.length === 0 &&
      INVENTED_EMOTION_ASSERTION.test(`${emotionContrast} ${emotionInterpretation}`)
    ) return qualityRejected("invented_emotion_assertion");
    if (
      !/(문제|갈등|어려|힘들|곤란|막막)/u.test(dream) &&
      INVENTED_REALITY_PROBLEM.test(integratedInterpretation)
    ) return qualityRejected("invented_reality_problem");
  }

  if (
    containsRepeatedSentences([integratedInterpretation]) ||
    containsRepeatedSentences(personalConnection as string[]) ||
    containsRepeatedSentences(reflectionQuestions as string[]) ||
    containsRepeatedSentences(lifeGuidance as string[])
  ) return qualityRejected("repetition");

  return {
    ok: true,
    value: {
      summary: compactText(summary, 180),
      symbols: validatedSymbols,
      emotionAnalysis: {
        expressedEmotion: compactText(expressedEmotion, 160),
        contrast: compactText(emotionContrast, 220),
        interpretation: compactText(emotionInterpretation, 350),
      },
      flowAnalysis: {
        beginning: compactText(flowBeginning, 180),
        change: compactText(flowChange, 220),
        ending: compactText(flowEnding, 180),
        meaning: compactText(flowMeaning, 400),
      },
      integratedInterpretation: compactParagraphText(integratedInterpretation, 700),
      personalConnection: personalConnection as string[],
      reflectionQuestions: reflectionQuestions as string[],
      lifeGuidance: lifeGuidance as string[],
      caution: DEFAULT_INTERPRETATION_CAUTION,
    },
  };
}

export function validateCachedInterpretation(value: unknown): DreamInterpretation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.title !== "꿈풀이" ||
    !isSafeText(candidate.summary, 120, 180) ||
    !isSafeText(candidate.emotion, 150, 1400) ||
    !isSafeText(candidate.flow, 180, 1800) ||
    !isSafeText(candidate.interpretation, 450, 700) ||
    !isSafeText(candidate.guidance, 45, 1400) ||
    candidate.caution !== DEFAULT_INTERPRETATION_CAUTION ||
    typeof candidate.hasExplicitEmotion !== "boolean" ||
    typeof candidate.hasNarrativeFlow !== "boolean" ||
    !Array.isArray(candidate.symbols) ||
    !Array.isArray(candidate.reflectionPoints) ||
    candidate.reflectionPoints.length < 1 ||
    candidate.reflectionPoints.length > 3 ||
    candidate.symbols.length > 3
  ) return null;
  if (paragraphCount(candidate.interpretation) < 2 || paragraphCount(candidate.interpretation) > 3) return null;

  const symbols = candidate.symbols.map((symbol) => {
    if (!symbol || typeof symbol !== "object" || Array.isArray(symbol)) return null;
    const item = symbol as Record<string, unknown>;
    if (!isSafeText(item.name, 1, 80) || !isSafeText(item.meaning, 5, 400)) return null;
    return { name: compactText(item.name, 80), meaning: compactText(item.meaning, 400) };
  });
  if (symbols.some((symbol) => symbol === null)) return null;

  const guidance = compactMultilineText(candidate.guidance, 1400);
  if (guidance.split("\n").filter(Boolean).length < 3) return null;
  const reflectionPoints = candidate.reflectionPoints.map((point) =>
    isSafeText(point, 15, 280) ? compactText(point, 280) : null
  );
  if (reflectionPoints.some((point) => point === null)) return null;

  return {
    title: "꿈풀이",
    summary: compactText(candidate.summary, 180),
    symbols: symbols as DreamInterpretation["symbols"],
    emotion: compactText(candidate.emotion, 1400),
    flow: compactMultilineText(candidate.flow, 1800),
    interpretation: compactParagraphText(candidate.interpretation, 700),
    reflectionPoints: reflectionPoints as string[],
    guidance,
    caution: DEFAULT_INTERPRETATION_CAUTION,
    hasExplicitEmotion: candidate.hasExplicitEmotion,
    hasNarrativeFlow: candidate.hasNarrativeFlow,
  };
}

export function mergeInterpretations(
  dictionary: DreamInterpretation,
  contextual: ContextualDreamInterpretation,
  detectedEmotions: string[]
): DreamInterpretation {
  const contextualSymbols = [...contextual.symbols];
  const mergedDictionarySymbols = dictionary.symbols.map((dictionarySymbol) => {
    const dictionaryKey = symbolKey(dictionarySymbol.name);
    const matchingIndex = contextualSymbols.findIndex((symbol) => {
      const contextualKey = symbolKey(symbol.name);
      return contextualKey.includes(dictionaryKey) || dictionaryKey.includes(contextualKey);
    });
    if (matchingIndex < 0) return dictionarySymbol;
    const [matching] = contextualSymbols.splice(matchingIndex, 1);
    return { name: dictionarySymbol.name, meaning: matching.contextualMeaning };
  });

  const additionalSymbols = contextualSymbols.map(({ name, contextualMeaning }) => ({
    name,
    meaning: contextualMeaning,
  }));
  const emotionPrefix = detectedEmotions.length
    ? `직접 드러난 감정: ${detectedEmotions.join(", ")}\n`
    : "";

  return {
    title: "꿈풀이",
    summary: contextual.summary,
    symbols: [...mergedDictionarySymbols, ...additionalSymbols].slice(0, 3),
    emotion: `${emotionPrefix}${contextual.emotionAnalysis.expressedEmotion}\n${contextual.emotionAnalysis.contrast}\n${contextual.emotionAnalysis.interpretation}`,
    flow: `시작: ${contextual.flowAnalysis.beginning}\n변화: ${contextual.flowAnalysis.change}\n마지막: ${contextual.flowAnalysis.ending}\n${contextual.flowAnalysis.meaning}`,
    interpretation: contextual.integratedInterpretation,
    reflectionPoints: [
      ...contextual.reflectionQuestions,
    ].slice(0, 3),
    guidance: contextual.lifeGuidance.map((item) => `• ${item}`).join("\n"),
    caution: DEFAULT_INTERPRETATION_CAUTION,
    hasExplicitEmotion: dictionary.hasExplicitEmotion || detectedEmotions.length > 0,
    hasNarrativeFlow: dictionary.hasNarrativeFlow,
  };
}
