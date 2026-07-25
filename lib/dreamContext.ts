import type { DreamAnalysis, DreamKeyword } from "../types/dream";

export type DreamDictionaryContextEntry = {
  keyword: string;
  aliases: string[];
  basicMeaning: string;
  positiveMeaning: string;
  caution: string;
  evidence: string;
};

export type DreamActor = {
  mention: string;
  normalizedRole: string;
  relationshipToDreamer: string;
  familySystem: string;
  relationalMeanings: string[];
};

export type DreamObjectContext = {
  name: string;
  owner: string;
  ownershipEvidence: string;
  attributes: string[];
  personalValues: string[];
};

export type DreamDialogueAct = {
  speaker: string;
  addressee: string;
  words: string;
  intentions: string[];
};

export type DreamScene = {
  id: string;
  evidence: string;
  subject: DreamActor | null;
  target: DreamActor | null;
  action: {
    surface: string;
    normalized: string;
    subtypes: string[];
  };
  object: DreamObjectContext | null;
  purpose: {
    evidence: string;
    meanings: string[];
  };
  expressedEmotions: string[];
  inferredEmotions: string[];
  result: {
    evidence: string;
    meanings: string[];
  };
  dialogue: DreamDialogueAct | null;
  relationshipDynamics: string[];
};

export type DreamEvent = {
  sceneId: string;
  who: string;
  didWhat: string;
  what: string;
  toWhom: string;
  why: string;
  how: string;
  result: string;
  relationshipMeaning: string[];
};

export type DreamRelationship = {
  from: string;
  to: string;
  relation: string;
  meanings: string[];
  evidence: string;
};

export type DreamKeySceneFrame = {
  title: string;
  evidence: string;
  reasons: string[];
  sceneId: string;
};

export type DreamRequestContext = {
  scenes: DreamScene[];
  keyScenes: DreamKeySceneFrame[];
  events: DreamEvent[];
  relationships: DreamRelationship[];
  ownershipSignals: DreamObjectContext[];
  dialogueActs: DreamDialogueAct[];
  characters: string[];
  places: string[];
  symbols: string[];
  actions: string[];
  states: string[];
  emotions: string[];
  expressedEmotions: string[];
  situations: string[];
  contrasts: string[];
  repeatedScenes: string[];
  unexpectedEnding: string;
  eventFlow: {
    beginning: string;
    changes: string[];
    ending: string;
  };
  symbolRelationships: string[];
  dictionaryEntries: DreamDictionaryContextEntry[];
};

type ActorProfile = {
  aliases: string[];
  normalizedRole: string;
  relationshipToDreamer: string;
  familySystem: string;
  relationalMeanings: string[];
};

const ACTOR_PROFILES: ActorProfile[] = [
  {
    aliases: ["친정아빠", "친정 아빠", "친정아버지", "친정 아버지"],
    normalizedRole: "아버지",
    relationshipToDreamer: "부모",
    familySystem: "친정·원가족",
    relationalMeanings: ["보호", "지원", "조언", "부모 세대의 책임"],
  },
  {
    aliases: ["시아버지", "시어머니", "시부모님", "시부모"],
    normalizedRole: "배우자의 부모",
    relationshipToDreamer: "시부모",
    familySystem: "배우자의 원가족",
    relationalMeanings: ["가족의 기준", "지원", "세대 간 관계"],
  },
  {
    aliases: ["아빠", "아버지", "아버님", "부친"],
    normalizedRole: "아버지",
    relationshipToDreamer: "부모",
    familySystem: "원가족",
    relationalMeanings: ["보호", "지원", "조언", "책임"],
  },
  {
    aliases: ["엄마", "어머니", "어머님", "모친", "친정엄마", "친정 어머니"],
    normalizedRole: "어머니",
    relationshipToDreamer: "부모",
    familySystem: "원가족",
    relationalMeanings: ["돌봄", "보호", "정서적 기반", "지원"],
  },
  {
    aliases: ["남편", "신랑", "배우자"],
    normalizedRole: "남편",
    relationshipToDreamer: "배우자",
    familySystem: "현재 가정",
    relationalMeanings: ["협력", "생활의 책임", "동반자 관계"],
  },
  {
    aliases: ["아내", "부인", "와이프"],
    normalizedRole: "아내",
    relationshipToDreamer: "배우자",
    familySystem: "현재 가정",
    relationalMeanings: ["협력", "생활의 책임", "동반자 관계"],
  },
  {
    aliases: ["아들", "딸", "아이", "아기", "자녀"],
    normalizedRole: "자녀",
    relationshipToDreamer: "자녀",
    familySystem: "현재 가정",
    relationalMeanings: ["돌봄", "성장", "책임", "보호"],
  },
  {
    aliases: ["할아버지", "할머니", "조부모님", "조부모"],
    normalizedRole: "조부모",
    relationshipToDreamer: "윗세대 가족",
    familySystem: "원가족",
    relationalMeanings: ["전통", "기억", "보호", "세대의 지혜"],
  },
  {
    aliases: ["형", "오빠", "누나", "언니", "동생", "형제", "자매"],
    normalizedRole: "형제자매",
    relationshipToDreamer: "형제자매",
    familySystem: "원가족",
    relationalMeanings: ["친밀감", "비교", "협력", "경쟁"],
  },
  {
    aliases: ["상사", "팀장", "사장", "동료", "직장 동료"],
    normalizedRole: "직장 관계자",
    relationshipToDreamer: "사회적 관계",
    familySystem: "직장",
    relationalMeanings: ["평가", "역할", "협업", "책임"],
  },
  {
    aliases: ["선생님", "교수", "친구", "연인", "낯선 사람", "사람들", "가족들", "가족"],
    normalizedRole: "등장인물",
    relationshipToDreamer: "사회적 관계",
    familySystem: "주변 관계",
    relationalMeanings: ["관계", "기대", "상호작용"],
  },
];

