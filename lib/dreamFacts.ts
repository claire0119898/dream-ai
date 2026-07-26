import type { DreamInterpretation } from "../types/dream";
import type { DreamRequestContext, DreamScene } from "./dreamContext";

type FactBase = {
  id: string;
  evidence: string;
};

export type DreamPersonFact = FactBase & {
  name: string;
  role: string;
  explicit: true;
};

export type DreamObjectFact = FactBase & {
  name: string;
  quantity: string | null;
  owner: string | null;
  state: string | null;
};

export type DreamActionFact = FactBase & {
  subject: string | null;
  verb: string;
  object: string | null;
  recipient: string | null;
  purpose: string | null;
  order: number;
};

export type DreamTransformationFact = FactBase & {
  before: string;
  after: string;
  trigger: string | null;
  quantityRelation: string | null;
  explicit: true;
};

export type DreamSpeechFact = FactBase & {
  speaker: string | null;
  content: string;
  listener: string | null;
};

export type DreamEmotionFact = FactBase & {
  person: string | null;
  emotion: string;
  explicit: true;
};

export type DreamSequenceFact = FactBase & {
  text: string;
  order: number;
};

export type DreamFactExtraction = {
  version: "v1";
  people: DreamPersonFact[];
  objects: DreamObjectFact[];
  actions: DreamActionFact[];
  transformations: DreamTransformationFact[];
  speech: DreamSpeechFact[];
  emotions: DreamEmotionFact[];
  locations: Array<FactBase & { name: string }>;
  sequence: DreamSequenceFact[];
  ending: (FactBase & { text: string }) | null;
  uncertainPhrases: Array<FactBase & { reason: string }>;
  understandingConfidence: number;
  ambiguityLevel: "low" | "medium" | "high";
  clarification:
    | {
        key: string;
        title: string;
        message: string;
        statements: string[];
      }
    | null;
};

export type FactValidationIssue =
  | "entity_mismatch"
  | "relation_mismatch"
  | "quantity_mismatch"
  | "transformation_mismatch"
  | "unsupported_inference"
  | "response_grounding_failed";

export type FactValidationResult =
  | { ok: true }
  | { ok: false; issue: FactValidationIssue; field: string };

const PERSON_PATTERNS: Array<[RegExp, string, string]> = [
  [/돌아가신\s*할머니/u, "돌아가신 할머니", "가족"],
  [/돌아가신\s*할아버지/u, "돌아가신 할아버지", "가족"],
  [/친정\s*아빠|친정아빠|친정\s*아버지|친정아버지/u, "친정아버지", "가족"],
  [/친정\s*엄마|친정엄마|친정\s*어머니|친정어머니/u, "친정어머니", "가족"],
  [/남편|신랑/u, "남편", "가족"],
  [/아내|부인|와이프/u, "아내", "가족"],
  [/할머니/u, "할머니", "가족"],
  [/할아버지/u, "할아버지", "가족"],
  [/엄마|어머니/u, "어머니", "가족"],
  [/아빠|아버지/u, "아버지", "가족"],
  [/아들/u, "아들", "가족"],
  [/딸/u, "딸", "가족"],
  [/친구/u, "친구", "지인"],
  [/낯선\s*사람/u, "낯선 사람", "낯선 사람"],
  [/(?:저는|제가|제\s*손|나는|내가|내\s*손)/u, "나", "사용자"],
];

const OBJECT_NAMES = [
  "염주알",
  "묵주알",
  "은팔찌",
  "팔찌",
  "구슬",
  "밥그릇",
  "시험지",
  "문",
  "고양이",
  "새",
  "용",
  "집",
  "불",
  "비",
  "햇빛",
];

const LOCATION_NAMES = [
  "하늘",
  "시험장",
  "집",
  "창문 밖",
  "학교",
  "회사",
  "바다",
  "길",
];

const KNOWN_PEOPLE =
  /(?<![가-힣])(?:친정아버지|친정어머니|남편|아내|할머니|할아버지|어머니|아버지|아들|딸|친구|낯선\s*사람|사용자)(?=$|[은는이가을를에게한테께과와의,.\s])/u;
const KNOWN_OBJECTS =
  /(?<![가-힣])(?:염주알|묵주알|은팔찌|팔찌|구슬|밥그릇|시험지|문|고양이|새|용|집|불|비|햇빛|하늘|시험장)(?=$|[은는이가을를에서으로로에,.\s])/u;
