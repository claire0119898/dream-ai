import type { DreamAnalysis, DreamKeyword } from "../types/dream";

export type DreamDictionaryContextEntry = {
  keyword: string;
  aliases: string[];
  basicMeaning: string;
  positiveMeaning: string;
  caution: string;
  evidence: string;
};

export type DreamRequestContext = {
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

function compact(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function narrativeClauses(dream: string) {
  const marked = dream
    .replace(/(그런데|하지만|그러다가|마지막에는|마지막으로|그러자|이후에)/gu, "|||$1")
    .replace(/(지만|는데|다가|았고|었고|했고)(?=\s|,|$)/gu, "$1|||")
    .replace(/[,，](?=\s*)/gu, "|||");
  return marked
    .split(/\|\|\||(?<=[.!?。！？])/u)
    .map((part) => compact(part, 180))
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
  const clauses = narrativeClauses(dream).map((part) => compact(part, 100));
  return clauses.find((clause) => clause.includes(term)) ?? term;
}

function rankKeywords(dream: string, keywords: DreamKeyword[]) {
  return keywords
    .map((item, index) => {
      const terms = [item.keyword, ...(item.aliases ?? [])];
      const firstPosition = Math.min(
        ...terms
          .map((term) => dream.indexOf(term))
          .filter((position) => position >= 0),
        Number.MAX_SAFE_INTEGER
      );
      return { item, index, firstPosition };
    })
    .sort((a, b) => a.firstPosition - b.firstPosition || a.index - b.index)
    .map(({ item }) => item);
}

function extractFlow(dream: string) {
  const clauses = narrativeClauses(dream).slice(0, 8);

  if (clauses.length === 0) {
    const whole = compact(dream, 180);
    return { beginning: whole, changes: [], ending: whole };
  }

  return {
    beginning: clauses[0],
    changes: clauses.slice(1, -1),
    ending: clauses.length > 1 ? clauses.at(-1) ?? clauses[0] : clauses[0],
  };
}

const CHARACTER_TERMS = [
  "가족",
  "부모님",
  "어머니",
  "아버지",
  "친구",
  "아이",
  "아기",
  "사람들",
  "낯선 사람",
  "동료",
  "선생님",
];
const PLACE_TERMS = [
  "시험장",
  "회사",
  "엘리베이터",
  "집 안",
  "집",
  "학교",
  "교실",
  "병원",
  "길",
  "바다",
  "산",
  "창문 밖",
];
const CORE_SYMBOL_TERMS = [
  "시험지",
  "비",
  "햇빛",
  "구렁이",
  "뱀",
  "엘리베이터",
  "층수",
  "문",
  "창문",
  "고양이",
  "새",
];
const ACTION_PATTERNS: Array<[RegExp, string]> = [
  [/늦(?:게|어서|었다|었는데)?\s*(?:도착|들어)/u, "늦게 도착함"],
  [/시험지.{0,12}(?:제출|걷혀|끝)/u, "시험이 이미 끝난 상태"],
  [/(?:밖으로|시험장을|회사를|집을).{0,8}(?:나오|떠나)/u, "그 장소를 떠남"],
  [/비가.{0,8}(?:그치|멎)/u, "비가 그침"],
  [/햇빛.{0,8}(?:비치|비쳤|나타|들)/u, "햇빛이 나타남"],
  [/(?:들어오|들어왔)/u, "안으로 들어옴"],
  [/(?:도망|피했|달아났)/u, "도망치거나 피함"],
  [/눈을.{0,6}마주/u, "눈을 마주침"],
  [/(?:위로|계속).{0,10}올라/u, "계속 위로 올라감"],
  [/층수.{0,10}(?:표시되지|보이지|없)/u, "층수가 표시되지 않음"],
  [/문이.{0,8}열릴 때마다/u, "문이 열릴 때마다 장면이 바뀜"],
  [/(?:타고|탔고|탔)/u, "누군가 함께 탐"],
  [/내릴 곳.{0,10}(?:찾지 못|없)/u, "내릴 곳을 찾지 못함"],
  [/(?:울고|울었|운다)/u, "울고 있음"],
  [/문을.{0,8}(?:열|열었)/u, "문을 엶"],
  [/(?:새로|다른 모습으로).{0,8}(?:변해|변했)/u, "다른 존재로 변함"],
  [/(?:날아가|날아갔)/u, "날아감"],
  [/(?:가만히|움직이지 않)/u, "움직이지 않고 지켜봄"],
];
const STATE_PATTERNS: Array<[RegExp, string]> = [
  [/이미.{0,16}(?:제출|끝|종료)/u, "이미 끝난 상태"],
  [/(?:표시되지|보이지 않)/u, "정보가 보이지 않는 상태"],
  [/(?:찾지 못|갈 수 없|나갈 수 없)/u, "원하는 곳을 찾지 못한 상태"],
  [/(?:불안하지 않|무섭지 않|걱정되지 않)/u, "예상과 달리 불안하지 않은 상태"],
];
const EMOTION_PATTERNS: Array<[RegExp, string]> = [
  [/불안하지 않(?:았고|았다|았습니다)?/u, "불안하지 않음"],
  [/홀가분(?:했|했다|했습니다|함)/u, "홀가분함"],
  [/걱정(?:했|했다|했습니다|됨)/u, "걱정"],
  [/안심(?:했|했다|했습니다|함)/u, "안심"],
  [/무서(?:웠|웠다|웠습니다|움)/u, "두려움"],
  [/기뻐(?:했|했다|웠|움)/u, "기쁨"],
  [/답답(?:했|했다|함)/u, "답답함"],
];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function termsInDream(dream: string, terms: string[]) {
  return terms.filter((term) => dream.includes(term));
}

function patternLabels(dream: string, patterns: Array<[RegExp, string]>) {
  return patterns.filter(([pattern]) => pattern.test(dream)).map(([, label]) => label);
}

function extractContrasts(dream: string, clauses: string[], expressedEmotions: string[]) {
  const contrasts: string[] = [];
  if (/불안하지 않/u.test(dream) && /홀가분/u.test(dream)) {
    contrasts.push("부담스러운 상황과 달리 불안보다 홀가분함이 두드러짐");
  }
  if (/(가족|사람들).{0,18}가만히/u.test(dream) && /나만.{0,12}(?:도망|피)/u.test(dream)) {
    contrasts.push("주변 인물들은 멈춰 있지만 꿈속의 나는 혼자 피하려는 행동을 보임");
  }
  if (/(?:위로|계속).{0,12}올라/u.test(dream) && /(층수.{0,12}표시되지|내릴 곳.{0,12}찾지 못)/u.test(dream)) {
    contrasts.push("계속 상승하는 움직임과 목적지·위치 정보가 없는 상태가 대비됨");
  }
  if (/(처음에는|처음엔)/u.test(dream) && /(마지막에는|마지막엔|결국)/u.test(dream)) {
    contrasts.push(`처음과 마지막의 감정 또는 상태가 달라짐: ${expressedEmotions.join(" → ")}`);
  }
  const connectorClause = clauses.find(
    (clause) => /(그런데|하지만|오히려|이상하게)/u.test(clause) && expressedEmotions.some((emotion) => clause.includes(emotion.replace(/함$|음$/u, "")))
  );
  if (connectorClause) contrasts.push(compact(connectorClause, 150));
  return unique(contrasts);
}

function extractRepeatedScenes(dream: string, clauses: string[]) {
  return clauses
    .filter((clause) => /(계속|반복|때마다|여러 번|자꾸)/u.test(clause))
    .map((clause) => compact(clause, 150))
    .slice(0, 4);
}

function extractUnexpectedEnding(dream: string, ending: string) {
  if (/(변해|변했|그치고|햇빛|안심|홀가분|눈을 마주|찾지 못)/u.test(ending)) return ending;
  if (/(그런데|하지만|오히려|이상하게|마지막에는|마지막엔)/u.test(dream)) return ending;
  return "";
}

export function buildDreamRequestContext(
  dream: string,
  analysis: DreamAnalysis,
  entryLimit: number
): DreamRequestContext {
  const rankedKeywords = rankKeywords(dream, analysis.keywords).slice(0, entryLimit);
  const symbols = unique([
    ...rankedKeywords.map((item) => item.keyword),
    ...termsInDream(dream, CORE_SYMBOL_TERMS),
  ]);
  const clauses = narrativeClauses(dream);
  const eventFlow = extractFlow(dream);
  const expressedEmotions = unique([
    ...patternLabels(dream, EMOTION_PATTERNS),
    ...analysis.emotions,
  ]);
  const symbolRelationships: string[] = [];

  for (let index = 0; index < symbols.length - 1; index += 1) {
    symbolRelationships.push(`${symbols[index]}와(과) ${symbols[index + 1]}이 같은 흐름에서 함께 등장`);
  }
  if (analysis.emotions.length && symbols.length) {
    symbolRelationships.push(`${symbols.join(", ")} 장면에서 ${analysis.emotions.join(", ")} 감지가 함께 나타남`);
  }
  if (analysis.situations.length && symbols.length) {
    symbolRelationships.push(`${symbols.join(", ")} 상징이 ${analysis.situations.join(", ")} 상황과 연결됨`);
  }

  return {
    characters: unique([
      ...rankedKeywords.filter((item) => item.category === "사람").map((item) => item.keyword),
      ...termsInDream(dream, CHARACTER_TERMS),
    ]),
    places: unique([
      ...rankedKeywords.filter((item) => item.category === "장소").map((item) => item.keyword),
      ...termsInDream(dream, PLACE_TERMS),
    ]),
    symbols,
    actions: unique(patternLabels(dream, ACTION_PATTERNS)),
    states: unique(patternLabels(dream, STATE_PATTERNS)),
    emotions: analysis.emotions,
    expressedEmotions,
    situations: analysis.situations,
    contrasts: extractContrasts(dream, clauses, expressedEmotions),
    repeatedScenes: extractRepeatedScenes(dream, clauses),
    unexpectedEnding: extractUnexpectedEnding(dream, eventFlow.ending),
    eventFlow,
    symbolRelationships: symbolRelationships.slice(0, 8),
    dictionaryEntries: rankedKeywords.map((item) => ({
      keyword: item.keyword,
      aliases: (item.aliases ?? []).slice(0, 8),
      basicMeaning: compact(item.meaning, 220),
      positiveMeaning: compact(item.good, 180),
      caution: compact(item.caution, 180),
      evidence: evidenceClause(dream, item),
    })),
  };
}