type ActionProfile = {
  pattern: RegExp;
  normalized: string;
  subtypes: string[];
};

const ACTION_PROFILES: ActionProfile[] = [
  { pattern: /(?:주었|주셨|주셨어|줬|준다|주다|건넸|건네|전달했|내어주|쥐여주|쥐어주)/u, normalized: "주다", subtypes: ["전달"] },
  { pattern: /(?:받았|받는|받다)/u, normalized: "받다", subtypes: ["수용"] },
  { pattern: /(?:선물했|선물로\s*주|선물받)/u, normalized: "선물하다", subtypes: ["선물"] },
  { pattern: /(?:도와줬|도와주|구했|구해|대신\s*들어주|가방을\s*(?:대신\s*)?들어주)/u, normalized: "돕다", subtypes: ["지원", "보호", "부담 분담"] },
  { pattern: /(?:도망쳤|도망가|피했|달아났)/u, normalized: "피하다", subtypes: ["회피", "거리 두기"] },
  { pattern: /(?:쫓아왔|쫓겼|추격)/u, normalized: "쫓다", subtypes: ["추격", "압박"] },
  { pattern: /(?:싸웠|다퉜|부딪혔|공격했|물었|할퀴)/u, normalized: "맞서다", subtypes: ["갈등", "대립"] },
  { pattern: /(?:죽었|죽는|사라졌|떠났)/u, normalized: "사라지다", subtypes: ["종료", "이별", "전환"] },
  { pattern: /(?:결혼했|결혼하는|혼인)/u, normalized: "결혼하다", subtypes: ["결합", "약속"] },
  { pattern: /(?:낳았|출산했|태어났)/u, normalized: "태어나다", subtypes: ["탄생", "시작"] },
  { pattern: /(?:시험을\s*봤|시험을\s*치|제출했|합격했|불합격)/u, normalized: "평가받다", subtypes: ["시험", "평가"] },
  { pattern: /(?:올라갔|올라가|상승했)/u, normalized: "올라가다", subtypes: ["상승", "이동"] },
  { pattern: /(?:내려갔|내려가|하강했)/u, normalized: "내려가다", subtypes: ["하강", "이동"] },
  { pattern: /(?:떨어졌|추락했|추락하는)/u, normalized: "떨어지다", subtypes: ["추락", "통제 상실"] },
  { pattern: /(?:날아갔|날아가|날았|비행했)/u, normalized: "날다", subtypes: ["이동", "해방"] },
  { pattern: /(?:변했|변해|바뀌었|되어)/u, normalized: "변하다", subtypes: ["변화", "전환"] },
  { pattern: /(?:열었|열자|열어주|열리는|닫았|닫히)/u, normalized: "열고 닫다", subtypes: ["경계", "접근"] },
  { pattern: /(?:찾았|발견했|주웠)/u, normalized: "찾다", subtypes: ["발견"] },
  { pattern: /(?:잃어버렸|놓쳤|빼앗겼)/u, normalized: "잃다", subtypes: ["상실"] },
  { pattern: /(?:들어왔|들어오|들어갔)/u, normalized: "들어오다", subtypes: ["등장", "경계 통과"] },
  { pattern: /(?:나왔|나오자|떠났)/u, normalized: "나오다", subtypes: ["이탈", "전환"] },
  { pattern: /(?:말했|말하|부탁했|외쳤)/u, normalized: "말하다", subtypes: ["대화", "요청"] },
  { pattern: /(?:고쳤|고치고|수리했|수리하)/u, normalized: "고치다", subtypes: ["수리", "회복"] },
  { pattern: /(?:밝혀주|불을\s*밝히|비춰주|비추고)/u, normalized: "밝히다", subtypes: ["도움", "길잡이"] },
  { pattern: /(?:걸어\s*지나|걸어갔|걸어가|걸었|걷고)/u, normalized: "걷다", subtypes: ["이동", "움직임"] },
  { pattern: /(?:누워|누웠)/u, normalized: "눕다", subtypes: ["멈춤", "관찰"] },
  { pattern: /(?:바라봤|바라보|보고\s*있|보였습니다|보였)/u, normalized: "바라보다", subtypes: ["관찰", "주시"] },
  { pattern: /(?:울고\s*있|울었|우는)/u, normalized: "울다", subtypes: ["표현", "호소"] },
];

