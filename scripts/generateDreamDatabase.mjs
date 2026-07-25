// 핵심 상징(꿈 사전 키워드) x 19개 상황을 조합해 대량의 "꿈" 데이터를 생성하는 스크립트입니다.
//
// 실행:
//   node scripts/generateDreamDatabase.mjs
//
// 결과: data/json/generated-dreams.json 에 { 핵심 상징 수 } x { 상황 수 } 개의 항목이 저장됩니다.
//
// 주의: 자동 생성된 항목은 전문가가 한 줄 한 줄 검수한 데이터가 아닙니다.
// 검색량이 높은 상징부터 사람이 직접 다듬어 나가는 것을 권장합니다. (핵심 상징 자체는
// data/json/*.json 에 수작업으로 작성되어 있고, 이 스크립트는 그 상징들에 "상황"을 조합만 합니다.)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { situations as situationDefinitions } from "../data/situations.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonDir = path.join(__dirname, "..", "data", "json");

const categoryFiles = [
  "animals.json",
  "nature.json",
  "body.json",
  "people.json",
  "places.json",
  "money.json",
  "actions.json",
  "objects.json",
];

function loadCoreSymbols() {
  const all = [];
  for (const file of categoryFiles) {
    const raw = readFileSync(path.join(jsonDir, file), "utf8");
    const items = JSON.parse(raw);
    all.push(...items);
  }
  return all;
}

// 제목용 명사구만 생성기에 두고, 실제 해석 문장은 data/situations.ts를 단일 원본으로 사용합니다.
const phraseNouns = {
  추격: "쫓기는 상황",
  공격: "공격받는 상황",
  극복: "붙잡거나 이겨내는 상황",
  종료: "사라지거나 죽는 상황",
  소실: "잃어버리는 상황",
  등장: "갑자기 나타나는 상황",
  회피: "피해 도망가는 상황",
  갈등: "다투거나 부딪히는 상황",
  도움: "구하거나 도와주는 상황",
  상실: "빼앗기거나 놓치는 상황",
  발견: "발견하거나 줍는 상황",
  확대: "커지거나 거대해지는 상황",
  축소: "작아지는 상황",
  부상: "다치는 상황",
  변화: "다른 모습으로 변하는 상황",
  기쁨표현: "함께 웃고 기뻐하는 상황",
  슬픔표현: "울거나 슬퍼하는 상황",
  반복: "반복해서 나타나는 상황",
  무시: "홀대받는 상황",
};

const situations = situationDefinitions.map((situation) => ({
  ...situation,
  phraseNoun: phraseNouns[situation.type],
}));

function toSlug(coreKeyword, situationType) {
  return `${coreKeyword}-${situationType}`;
}

function hasBatchim(value) {
  const last = [...value.trim()].at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

function endsWithRieul(value) {
  const last = [...value.trim()].at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8;
}

function formatWithJosa(template, keyword) {
  return template
    .replaceAll("%s[를/을]", `${keyword}${hasBatchim(keyword) ? "을" : "를"}`)
    .replaceAll("%s[가/이]", `${keyword}${hasBatchim(keyword) ? "이" : "가"}`)
    .replaceAll(
      "%s[와/과]",
      `${keyword}${hasBatchim(keyword) ? "과" : "와"}`,
    )
    .replaceAll(
      "%s[로부터/으로부터]",
      `${keyword}${hasBatchim(keyword) && !endsWithRieul(keyword) ? "으로부터" : "로부터"}`,
    )
    .replaceAll("%s", keyword);
}

function generate() {
  const coreSymbols = loadCoreSymbols();
  const generated = [];

  for (const symbol of coreSymbols) {
    for (const situation of situations) {
      const filledDescription = formatWithJosa(
        situation.description,
        symbol.keyword,
      );
      if (!situation.phraseNoun) {
        throw new Error(`제목용 상황 문구가 없습니다: ${situation.type}`);
      }

      generated.push({
        keyword: `${symbol.keyword} ${situation.phraseNoun}`,
        emoji: symbol.emoji,
        category: symbol.category,
        meaning: `${symbol.meaning} ${filledDescription}`,
        good: symbol.good,
        caution: symbol.caution,
        related: symbol.related ?? [],
        generated: true,
        baseKeyword: symbol.keyword,
        situationType: situation.type,
        slug: toSlug(symbol.keyword, situation.type),
      });
    }
  }

  const outPath = path.join(jsonDir, "generated-dreams.json");
  writeFileSync(outPath, JSON.stringify(generated, null, 2), "utf8");

  console.log(`핵심 상징 ${coreSymbols.length}개 x 상황 ${situations.length}개 = ${generated.length}개 생성 완료`);
  console.log(`저장 위치: ${outPath}`);
}

generate();