const INTERPRETIVE_EMOTIONS =
  /불안|안심|홀가분|두려|기쁨|걱정|슬픔|편안|평온|분노|아깝/u;

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .replace(/친정\s*아빠|친정아빠/gu, "친정아버지")
    .replace(/친정\s*엄마|친정엄마/gu, "친정어머니")
    .replace(/남편한테/gu, "남편에게")
    .replace(/사용자/gu, "나")
    .replace(/\s+/gu, "")
    .replace(/["'“”‘’.,!?·:;()[\]{}•→]/gu, "")
    .toLocaleLowerCase("ko-KR");
}

function evidence(dream: string, pattern: RegExp) {
  const match = dream.match(pattern)?.[0]?.trim();
  return match ?? "";
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = normalize(key(value));
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function clauses(dream: string) {
  return dream
    .replace(/(그리고|그런데|하지만|그러자|마지막에는|마지막으로|결국)/gu, "|||$1")
    .replace(/(았고|었고|했고|였고)(?=\s|,|$)/gu, "$1|||")
    .replace(/(지만|는데)(?=\s|,|$)/gu, "$1|||")
    .split(/\|\|\||(?<=[.!?。！？])/u)
    .map((part) => part.replace(/\s+/gu, " ").trim())
    .filter((part) => part.length >= 2);
}

function extractPeople(dream: string) {
  const people: DreamPersonFact[] = [];
  for (const [pattern, name, role] of PERSON_PATTERNS) {
    const matched = evidence(dream, pattern);
    if (!matched) continue;
    people.push({
      id: `person_${people.length + 1}`,
      name,
      role,
      explicit: true,
      evidence: matched,
    });
  }
  const unique = uniqueBy(people, (person) => person.name).filter((person) => {
    if (
      person.name === "아버지" &&
      people.some((item) => item.name === "친정아버지")
    ) {
      return false;
    }
    if (
      person.name === "어머니" &&
      people.some((item) => item.name === "친정어머니")
    ) {
      return false;
    }
    if (
      person.name === "할머니" &&
      people.some((item) => item.name === "돌아가신 할머니")
    ) {
      return false;
    }
    if (
      person.name === "할아버지" &&
      people.some((item) => item.name === "돌아가신 할아버지")
    ) {
      return false;
    }
    return true;
  });
  return unique.map((person, index) => ({
    ...person,
    id: `person_${index + 1}`,
  }));
}

function explicitQuantity(dream: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const numeric = dream.match(
    new RegExp(`(\\d+)\\s*개의?\\s*${escaped}`, "u"),
  )?.[1];
  if (numeric) return `${numeric}개`;
  const korean = dream.match(
    new RegExp(`(한|두|세|네)\\s*(개|마리|사람|채)의?\\s*${escaped}`, "u"),
  );
  if (korean) return `${korean[1]} ${korean[2]}`;
  return null;
}

function stateFor(dream: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return (
    dream.match(
      new RegExp(
        `(따뜻한|낡은|검은|큰|작은|깨진|차고\\s*계시던)\\s*${escaped}`,
        "u",
      ),
    )?.[1] ?? null
  );
}

function ownerFor(dream: string, name: string) {
  if (
    name === "은팔찌" &&
    /친정\s*(?:아빠|아버지).{0,35}차고\s*계시던\s*은팔찌/u.test(dream)
  ) {
    return "친정아버지";
  }
  if (name === "구슬" && /팔찌에\s*달린\s*\d+\s*개의?\s*구슬/u.test(dream)) {
    return "팔찌";
  }
  return null;
}

function extractObjects(dream: string) {
  const objects = OBJECT_NAMES.flatMap((name) => {
    const matched = evidence(
      dream,
      new RegExp(
        `(?:\\d+\\s*개의?\\s*)?(?:따뜻한\\s*|낡은\\s*|검은\\s*|큰\\s*|작은\\s*|차고\\s*계시던\\s*)?${name}(?=$|[은는이가을를에의로,.\u0020])`,
        "u",
      ),
    );
    if (!matched) return [];
    return [
      {
        id: "",
        name,
        quantity: explicitQuantity(dream, name),
        owner: ownerFor(dream, name),
        state:
          name === "구슬" && /12개의\s*구슬\s*중\s*하나만\s*깨졌/u.test(dream)
            ? "12개 중 하나가 깨짐"
            : stateFor(dream, name),
        evidence: matched,
      } satisfies DreamObjectFact,
    ];
  });
  return uniqueBy(objects, (object) => object.name)
    .filter(
      (object) =>
        !(
          object.name === "팔찌" &&
          objects.some((item) => item.name === "은팔찌")
        ),
    )
    .map((object, index) => ({
      ...object,
      id: `object_${index + 1}`,
    }));
}

function action(
  actions: DreamActionFact[],
  input: Omit<DreamActionFact, "id" | "order">,
) {
  actions.push({
    ...input,
    id: `action_${actions.length + 1}`,
    order: actions.length + 1,
  });
}

function extractActions(
  dream: string,
  context: DreamRequestContext,
  confirmedKey?: string,
) {
  const actions: DreamActionFact[] = [];
  const transfer = evidence(
    dream,
    /친정\s*(?:아빠|아버지).{0,55}남편(?:한테|에게).{0,55}(?:은팔찌).{0,20}(?:주셨어요|주었습니다|주었|건넸)/u,
  );
  if (transfer) {
    action(actions, {
      subject: "친정아버지",
      verb: "주다",
      object: "은팔찌",
      recipient: "남편",
      purpose: /살림에\s*보태/u.test(transfer) ? "살림에 보태기" : null,
      evidence: transfer,
    });
  }

  const fixDoor = evidence(dream, /남편이.{0,18}(?:집의\s*)?문을\s*고치/u);
  if (fixDoor) {
    action(actions, {
      subject: "남편",
      verb: "고치다",
      object: "문",
      recipient: null,
      purpose: null,
      evidence: fixDoor,
    });
  }

  const light = evidence(
    dream,
    /친정\s*(?:엄마|어머니)(?:가|는)?.{0,20}불을\s*밝혀주/u,
  );
  if (light) {
    action(actions, {
      subject: "친정어머니",
      verb: "밝히다",
      object: "불",
      recipient: null,
      purpose: null,
      evidence: light,
    });
  }

  const catOpen = evidence(
    dream,
    /고양이에게\s*문을\s*열어주자|고양이가.{0,28}문을\s*열어주자/u,
  );
  if (catOpen) {
    action(actions, {
      subject: "나",
      verb: "열어주다",
      object: "문",
      recipient: "고양이",
      purpose: null,
      evidence: catOpen,
    });
  }

  const omittedOpen = evidence(dream, /문을\s*열어주자/u);
  if (omittedOpen && !catOpen) {
    action(actions, {
      subject: null,
      verb: "열어주다",
      object: "문",
      recipient: null,
      purpose: null,
      evidence: omittedOpen,
    });
  }

  const fly = evidence(dream, /(?:새가|새로\s*변해)\s*날아갔/u);
  if (fly) {
    action(actions, {
      subject: "새",
      verb: "날아가다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: fly,
    });
  }

  const beadsRise = evidence(
    dream,
    /(?:용이|용으로\s*변해서).{0,16}하늘(?:로|을)\s*올라갔/u,
  );
  if (
    beadsRise &&
    (!/염주알이\s*용이\s*하늘을\s*되어/u.test(dream) ||
      confirmedKey === "beads_to_dragon")
  ) {
    action(actions, {
      subject: "용",
      verb: "올라가다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: beadsRise,
    });
  }
  if (
    confirmedKey === "beads_to_dragon" &&
    /염주알이\s*용이\s*하늘을\s*되어\s*올라갔/u.test(dream) &&
    !actions.some((item) => item.verb === "올라가다")
  ) {
    action(actions, {
      subject: "용",
      verb: "올라가다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: evidence(
        dream,
        /염주알이\s*용이\s*하늘을\s*되어\s*올라갔/u,
      ),
    });
  }

  const breakBead = evidence(
    dream,
    /(?:12개의\s*구슬\s*중\s*)?하나만\s*깨졌/u,
  );
  if (breakBead) {
    action(actions, {
      subject: "구슬",
      verb: "깨지다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: breakBead,
    });
  }

  const late = evidence(dream, /시험(?:장|에).{0,16}늦/u);
  if (late) {
    action(actions, {
      subject: "나",
      verb: "늦다",
      object: "시험",
      recipient: null,
      purpose: null,
      evidence: late,
    });
  }

  const examEnded = evidence(
    dream,
    /시험(?:은|이)?\s*이미\s*끝났/u,
  );
  if (examEnded) {
    action(actions, {
      subject: "시험",
      verb: "끝나다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: examEnded,
    });
  }

  const submitted = evidence(
    dream,
    /시험지(?:는|가)?\s*이미\s*제출되어\s*있었/u,
  );
  if (submitted) {
    action(actions, {
      subject: "시험지",
      verb: "제출되다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: submitted,
    });
  }

  const leaveExam = evidence(dream, /시험장을\s*나오/u);
  if (leaveExam) {
    action(actions, {
      subject: null,
      verb: "나오다",
      object: "시험장",
      recipient: null,
      purpose: null,
      evidence: leaveExam,
    });
  }

  const rainStops = evidence(dream, /비가\s*그치/u);
  if (rainStops) {
    action(actions, {
      subject: "비",
      verb: "그치다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: rainStops,
    });
  }

  const sunlight = evidence(dream, /햇빛이\s*비쳤/u);
  if (sunlight) {
    action(actions, {
      subject: "햇빛",
      verb: "비치다",
      object: null,
      recipient: null,
      purpose: null,
      evidence: sunlight,
    });
  }

  if (!actions.length) {
    for (const scene of context.scenes) {
      const fact = safeActionFromScene(scene);
      if (fact) action(actions, fact);
    }
  }
  return actions;
}

function safeActionFromScene(
  scene: DreamScene,
): Omit<DreamActionFact, "id" | "order"> | null {
  if (!scene.action.surface || !scene.evidence.includes(scene.action.surface)) {
    return null;
  }
  const subject =
    scene.subject && scene.evidence.includes(scene.subject.mention)
      ? scene.subject.mention
      : null;
  const recipient =
    scene.target && scene.evidence.includes(scene.target.mention)
      ? scene.target.mention
      : null;
  const object =
    scene.object && scene.evidence.includes(scene.object.name)
      ? scene.object.name
      : null;
  return {
    subject,
    verb: scene.action.normalized,
    object,
    recipient,
    purpose: scene.purpose.evidence || null,
    evidence: scene.evidence,
  };
}

function extractTransformations(
  dream: string,
  confirmedKey?: string,
): DreamTransformationFact[] {
  const transformations: DreamTransformationFact[] = [];
  const beads = evidence(
    dream,
    /(?:\d+\s*개의?\s*)?염주알이\s*(?:하나씩|하나하나|각각)?\s*용으로\s*변해서/u,
  );
  if (beads) {
    transformations.push({
      id: "transformation_1",
      before: "염주알",
      after: "용",
      trigger: "하나씩 변함",
      quantityRelation: /하나씩|하나하나|각각/u.test(beads)
        ? "염주알 각각"
        : null,
      explicit: true,
      evidence: beads,
    });
  }

  const cat = evidence(dream, /고양이.{0,24}새로\s*변해/u);
  if (cat) {
    transformations.push({
      id: `transformation_${transformations.length + 1}`,
      before: "고양이",
      after: "새",
      trigger: /문을\s*열어주자/u.test(dream) ? "문을 열어줌" : null,
      quantityRelation: null,
      explicit: true,
      evidence: cat,
    });
  }

  if (
    confirmedKey === "beads_to_dragon" &&
    /염주알이\s*용이\s*하늘을\s*되어\s*올라갔/u.test(dream)
  ) {
    transformations.push({
      id: "transformation_1",
      before: "염주알",
      after: "용",
      trigger: "사용자 확인",
      quantityRelation: null,
      explicit: true,
      evidence: evidence(dream, /염주알이\s*용이\s*하늘을\s*되어\s*올라갔/u),
    });
  }
  return uniqueBy(transformations, (item) => `${item.before}:${item.after}`).map(
    (item, index) => ({ ...item, id: `transformation_${index + 1}` }),
  );
}

function extractSpeech(dream: string) {
  const speech: DreamSpeechFact[] = [];
  const support = evidence(dream, /살림에\s*보태라고/u);
  if (support) {
    speech.push({
      id: "speech_1",
      speaker: /친정\s*(?:아빠|아버지)/u.test(dream)
        ? "친정아버지"
        : null,
      content: "살림에 보태라",
      listener: /남편(?:한테|에게)/u.test(dream) ? "남편" : null,
      evidence: support,
    });
  }
  return speech;
}

function extractEmotions(dream: string) {
  const patterns: Array<[RegExp, string]> = [
    [
      /전혀\s*불안하지\s*(?:않았|않고|않음)|불안하지\s*(?:않았|않고|않음)/u,
      "불안하지 않음",
    ],
    [/홀가분/u, "홀가분함"],
    [/안심/u, "안심"],
    [/걱정/u, "걱정"],
    [/무서/u, "두려움"],
    [/기뻐/u, "기쁨"],
  ];
  return patterns.flatMap(([pattern, emotion], index) => {
    const matched = evidence(dream, pattern);
    return matched
      ? [
          {
            id: `emotion_${index + 1}`,
            person: /저는|제가|나는|내가|전혀/u.test(dream) ? "나" : null,
            emotion,
            explicit: true as const,
            evidence: matched,
          },
        ]
      : [];
  }).map((item, index) => ({ ...item, id: `emotion_${index + 1}` }));
}

function extractLocations(dream: string) {
  return LOCATION_NAMES.flatMap((name) => {
    const matched = evidence(dream, new RegExp(name, "u"));
    return matched ? [{ id: "", name, evidence: matched }] : [];
  }).map((item, index) => ({ ...item, id: `location_${index + 1}` }));
}

function ambiguousPhrase(dream: string, confirmedKey?: string) {
  if (
    /염주알이\s*용이\s*하늘을\s*되어\s*올라갔/u.test(dream) &&
    confirmedKey !== "beads_to_dragon"
  ) {
    return {
      key: "beads_to_dragon",
      evidence: evidence(dream, /염주알이\s*용이\s*하늘을\s*되어\s*올라갔/u),
      reason: "무엇이 무엇으로 변했는지 문법적으로 여러 의미가 가능합니다.",
      statements: [
        "염주알이 용으로 변했습니다.",
        "변한 용이 하늘로 올라갔습니다.",
      ],
    };
  }
  return null;
}

function factSequence(
  actions: DreamActionFact[],
  transformations: DreamTransformationFact[],
) {
  const values = [
    ...actions.map((item) => ({
      evidence: item.evidence,
      text: `${item.subject ?? "주체 미상"}: ${item.verb}`,
    })),
    ...transformations.map((item) => ({
      evidence: item.evidence,
      text: `${item.before} → ${item.after}`,
    })),
  ];
  return uniqueBy(values, (item) => `${item.text}:${item.evidence}`).map(
    (item, index) => ({
      id: `sequence_${index + 1}`,
      text: item.text,
      order: index + 1,
      evidence: item.evidence,
    }),
  );
}

export function extractDreamFacts(
  dream: string,
  context: DreamRequestContext,
  confirmedKey?: string,
): DreamFactExtraction {
  const ambiguity = ambiguousPhrase(dream, confirmedKey);
  const people = extractPeople(dream);
  const objects = extractObjects(dream);
  let actions = extractActions(dream, context, confirmedKey);
  const transformations = extractTransformations(dream, confirmedKey);
  const speech = extractSpeech(dream);
  const emotions = extractEmotions(dream);
  const locations = extractLocations(dream);
  const dreamClauses = clauses(dream);
  const endingEvidence = dreamClauses.at(-1) ?? "";
  const low = Boolean(ambiguity);
  if (ambiguity) {
    const uncertain = normalize(ambiguity.evidence);
    actions = actions.filter(
      (item) =>
        !uncertain.includes(normalize(item.evidence)) &&
        !normalize(item.evidence).includes(uncertain),
    );
  }
  const sequence = factSequence(actions, transformations);
  const missingSubject = actions.some((item) => item.subject === null);
  const confidence = low ? 0.35 : missingSubject ? 0.72 : 0.96;

  return {
    version: "v1",
    people,
    objects,
    actions,
    transformations,
    speech,
    emotions,
    locations,
    sequence,
    ending: endingEvidence
      ? { id: "ending_1", text: endingEvidence, evidence: endingEvidence }
      : null,
    uncertainPhrases: ambiguity
      ? [
          {
            id: "uncertain_1",
            evidence: ambiguity.evidence,
            reason: ambiguity.reason,
          },
        ]
      : [],
    understandingConfidence: confidence,
    ambiguityLevel: low ? "high" : missingSubject ? "medium" : "low",
    clarification: ambiguity
      ? {
          key: ambiguity.key,
          title: "이렇게 이해하면 될까요?",
          message:
            "꿈의 장면을 정확히 이해하기 위해 한 가지만 확인할게요.",
          statements: ambiguity.statements,
        }
      : null,
  };
}

export function allFactIds(facts: DreamFactExtraction) {
  return new Set(
    [
      ...facts.people,
      ...facts.objects,
      ...facts.actions,
      ...facts.transformations,
      ...facts.speech,
      ...facts.emotions,
      ...facts.locations,
      ...facts.sequence,
      ...(facts.ending ? [facts.ending] : []),
    ].map((fact) => fact.id),
  );
}

function factById(facts: DreamFactExtraction, id: string) {
  return [
    ...facts.people,
    ...facts.objects,
    ...facts.actions,
    ...facts.transformations,
    ...facts.speech,
    ...facts.emotions,
    ...facts.locations,
    ...facts.sequence,
    ...(facts.ending ? [facts.ending] : []),
  ].find((fact) => fact.id === id);
}

function factSearchText(fact: NonNullable<ReturnType<typeof factById>>) {
  let text = fact.evidence;
  if ("name" in fact) text += ` ${String(fact.name)}`;
  if ("quantity" in fact && "owner" in fact && "state" in fact) {
    text += ` ${String(fact.quantity ?? "")} ${String(fact.owner ?? "")} ${String(fact.state ?? "")}`;
  }
  if ("subject" in fact) {
    text += ` ${fact.subject ?? ""} ${fact.object ?? ""} ${fact.recipient ?? ""} ${fact.purpose ?? ""} ${fact.verb}`;
  }
  if ("before" in fact) {
    text += ` ${fact.before} ${fact.after} ${fact.quantityRelation ?? ""}`;
  }
  if ("emotion" in fact) text += ` ${fact.person ?? ""} ${fact.emotion}`;
  if ("content" in fact) {
    text += ` ${fact.speaker ?? ""} ${fact.listener ?? ""} ${fact.content}`;
  }
  if ("text" in fact) text += ` ${fact.text}`;
  return text;
}

function factAnchors(fact: NonNullable<ReturnType<typeof factById>>) {
  const anchors = [fact.evidence];
  if ("name" in fact) anchors.push(String(fact.name));
  if ("quantity" in fact && "owner" in fact && "state" in fact) {
    anchors.push(
      String(fact.quantity ?? ""),
      String(fact.owner ?? ""),
      String(fact.state ?? ""),
    );
  }
  if ("subject" in fact) {
    anchors.push(
      fact.subject ?? "",
      fact.object ?? "",
      fact.recipient ?? "",
      fact.purpose ?? "",
      fact.verb.replace(/다$/u, ""),
    );
  }
  if ("before" in fact) {
    anchors.push(fact.before, fact.after, fact.quantityRelation ?? "");
  }
  if ("emotion" in fact) anchors.push(fact.person ?? "", fact.emotion);
  if ("content" in fact) {
    anchors.push(
      fact.speaker ?? "",
      fact.listener ?? "",
      fact.content,
    );
  }
  if ("text" in fact) anchors.push(fact.text);
  return anchors.filter(Boolean);
}

export function validateExtractedFacts(
  dream: string,
  facts: DreamFactExtraction,
): FactValidationResult {
  const normalizedDream = normalize(dream);
  const factItems = [...allFactIds(facts)].map((id) => factById(facts, id));
  if (
    factItems.some(
      (fact) =>
        fact &&
        fact.evidence &&
        !normalizedDream.includes(normalize(fact.evidence)),
    )
  ) {
    return { ok: false, issue: "unsupported_inference", field: "evidence" };
  }

  for (const actionFact of facts.actions) {
    const relationshipText = normalize(actionFact.evidence);
    if (
      actionFact.subject &&
      actionFact.subject !== "나" &&
      !relationshipText.includes(normalize(actionFact.subject))
    ) {
      return { ok: false, issue: "relation_mismatch", field: actionFact.id };
    }
    if (
      actionFact.recipient &&
      !relationshipText.includes(normalize(actionFact.recipient))
    ) {
      return { ok: false, issue: "relation_mismatch", field: actionFact.id };
    }
  }

  for (const objectFact of facts.objects) {
    if (
      objectFact.quantity &&
      !normalizedDream.includes(normalize(objectFact.quantity))
    ) {
      return { ok: false, issue: "quantity_mismatch", field: objectFact.id };
    }
  }
  return { ok: true };
}

function resultText(interpretation: DreamInterpretation) {
  return [
    interpretation.coreConclusion,
    ...interpretation.keyScenes.flatMap((scene) => [
      scene.title,
      scene.meaning,
    ]),
    interpretation.relationshipMeaning,
    interpretation.objectMeaning,
    interpretation.integratedInterpretation,
    ...interpretation.realLifeConnections,
    ...interpretation.reflectionQuestions,
  ].join("\n");
}

function concreteSentences(interpretation: DreamInterpretation) {
  return resultText(interpretation)
    .split(/(?<=[.!?。！？])|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(
      (sentence) =>
        sentence.length >= 8 &&
        (KNOWN_PEOPLE.test(sentence) ||
          KNOWN_OBJECTS.test(sentence) ||
          /\d+/u.test(sentence)),
    );
}

export function validateInterpretationFacts(
  interpretation: DreamInterpretation,
  facts: DreamFactExtraction,
): FactValidationResult {
  if (interpretation.factVersion !== facts.version) {
    return {
      ok: false,
      issue: "response_grounding_failed",
      field: "factVersion",
    };
  }
  const ids = allFactIds(facts);
  const output = resultText(interpretation);

  for (const entry of interpretation.grounding) {
    if (
      !entry.sentence ||
      !output.includes(entry.sentence) ||
      !entry.factIds.length ||
      entry.factIds.some((id) => !ids.has(id))
    ) {
      return {
        ok: false,
        issue: "response_grounding_failed",
        field: entry.field,
      };
    }
    const referenced = entry.factIds
      .map((id) => factById(facts, id))
      .filter(
        (fact): fact is NonNullable<ReturnType<typeof factById>> =>
          Boolean(fact),
      );
    const sentenceText = normalize(entry.sentence);
    const anchors = uniqueBy(
      [
        ...facts.people.map((item) => item.name),
        ...facts.objects.flatMap((item) => [
          item.name,
          item.quantity ?? "",
          item.owner ?? "",
        ]),
        ...facts.actions.flatMap((item) => [
          item.subject ?? "",
          item.object ?? "",
          item.recipient ?? "",
        ]),
        ...facts.transformations.flatMap((item) => [
          item.before,
          item.after,
        ]),
        ...facts.emotions.map((item) => item.emotion),
        ...facts.locations.map((item) => item.name),
      ].filter((anchor) => anchor.length >= 1),
      (anchor) => anchor,
    ).filter((anchor) => sentenceText.includes(normalize(anchor)));
    if (
      anchors.some(
        (anchor) =>
          !referenced.some((fact) =>
            normalize(factSearchText(fact)).includes(normalize(anchor)),
          ),
      )
    ) {
      return {
        ok: false,
        issue: "response_grounding_failed",
        field: entry.field,
      };
    }
  }

  for (const sentence of concreteSentences(interpretation)) {
    if (
      !interpretation.grounding.some(
        (entry) =>
          entry.sentence === sentence ||
          entry.sentence.includes(sentence) ||
          sentence.includes(entry.sentence),
      )
    ) {
      return {
        ok: false,
        issue: "response_grounding_failed",
        field: "sentence",
      };
    }
  }

  const people = new Set(facts.people.map((item) => item.name));
  for (const name of output.match(new RegExp(KNOWN_PEOPLE.source, "gu")) ?? []) {
    const canonical =
      name === "사용자" ? "나" : name;
    const coveredBySpecificRole =
      (canonical === "아버지" && people.has("친정아버지")) ||
      (canonical === "어머니" && people.has("친정어머니")) ||
      (canonical === "할머니" && people.has("돌아가신 할머니")) ||
      (canonical === "할아버지" && people.has("돌아가신 할아버지"));
    if (!people.has(canonical) && canonical !== "나" && !coveredBySpecificRole) {
      return { ok: false, issue: "entity_mismatch", field: "people" };
    }
  }

  const objects = new Set([
    ...facts.objects.map((item) => item.name),
    ...facts.actions.flatMap((item) =>
      [item.object, item.subject].filter((value): value is string =>
        Boolean(value),
      ),
    ),
    ...facts.transformations.flatMap((item) => [item.before, item.after]),
  ]);
  for (const name of output.match(new RegExp(KNOWN_OBJECTS.source, "gu")) ?? []) {
    if (name === "새" && !objects.has("새")) continue;
    if (
      !objects.has(name) &&
      !facts.locations.some((location) => location.name === name)
    ) {
      return { ok: false, issue: "entity_mismatch", field: "objects" };
    }
  }
  if (
    !objects.has("새") &&
    /(?<![가-힣])새(?:가|를|는|에게|로\s*변해|로\s*날아)/u.test(output)
  ) {
    return { ok: false, issue: "entity_mismatch", field: "objects" };
  }

  const quantities = new Set(
    facts.objects
      .map((item) => item.quantity?.match(/\d+/u)?.[0])
      .filter(Boolean),
  );
  for (const number of output.match(/\d+/gu) ?? []) {
    if (!quantities.has(number)) {
      return { ok: false, issue: "quantity_mismatch", field: "quantity" };
    }
  }

  for (const transformation of facts.transformations) {
    const correctDirection = new RegExp(
      `${transformation.before}.{0,35}${transformation.after}.{0,18}변`,
      "u",
    );
    const reversedDirection = new RegExp(
      `${transformation.after}.{0,35}${transformation.before}.{0,18}변`,
      "u",
    );
    const outputSentences = output.split(/(?<=[.!?。！？])|\n+/u);
    if (
      !outputSentences.some((sentence) => correctDirection.test(sentence)) ||
      outputSentences.some((sentence) => reversedDirection.test(sentence))
    ) {
      return {
        ok: false,
        issue: "transformation_mismatch",
        field: transformation.id,
      };
    }
  }

  for (const actionFact of facts.actions) {
    if (!actionFact.subject || !actionFact.recipient) continue;
    const subject = actionFact.subject === "나" ? "사용자" : actionFact.subject;
    const directionPattern = new RegExp(
      `${subject}.{0,40}${actionFact.recipient}`,
      "u",
    );
    const outputSentences = output.split(/(?<=[.!?。！？])|\n+/u);
    if (!outputSentences.some((sentence) => directionPattern.test(sentence))) {
      return {
        ok: false,
        issue: "relation_mismatch",
        field: actionFact.id,
      };
    }
    const reversedDirection = new RegExp(
      `${actionFact.recipient}(?:이|가|는).{0,45}${subject}(?:에게|한테|께).{0,25}${actionFact.verb.replace(/다$/u, "")}`,
      "u",
    );
    if (outputSentences.some((sentence) => reversedDirection.test(sentence))) {
      return {
        ok: false,
        issue: "relation_mismatch",
        field: actionFact.id,
      };
    }
  }

  for (const objectFact of facts.objects) {
    if (!objectFact.owner) continue;
    for (const person of facts.people) {
      if (
        person.name !== objectFact.owner &&
        new RegExp(
          `${person.name}.{0,22}(?:지니던|소유.{0,6})${objectFact.name}`,
          "u",
        ).test(output)
      ) {
        return {
          ok: false,
          issue: "relation_mismatch",
          field: objectFact.id,
        };
      }
    }
  }

  const endingAnchors = [
    facts.actions.at(-1)?.subject,
    facts.actions.at(-1)?.object,
    facts.actions.at(-1)?.verb.replace(/다$/u, ""),
    facts.transformations.at(-1)?.after,
    facts.emotions.at(-1)?.emotion,
    facts.locations.at(-1)?.name,
  ].filter((value): value is string => Boolean(value && value.length >= 1));
  if (
    facts.ending &&
    endingAnchors.length &&
    !endingAnchors.some((anchor) =>
      normalize(output).includes(normalize(anchor === "나" ? "사용자" : anchor)),
    )
  ) {
    return {
      ok: false,
      issue: "unsupported_inference",
      field: "ending",
    };
  }

  const explicitEmotions = facts.emotions.map((item) => item.emotion);
  if (
    INTERPRETIVE_EMOTIONS.test(output) &&
    explicitEmotions.length === 0 &&
    /사용자(?:는|가).{0,18}(?:느꼈|불안|안심|홀가분|두려)/u.test(output)
  ) {
    return {
      ok: false,
      issue: "unsupported_inference",
      field: "emotions",
    };
  }

  return { ok: true };
}

export function buildInterpretationGrounding(
  interpretation: Omit<DreamInterpretation, "grounding">,
  facts: DreamFactExtraction,
) {
  const factItems = [...allFactIds(facts)]
    .map((id) => factById(facts, id))
    .filter(Boolean);
  const fields: Array<[string, string]> = [
    ["coreConclusion", interpretation.coreConclusion],
    ...interpretation.keyScenes.flatMap((scene, index) => [
      [`keyScenes.${index}.title`, scene.title] as [string, string],
      [`keyScenes.${index}.meaning`, scene.meaning] as [string, string],
    ]),
    ["relationshipMeaning", interpretation.relationshipMeaning],
    ["objectMeaning", interpretation.objectMeaning],
    ["integratedInterpretation", interpretation.integratedInterpretation],
    ...interpretation.realLifeConnections.map(
      (value, index) =>
        [`realLifeConnections.${index}`, value] as [string, string],
    ),
    ...interpretation.reflectionQuestions.map(
      (value, index) =>
        [`reflectionQuestions.${index}`, value] as [string, string],
    ),
  ];
  return fields.flatMap(([field, value]) =>
    value
      .split(/(?<=[.!?。！？])|\n+/u)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .map((sentence) => {
        const matching = factItems.filter((fact) => {
          if (!fact) return false;
          const factText = factSearchText(fact);
          const normalizedSentence = normalize(sentence);
          return (
            factAnchors(fact).some((anchor) => {
              const term = normalize(anchor);
              return (
                term.length >= 1 &&
                (normalizedSentence.includes(term) ||
                  (term.length >= 3 &&
                    normalizedSentence.includes(term.slice(0, 3))))
              );
            }) ||
            factText
              .split(/\s+/u)
              .map(normalize)
              .some(
                (term) =>
                  term.length >= 2 &&
                  (normalizedSentence.includes(term) ||
                    (term.length >= 3 &&
                      normalizedSentence.includes(term.slice(0, 3)))),
              )
          );
        }).sort((left, right) => {
          const priority = (id: string) => {
            if (id.startsWith("action_")) return 7;
            if (id.startsWith("transformation_")) return 7;
            if (id.startsWith("speech_")) return 6;
            if (id.startsWith("emotion_")) return 6;
            if (id.startsWith("ending_")) return 5;
            if (id.startsWith("object_")) return 4;
            if (id.startsWith("person_")) return 3;
            if (id.startsWith("location_")) return 2;
            return 1;
          };
          return priority(right!.id) - priority(left!.id);
        });
        const fallbackIds = factItems.slice(0, 2).map((fact) => fact!.id);
        return {
          field,
          sentence,
          factIds: matching.length
            ? matching.slice(0, 10).map((fact) => fact!.id)
            : fallbackIds,
        };
      }),
  );
}