const PLACE_TERMS = [
  "시험장", "회사", "엘리베이터", "집 안", "집", "학교", "교실", "병원", "길",
  "바다", "산", "창문 밖", "공항", "기차역", "결혼식장", "장례식장", "시장", "잔디밭",
];
const CORE_SYMBOL_TERMS = [
  "시험지", "비", "햇빛", "구렁이", "뱀", "엘리베이터", "층수", "문", "창문",
  "고양이", "강아지", "새", "돈", "팔찌", "은팔찌", "반지", "목걸이", "선물",
  "밥그릇", "그릇", "신발", "가방", "건물", "하늘", "두 발",
];
const EMOTION_PATTERNS: Array<[RegExp, string]> = [
  [/불안하지 않(?:았고|았다|았습니다)?/u, "불안하지 않음"],
  [/홀가분(?:했|했다|했습니다|함)/u, "홀가분함"],
  [/걱정(?:했|했다|했습니다|됐|되었)/u, "걱정"],
  [/안심(?:했|했다|했습니다|함)/u, "안심"],
  [/마음이\s*놓(?:였|였습니다|임)/u, "안도"],
  [/무서(?:웠|웠다|웠습니다|움)/u, "두려움"],
  [/기뻐(?:했|했다|웠|움)/u, "기쁨"],
  [/답답(?:했|했다|함)/u, "답답함"],
  [/아깝지\s*않(?:았|았다|았어요|았습니다)?/u, "아깝지 않음"],
  [/슬펐|슬프|서운|화가\s*났|분노|창피|부끄|놀랐|편안|평온/u, "직접 표현된 감정"],
];

function compact(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function narrativeClauses(dream: string) {
  const marked = dream
    .replace(/(그런데|하지만|그러다가|마지막에는|마지막으로|그러자|이후에|그때|결국)/gu, "|||$1")
    .replace(/(았고|었고|했고|였고)(?=\s|,|$)/gu, "$1|||")
    .replace(/(지만|는데|다가)(?=\s|,|$)/gu, "$1|||")
    .replace(/([가-힣]{1,12}(?:자|면서))(?=\s)/gu, "$1|||")
    .replace(/[,，](?=\s*)/gu, "|||");
  return marked
    .split(/\|\|\||(?<=[.!?。！？])/u)
    .map((part) => compact(part, 220))
    .filter((part) => part.length >= 2);
}

function matchedTerm(dream: string, item: DreamKeyword) {
  const lowerDream = dream.toLocaleLowerCase("ko-KR");
  return [item.keyword, ...(item.aliases ?? [])].find((term) =>
    lowerDream.includes(term.toLocaleLowerCase("ko-KR"))
  ) ?? item.keyword;
}

function evidenceClause(dream: string, item: DreamKeyword) {
  const term = matchedTerm(dream, item);
  return narrativeClauses(dream).find((clause) => clause.includes(term))?.slice(0, 120) ?? term;
}

function rankKeywords(dream: string, keywords: DreamKeyword[]) {
  return keywords
    .map((item, index) => {
      const positions = [item.keyword, ...(item.aliases ?? [])]
        .map((term) => dream.indexOf(term))
        .filter((position) => position >= 0);
      return {
        item,
        index,
        firstPosition: positions.length ? Math.min(...positions) : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.firstPosition - b.firstPosition || a.index - b.index)
    .map(({ item }) => item);
}

function actorFromMention(mention: string): DreamActor {
  const profile = ACTOR_PROFILES.find((item) => item.aliases.some((alias) => mention.includes(alias)));
  return {
    mention,
    normalizedRole: profile?.normalizedRole ?? mention,
    relationshipToDreamer: profile?.relationshipToDreamer ?? "꿈속 등장인물",
    familySystem: profile?.familySystem ?? "꿈속 관계",
    relationalMeanings: profile?.relationalMeanings ?? ["관계", "상호작용"],
  };
}

function actorMentions(text: string) {
  const candidates = unique(ACTOR_PROFILES.flatMap((profile) => profile.aliases))
    .flatMap((alias) => {
      const start = text.indexOf(alias);
      return start >= 0 ? [{ value: alias, start, end: start + alias.length }] : [];
    })
    .sort((a, b) => a.start - b.start || b.value.length - a.value.length);
  const selected: typeof candidates = [];
  for (const candidate of candidates) {
    if (selected.some((item) => candidate.start < item.end && candidate.end > item.start)) continue;
    selected.push(candidate);
  }
  return selected.sort((a, b) => a.start - b.start).map((item) => item.value);
}

function particleActor(text: string, particle: "subject" | "target") {
  const suffix = particle === "subject" ? "(?:이|가|은|는)" : "(?:에게|한테|께)";
  const matches = [...text.matchAll(new RegExp(`([가-힣A-Za-z0-9 ]{1,20}?)${suffix}(?=\\s|[^가-힣]|$)`, "gu"))];
  const candidate = matches.at(-1)?.[1]?.trim().split(/\s+/).at(-1) ?? "";
  return candidate.length >= 1 ? candidate : "";
}

function findActors(clause: string) {
  const mentions = actorMentions(clause);
  const subjectParticle = particleActor(clause, "subject");
  const targetParticle = particleActor(clause, "target");
  const deceasedGrandparent = clause.match(/돌아가신\s+(?:할머니|할아버지)/u)?.[0];
  const describedChild = clause.match(/(?:모르는|낯선)\s+아이(?=(?:에게|한테|께))/u)?.[0];
  const subjectMention =
    deceasedGrandparent ||
    mentions.find((mention) => new RegExp(`${mention}(?:이|가|은|는)`, "u").test(clause)) ||
    subjectParticle ||
    mentions[0] ||
    "";
  const targetMention =
    describedChild ||
    (/(?:제|내)\s*(?:손|가방|짐|물건)/u.test(clause) ? "나" : "") ||
    mentions.find((mention) => new RegExp(`${mention}(?:에게|한테|께)`, "u").test(clause)) ||
    targetParticle ||
    mentions.find((mention) => mention !== subjectMention) ||
    "";
  return {
    subject: subjectMention ? actorFromMention(subjectMention) : null,
    target: targetMention && targetMention !== subjectMention ? actorFromMention(targetMention) : null,
  };
}

function findAction(clause: string) {
  const matches = ACTION_PROFILES
    .map((profile) => {
      const match = clause.match(profile.pattern);
      return match ? { profile, surface: match[0], index: match.index ?? Number.MAX_SAFE_INTEGER } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.index - b.index);
  const first = matches[0];
  return {
    surface: first?.surface ?? "",
    normalized: first?.profile.normalized ?? "상태가 이어지다",
    subtypes: matches.length
      ? unique(matches.flatMap((item) => item.profile.subtypes))
      : ["상황 전개"],
  };
}

function findPurpose(clause: string) {
  const quoted = clause.match(/[“"'‘]([^”"'’]{2,60})[”"'’]/u)?.[1];
  const spoken = clause.match(/([가-힣A-Za-z0-9\s]{2,60}?)(?:라고|다고)\s*말/u)?.[1];
  const contextual = clause.match(
    /((?:살림|생활비|가계|경제|집안|가족|학교|회사|시험|아이)[가-힣A-Za-z0-9\s]{1,35}?)(?:라고|라며|하라고)(?=\s|$)/u
  )?.[1];
  const indirect = clause.match(/([가-힣A-Za-z0-9\s]{2,50}?)(?:라고|라며|하라고)(?=\s|$)/u)?.[1];
  const indirectTail = indirect?.trim().split(/\s+/).slice(-4).join(" ");
  const evidence = compact(quoted ?? contextual ?? spoken ?? indirectTail ?? "", 80);
  const meanings: string[] = [];
  if (/(살림|생활비|보태|돈|경제|가계)/u.test(evidence)) {
    meanings.push("경제적 도움", "생활 지원", "책임 분담", "가정의 안정");
  }
  if (/(힘내|잘하|응원|괜찮)/u.test(evidence)) meanings.push("응원", "격려");
  if (/(부탁|맡아|책임|돌봐)/u.test(evidence)) meanings.push("부탁", "역할의 위임");
  if (/(전해|갖다\s*줘|건네)/u.test(evidence)) meanings.push("전달", "연결");
  if (/(내려놓|쉬어|괜찮|그만해도)/u.test(evidence)) {
    meanings.push("부담 완화", "책임을 내려놓기", "휴식 허용");
  }
  return { evidence, meanings: unique(meanings) };
}

function findObject(clause: string, action: ReturnType<typeof findAction>, subject: DreamActor | null) {
  const actionStem = action.normalized === "주다"
    ? "(?:주|줬|건네|전달|내어|쥐여|쥐어)"
    : action.normalized === "돕다"
      ? "(?:도와|구해|들어주|대신)"
    : "(?:받|찾|잃|들|놓|열|닫|먹|보|잡|던지|깨|사)";
  const immediateObject = clause.match(
    new RegExp(`([가-힣A-Za-z0-9]{1,20})(?:을|를)(?=\\s*${actionStem})`, "u")
  )?.[1];
  const actionIndex = clause.search(new RegExp(actionStem, "u"));
  const objectCandidates = [...clause.matchAll(/([가-힣A-Za-z0-9]{1,20})(?:을|를)(?=\s|$)/gu)]
    .filter((match) => actionIndex < 0 || (match.index ?? 0) < actionIndex);
  const directObject = immediateObject ?? objectCandidates.at(-1)?.[1];
  const symbolObject = CORE_SYMBOL_TERMS
    .filter((term) => clause.includes(term))
    .sort((a, b) => b.length - a.length)[0];
  const name = symbolObject ?? directObject ?? "";
  if (!name) return null;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const carriedOwnership = clause.match(
    new RegExp(`((?:차고|끼고|가지고|들고|아끼고|간직하고|사용하고)\\s*(?:계시던|있던|하던)\\s*${escapedName})`, "u")
  )?.[1];
  const subjectMention = subject?.mention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const usedOwnership = subjectMention
    ? clause.match(
        new RegExp(
          `${subjectMention}(?:이|가|은|는)?\\s*((?:신던|입던|쓰던|사용하던|아끼던|간직하던)(?:\\s+[가-힣A-Za-z0-9]{1,12}){0,2}\\s+${escapedName})`,
          "u"
        )
      )?.[1]
    : undefined;
  const dreamerOwnership = clause.match(
    new RegExp(`((?:제|내)\\s*${escapedName})`, "u")
  )?.[1];
  const personallyUsedEvidence = carriedOwnership ?? usedOwnership ?? "";
  const ownershipEvidence = compact(
    personallyUsedEvidence || dreamerOwnership || "",
    80,
  );
  const attributes: string[] = [];
  const personalValues: string[] = [];
  if (/은/u.test(name)) attributes.push("은으로 된 물건");
  if (/금/u.test(name)) attributes.push("금으로 된 물건");
  for (const [pattern, label] of [
    [/따뜻한/u, "따뜻함"],
    [/낡은|오래된/u, "시간이 지난 상태"],
    [/작은/u, "작은 크기"],
    [/큰/u, "큰 크기"],
    [/새(?:로운)?/u, "새로운 상태"],
  ] as Array<[RegExp, string]>) {
    if (pattern.test(clause.slice(Math.max(0, clause.indexOf(name) - 20), clause.indexOf(name) + name.length))) {
      attributes.push(label);
    }
  }
  if (personallyUsedEvidence) {
    attributes.push("몸에 지니거나 사용하던 물건");
    personalValues.push("애착", "추억", "개인적 가치", "쉽게 내놓지 않는 것");
  }
  if (/(오래|아끼|간직)/u.test(personallyUsedEvidence)) personalValues.push("시간이 쌓인 가치");

  return {
    name,
    owner: dreamerOwnership ? "나" : ownershipEvidence ? subject?.mention ?? "주체" : "",
    ownershipEvidence,
    attributes: unique(attributes),
    personalValues: unique(personalValues),
  };
}

function classifyAction(
  action: ReturnType<typeof findAction>,
  clause: string,
  purpose: ReturnType<typeof findPurpose>,
  object: DreamObjectContext | null
) {
  const subtypes = [...action.subtypes];
  if (action.normalized === "주다" || action.normalized === "선물하다") {
    if (/(선물|축하)/u.test(clause)) subtypes.push("선물");
    if (/(살림|생활비|보태|도와|지원)/u.test(`${clause} ${purpose.evidence}`)) subtypes.push("지원");
    if (/(물려|유산|상속)/u.test(clause)) subtypes.push("상속");
    if (/(맡아|책임|대신)/u.test(clause)) subtypes.push("위임");
    if (/(부탁|전해)/u.test(clause)) subtypes.push("부탁", "전달");
    if (object?.ownershipEvidence) subtypes.push("양보", "희생");
    else if (/(내어|포기|양보)/u.test(clause)) subtypes.push("양보", "희생");
  }
  return { ...action, subtypes: unique(subtypes) };
}

function inferEmotions(
  action: ReturnType<typeof findAction>,
  purpose: ReturnType<typeof findPurpose>,
  object: DreamObjectContext | null
) {
  const inferred: string[] = [];
  if (action.subtypes.includes("지원")) inferred.push("도움", "배려");
  if (action.subtypes.includes("희생") || object?.personalValues.length) inferred.push("기꺼이 내어주는 마음", "희생");
  if (action.subtypes.includes("회피")) inferred.push("거리 두고 싶은 마음");
  if (action.subtypes.includes("갈등")) inferred.push("긴장", "대립");
  if (action.subtypes.includes("해방")) inferred.push("놓임", "자유");
  if (purpose.meanings.includes("응원")) inferred.push("응원", "격려");
  return unique(inferred);
}

function resultFor(
  action: ReturnType<typeof findAction>,
  purpose: ReturnType<typeof findPurpose>,
  clause: string
) {
  const meanings: string[] = [];
  if (action.subtypes.includes("지원")) meanings.push("경제적·생활적 지원", "부담의 분담");
  if (action.subtypes.includes("부담 분담")) meanings.push("짐이나 책임을 함께 나눔");
  if (action.subtypes.includes("전달")) meanings.push("가치나 책임의 전달");
  if (action.subtypes.includes("회피")) meanings.push("대상과 거리를 둠");
  if (action.subtypes.includes("갈등")) meanings.push("관계의 긴장이 드러남");
  if (action.subtypes.includes("전환") || action.subtypes.includes("변화")) meanings.push("상황의 국면이 바뀜");
  if (action.subtypes.includes("해방")) meanings.push("제약에서 벗어남");
  if (purpose.meanings.includes("가정의 안정")) meanings.push("가정의 안정을 돕는 흐름");
  return { evidence: compact(clause, 120), meanings: unique(meanings) };
}

function relationshipDynamics(subject: DreamActor | null, target: DreamActor | null, action: ReturnType<typeof findAction>) {
  if (!subject || !target) return [];
  const dynamics = [
    `${subject.familySystem}의 ${subject.normalizedRole}와 ${target.familySystem}의 ${subjectEnding(target.normalizedRole)} 직접 이어지는 관계`,
  ];
  if (action.subtypes.includes("지원")) {
    const sharedFamilySystem =
      subject.familySystem !== "직장" && target.familySystem !== "직장";
    dynamics.push(
      sharedFamilySystem
        ? "가족 간 지원과 책임 분담"
        : "관계 안에서 도움과 책임을 나누는 흐름",
    );
  }
  if (action.normalized === "주다") dynamics.push("신뢰 또는 가치가 대상에게 전달됨");
  if (action.subtypes.includes("갈등")) dynamics.push("두 관계 사이의 긴장이나 경계");
  return unique(dynamics);
}

function dialogueAct(
  purpose: ReturnType<typeof findPurpose>,
  subject: DreamActor | null,
  target: DreamActor | null
): DreamDialogueAct | null {
  if (!purpose.evidence) return null;
  return {
    speaker: subject?.mention ?? "",
    addressee: target?.mention ?? "",
    words: purpose.evidence,
    intentions: purpose.meanings.length ? purpose.meanings : ["의사 전달", "관계에 대한 요청"],
  };
}

function extractScenes(dream: string): DreamScene[] {
  const clauses = narrativeClauses(dream).slice(0, 10);
  const scenes = clauses.map((clause, index) => {
    const actors = findActors(clause);
    const baseAction = findAction(clause);
    const purpose = findPurpose(clause);
    const object = findObject(clause, baseAction, actors.subject);
    const action = classifyAction(baseAction, clause, purpose, object);
    const expressedEmotions = unique(
      EMOTION_PATTERNS.filter(([pattern]) => pattern.test(clause)).map(([, label]) => label)
    );
    return {
      id: `scene-${index + 1}`,
      evidence: compact(clause, 220),
      subject: actors.subject,
      target: actors.target,
      action,
      object,
      purpose,
      expressedEmotions,
      inferredEmotions: inferEmotions(action, purpose, object),
      result: resultFor(action, purpose, clause),
      dialogue: dialogueAct(purpose, actors.subject, actors.target),
      relationshipDynamics: relationshipDynamics(actors.subject, actors.target, action),
    };
  });
  for (let index = 1; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const previous = scenes[index - 1];
    if (!scene.subject && previous.subject && scene.action.normalized === "말하다") {
      scene.subject = previous.subject;
      scene.target = previous.target ?? actorFromMention("나");
      scene.dialogue = dialogueAct(scene.purpose, scene.subject, scene.target);
      scene.relationshipDynamics = relationshipDynamics(scene.subject, scene.target, scene.action);
    }
    if (
      !scene.target &&
      previous.subject &&
      scene.subject &&
      scene.subject.mention !== previous.subject.mention &&
      scene.action.subtypes.some((subtype) => /도움|지원|길잡이|보호/u.test(subtype))
    ) {
      scene.target = previous.subject;
      scene.relationshipDynamics = relationshipDynamics(scene.subject, scene.target, scene.action);
    }
  }
  return scenes;
}

function eventFromScene(scene: DreamScene): DreamEvent {
  return {
    sceneId: scene.id,
    who: scene.subject?.mention ?? "꿈속의 주체",
    didWhat: scene.action.normalized,
    what: scene.object?.name ?? "",
    toWhom: scene.target?.mention ?? "",
    why: scene.purpose.evidence || scene.purpose.meanings.join(", "),
    how: unique([...scene.action.subtypes, ...scene.inferredEmotions]).join(", "),
    result: unique([scene.result.evidence, ...scene.result.meanings]).join(" · "),
    relationshipMeaning: scene.relationshipDynamics,
  };
}

function relationshipFromScene(scene: DreamScene): DreamRelationship | null {
  if (!scene.subject || !scene.target) return null;
  return {
    from: scene.subject.mention,
    to: scene.target.mention,
    relation: `${scene.subject.relationshipToDreamer} → ${scene.target.relationshipToDreamer}`,
    meanings: unique([
      ...scene.subject.relationalMeanings,
      ...scene.target.relationalMeanings,
      ...scene.relationshipDynamics,
    ]).slice(0, 8),
    evidence: scene.evidence,
  };
}

function extractFlow(scenes: DreamScene[]) {
  const evidence = scenes.map((scene) => scene.evidence);
  const first = evidence[0] ?? "";
  return {
    beginning: first,
    changes: evidence.slice(1, -1),
    ending: evidence.at(-1) ?? first,
  };
}

function extractContrasts(dream: string, scenes: DreamScene[], expressedEmotions: string[]) {
  const contrasts: string[] = [];
  if (/불안하지 않/u.test(dream) && /홀가분/u.test(dream)) {
    contrasts.push("부담스러운 상황과 달리 불안보다 홀가분함이 두드러짐");
  }
  if (/(가족|사람들).{0,18}가만히/u.test(dream) && /나만.{0,12}(?:도망|피)/u.test(dream)) {
    contrasts.push("주변 인물들은 멈춰 있지만 꿈속의 나는 혼자 피하려는 행동을 보임");
  }
  if (/(처음에는|처음엔)/u.test(dream) && /(마지막에는|마지막엔|결국)/u.test(dream)) {
    contrasts.push(`처음과 마지막의 감정 또는 상태가 달라짐: ${expressedEmotions.join(" → ")}`);
  }
  for (const scene of scenes) {
    if (scene.inferredEmotions.length && scene.expressedEmotions.length) {
      contrasts.push(
        `상황에서 추론되는 ${scene.inferredEmotions.join(", ")}와 직접 표현된 ${scene.expressedEmotions.join(", ")}을 함께 살필 필요가 있음`
      );
    }
  }
  return unique(contrasts).slice(0, 6);
}

function keySceneTitle(evidence: string, scene: DreamScene) {
  const patterns: Array<[RegExp, string]> = [
    [/가족.{0,20}(?:잔디밭|누워).{0,25}(?:하늘|바라)/u, "가족과 함께 누워 하늘을 바라본 모습"],
    [/(?:하늘에\s*닿을\s*만큼|아주|매우).{0,16}(?:높은|거대한)\s*건물|하늘에\s*닿을\s*만큼\s*높은\s*건물/u, "하늘에 닿을 만큼 높은 건물"],
    [/건물.{0,20}(?:두\s*발|일어나).{0,25}(?:걸어|지나)/u, "건물이 두 발로 걸어 지나간 장면"],
    [/시험장.{0,18}늦/u, "시험장에 늦게 도착한 장면"],
    [/시험지.{0,18}제출|시험.{0,18}(?:끝|종료)/u, "도착 전에 이미 끝난 시험"],
    [/불안하지.{0,24}홀가분|홀가분.{0,24}불안하지/u, "불안 대신 남은 홀가분함"],
    [/비.{0,18}그치.{0,20}햇빛/u, "비가 그치고 햇빛이 비친 마지막"],
    [/고양이.{0,20}창문\s*밖.{0,18}울/u, "창문 밖에서 울고 있던 고양이"],
    [/문.{0,12}열/u, "문을 열어준 행동"],
    [/(?:고양이|그 고양이).{0,20}새로\s*변.{0,20}날아/u, "고양이가 새로 변해 날아간 장면"],
    [/새로\s*변.{0,20}날아/u, "새로 변해 날아간 장면"],
    [/끝까지.{0,24}바라/u, "끝까지 바라본 마지막 장면"],
    [/친정\s*아빠|친정아빠/u, "친정아버지가 남편에게 건넨 도움"],
  ];
  const matched = patterns.find(([pattern]) => pattern.test(evidence));
  if (matched) return matched[1];
  if (scene.dialogue?.words) return `“${compact(scene.dialogue.words, 38)}”라는 말`;
  if (scene.object?.ownershipEvidence) {
    return `${naturalScenePerson(scene.object.owner)}가 지니던 ${scene.object.name}`;
  }
  if (scene.subject && scene.target) {
    return `${naturalScenePerson(scene.subject.mention)}가 ${naturalScenePerson(scene.target.mention)}에게 한 행동`;
  }
  if (scene.object?.name) return `${subjectEnding(scene.object.name)} 눈에 띈 장면`;
  if (scene.action.normalized !== "상태가 이어지다") {
    return `${scene.action.normalized.replace(/다$/u, "")}는 장면`;
  }
  return compact(evidence.replace(/^(?:그런데|하지만|마지막에는|마지막으로)\s*/u, ""), 44);
}

function naturalScenePerson(value: string) {
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

function subjectEnding(value: string) {
  return `${value}${hasBatchim(value) ? "이" : "가"}`;
}

function directionEnding(value: string) {
  const last = [...value].at(-1) ?? "";
  const code = last.charCodeAt(0);
  const jongseong =
    code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 : 0;
  return jongseong !== 0 && jongseong !== 8 ? "으로" : "로";
}

function sceneImportance(scene: DreamScene, index: number, total: number) {
  const evidence = scene.evidence;
  const reasons: string[] = [];
  let score = 0;
  if (/(하늘에\s*닿|거대|엄청|매우|너무\s*크|선명)/u.test(evidence)) {
    score += 4;
    reasons.push("크기나 선명함이 강조됨");
  }
  if (/(갑자기|변해|두\s*발|움직|걸어|날아)/u.test(evidence)) {
    score += 4;
    reasons.push("예상 밖의 변화가 일어남");
  }
  if (/(?:늦게|늦었|이미\s*제출|이미\s*끝)/u.test(evidence)) {
    score += 3;
    reasons.push("예상과 다른 시점이나 상태");
  }
  if (/문.{0,12}열/u.test(evidence)) {
    score += 3;
    reasons.push("경계를 여는 능동적인 행동");
  }
  if (scene.subject && (scene.target || scene.object)) {
    score += 3;
    reasons.push("주체와 대상의 관계가 중요함");
  }
  if (scene.purpose.evidence || scene.dialogue) {
    score += 4;
    reasons.push("말이나 행동의 목적이 드러남");
  }
  if (scene.object?.ownershipEvidence) {
    score += 4;
    reasons.push("물건의 소유·사용 맥락이 중요함");
  }
  if (scene.expressedEmotions.length) {
    score += 3;
    reasons.push("직접 표현한 감정이 있음");
  }
  if (/(계속|반복|자꾸)/u.test(evidence)) {
    score += 2;
    reasons.push("반복되거나 오래 바라본 장면");
  }
  if (index === total - 1) {
    score += 4;
    reasons.push("꿈의 마지막 장면");
  }
  if (scene.action.normalized !== "상태가 이어지다") score += 1;
  return { score, reasons: reasons.length ? reasons : ["꿈의 흐름을 이해하는 단서"] };
}

function selectKeyScenes(scenes: DreamScene[], dictionaryEntries: DreamDictionaryContextEntry[]) {
  const emotionContrastScenes = scenes.filter((scene) => scene.expressedEmotions.length);
  const hasEmotionChange =
    emotionContrastScenes.length >= 2 &&
    emotionContrastScenes[0].id !== emotionContrastScenes.at(-1)?.id;
  const ranked = scenes
    .map((scene, index) => ({
      scene,
      index,
      ...sceneImportance(scene, index, scenes.length),
    }))
    .filter(({ scene }) => !hasEmotionChange || !scene.expressedEmotions.length)
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const slotsForScenes = hasEmotionChange ? 3 : 4;
  const chosen = ranked.slice(
    0,
    Math.min(slotsForScenes, Math.max(2, ranked.length)),
  );
  const ending = ranked.find(({ index }) => index === scenes.length - 1);
  if (ending && !chosen.some(({ scene }) => scene.id === ending.scene.id)) {
    chosen[chosen.length - 1] = ending;
  }

  const frames: DreamKeySceneFrame[] = chosen
    .sort((left, right) => left.index - right.index)
    .map(({ scene, reasons }) => ({
      title: keySceneTitle(scene.evidence, scene),
      evidence: scene.evidence,
      reasons,
      sceneId: scene.id,
    }));
  if (hasEmotionChange) {
    const firstEmotion = emotionContrastScenes[0];
    const lastEmotion = emotionContrastScenes.at(-1) ?? firstEmotion;
    frames.push({
      title: `${firstEmotion.expressedEmotions.join("·")}에서 ${lastEmotion.expressedEmotions.join("·")}${directionEnding(lastEmotion.expressedEmotions.at(-1) ?? "")} 바뀐 감정`,
      evidence: compact(
        `${firstEmotion.evidence} ${lastEmotion.evidence}`,
        180,
      ),
      reasons: ["감정이 바뀌는 순간"],
      sceneId: `${firstEmotion.id}-${lastEmotion.id}`,
    });
    frames.sort((left, right) => {
      const leftIndex = scenes.findIndex((scene) => left.sceneId.startsWith(scene.id));
      const rightIndex = scenes.findIndex((scene) => right.sceneId.startsWith(scene.id));
      return leftIndex - rightIndex;
    });
  }

  const central = ranked[0]?.scene;
  const minimumFrames = central
    ? Math.min(
        3,
        1 +
          Number(Boolean(central.object?.ownershipEvidence)) +
          Number(Boolean(central.purpose.evidence)) +
          Number(Boolean(central.subject && central.target)),
      )
    : 2;
  const addFacet = (title: string, evidence: string, reason: string) => {
    if (
      frames.length < Math.max(2, minimumFrames) &&
      title &&
      evidence &&
      !frames.some((frame) => frame.title === title)
    ) {
      frames.push({
        title: compact(title, 80),
        evidence: compact(evidence, 180),
        reasons: [reason],
        sceneId: central?.id ?? "dictionary",
      });
    }
  };
  if (central?.object?.ownershipEvidence) {
    addFacet(
      `${naturalScenePerson(central.object.owner)}가 사용하던 ${central.object.name}`,
      central.object.ownershipEvidence,
      "소유·사용 맥락이 중요한 물건",
    );
  }
  if (central?.purpose.evidence) {
    addFacet(
      `“${compact(central.purpose.evidence, 38)}”라는 말에 담긴 목적`,
      central.evidence,
      "대화나 행동의 목적",
    );
  }
  if (central?.subject && central?.target) {
    addFacet(
      `${naturalScenePerson(central.subject.mention)}에게서 ${naturalScenePerson(central.target.mention)}에게로 이어진 행동`,
      central.evidence,
      "등장인물 사이의 관계",
    );
  }
  const dictionary = dictionaryEntries[0];
  if (dictionary) {
    addFacet(
      `${subjectEnding(dictionary.keyword)} 눈에 띈 장면`,
      dictionary.evidence,
      "꿈 사전에서 감지된 중심 상징",
    );
  }
  if (frames.length < Math.max(2, minimumFrames) && central) {
    addFacet(
      `${keySceneTitle(central.evidence, central)}의 결과`,
      central.result.evidence || central.evidence,
      "행동이 남긴 결과",
    );
  }
  return frames.slice(0, 4);
}

export function buildDreamRequestContext(
  dream: string,
  analysis: DreamAnalysis,
  entryLimit: number
): DreamRequestContext {
  const rankedKeywords = rankKeywords(dream, analysis.keywords).slice(0, entryLimit);
  const scenes = extractScenes(dream);
  const events = scenes.map(eventFromScene);
  const relationships = scenes
    .map(relationshipFromScene)
    .filter((relationship): relationship is DreamRelationship => relationship !== null);
  const ownershipSignals = scenes
    .map((scene) => scene.object)
    .filter((object): object is DreamObjectContext => Boolean(object?.ownershipEvidence));
  const dialogueActs = scenes
    .map((scene) => scene.dialogue)
    .filter((dialogue): dialogue is DreamDialogueAct => dialogue !== null);
  const eventFlow = extractFlow(scenes);
  const expressedEmotions = unique([
    ...scenes.flatMap((scene) => scene.expressedEmotions),
  ]);
  const symbols = unique([
    ...scenes.flatMap((scene) => scene.object?.name ? [scene.object.name] : []),
    ...rankedKeywords.map((item) => item.keyword),
    ...CORE_SYMBOL_TERMS.filter((term) => dream.includes(term)),
  ]);

  const dictionaryEntries = rankedKeywords.map((item) => ({
    keyword: item.keyword,
    aliases: (item.aliases ?? []).slice(0, 8),
    basicMeaning: compact(item.meaning, 220),
    positiveMeaning: compact(item.good, 180),
    caution: compact(item.caution, 180),
    evidence: evidenceClause(dream, item),
  }));

  return {
    scenes,
    keyScenes: selectKeyScenes(scenes, dictionaryEntries),
    events,
    relationships,
    ownershipSignals,
    dialogueActs,
    characters: unique(scenes.flatMap((scene) =>
      [scene.subject?.mention ?? "", scene.target?.mention ?? ""]
    )),
    places: unique(PLACE_TERMS.filter((term) => dream.includes(term))),
    symbols,
    actions: unique(scenes.map((scene) => scene.action.normalized)),
    states: unique(scenes.flatMap((scene) => scene.result.meanings)),
    emotions: analysis.emotions,
    expressedEmotions,
    situations: analysis.situations,
    contrasts: extractContrasts(dream, scenes, expressedEmotions),
    repeatedScenes: scenes
      .filter((scene) => /(계속|반복|때마다|여러 번|자꾸)/u.test(scene.evidence))
      .map((scene) => scene.evidence)
      .slice(0, 4),
    unexpectedEnding:
      /(그런데|하지만|오히려|이상하게|마지막에는|마지막엔|결국|변해|그치고|안심|홀가분)/u.test(dream)
        ? eventFlow.ending
        : "",
    eventFlow,
    symbolRelationships: unique([
      ...scenes.flatMap((scene) => scene.relationshipDynamics),
      ...events.flatMap((event) => event.relationshipMeaning),
    ]).slice(0, 8),
    dictionaryEntries,
  };
}
