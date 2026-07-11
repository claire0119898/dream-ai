// 핵심 상징(꿈 사전 키워드) x 18개 상황을 조합해 대량의 "꿈" 데이터를 생성하는 스크립트입니다.
//
// 실행:
//   node scripts/generateDreamDatabase.mjs
//
// 결과: data/json/generated-dreams.json 에 { 핵심 상징 수 } x { 상황 수 } 개의 항목이 저장됩니다.
//
// 주의: 자동 생성된 항목은 전문가가 한 줄 한 줄 검수한 데이터가 아닙니다.
// 검색량이 높은 상징부터 사람이 직접 다듬어 나가는 것을 권장합니다. (핵심 상징 자체는
// data/json/*.json 에 手작업으로 작성되어 있고, 이 스크립트는 그 상징들에 "상황"을 조합만 합니다.)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

// 18개 대표 상황. phraseNoun은 상징 뒤에 그대로 붙여도 자연스러운 명사구입니다.
// (조사 결합 문제를 피하기 위해 "상징 + 명사구" 형태로 제목을 만듭니다.)
const situations = [
  { type: "추격", phraseNoun: "쫓기는 상황", description: "%s에게 쫓기는 느낌이었다면, 현실에서 피하고 싶은 문제나 압박감이 마음 한켠에 자리하고 있다는 신호일 수 있습니다." },
  { type: "공격", phraseNoun: "공격받는 상황", description: "%s에게 공격받거나 물리고 할퀴었다면, 관계나 상황에서 느낀 날카로운 상처나 갈등이 반영되었을 수 있습니다." },
  { type: "극복", phraseNoun: "붙잡거나 이겨내는 상황", description: "%s를 붙잡거나 이겨냈다면, 그 상징이 뜻하는 문제를 스스로 통제하고 극복해가는 힘이 있다는 뜻일 수 있습니다." },
  { type: "종료", phraseNoun: "사라지거나 죽는 상황", description: "%s가 죽거나 사라지는 장면이었다면, 그 상징과 관련된 한 시기나 감정이 마무리되고 있다는 의미일 수 있습니다." },
  { type: "소실", phraseNoun: "잃어버리는 상황", description: "%s를 잃어버리거나 갑자기 사라졌다면, 소중하게 여기던 것을 놓칠까 봐 걱정하는 마음이 담겨 있을 수 있습니다." },
  { type: "등장", phraseNoun: "갑자기 나타나는 상황", description: "%s가 갑자기 나타나거나 집으로 들어왔다면, 예상하지 못한 소식이나 변화가 다가오고 있다는 뜻일 수 있습니다." },
  { type: "회피", phraseNoun: "피해 도망가는 상황", description: "%s로부터 도망쳤다면, 현재 마주하기 부담스러운 문제를 피하고 싶은 마음을 반영하는 것일 수 있습니다." },
  { type: "갈등", phraseNoun: "다투거나 부딪히는 상황", description: "%s와 싸우거나 부딪혔다면, 그 상징이 의미하는 대상이나 상황과의 긴장 관계를 나타낼 수 있습니다." },
  { type: "도움", phraseNoun: "구하거나 도와주는 상황", description: "%s를 구하거나 도왔다면, 주변 사람에게 힘이 되어주고 싶은 마음이나 책임감을 의미할 수 있습니다." },
  { type: "상실", phraseNoun: "빼앗기거나 놓치는 상황", description: "%s를 빼앗기거나 놓쳤다면, 기회나 관계를 잃을까 하는 불안한 심리 상태를 반영할 수 있습니다." },
  { type: "발견", phraseNoun: "발견하거나 줍는 상황", description: "%s를 발견하거나 주웠다면, 예상치 못한 좋은 기회나 해답을 얻게 될 수 있음을 의미할 수 있습니다." },
  { type: "확대", phraseNoun: "커지거나 거대해지는 상황", description: "%s가 크고 거대하게 느껴졌다면, 그 상징이 뜻하는 문제나 감정의 비중이 현재 마음속에서 크게 자리하고 있다는 뜻일 수 있습니다." },
  { type: "축소", phraseNoun: "작아지는 상황", description: "%s가 작게 느껴졌다면, 걱정하던 문제가 생각보다 크지 않거나 통제 가능한 수준이라는 신호일 수 있습니다." },
  { type: "부상", phraseNoun: "다치는 상황", description: "%s와 관련해 다치는 느낌이었다면, 그 영역에서 겪은 마음의 상처나 부담을 나타낼 수 있습니다." },
  { type: "변화", phraseNoun: "다른 모습으로 변하는 상황", description: "%s가 다른 모습으로 변했다면, 그 상징과 관련된 상황이나 관계가 새로운 국면으로 접어들고 있다는 뜻일 수 있습니다." },
  { type: "기쁨표현", phraseNoun: "함께 웃고 기뻐하는 상황", description: "%s와 함께 웃고 기뻐했다면, 그 상징이 현재 삶에 긍정적인 에너지를 더해주고 있다는 의미일 수 있습니다." },
  { type: "슬픔표현", phraseNoun: "울거나 슬퍼하는 상황", description: "%s와 관련해 울거나 슬퍼했다면, 그동안 표현하지 못한 감정이 꿈을 통해 드러난 것일 수 있습니다." },
  { type: "반복", phraseNoun: "반복해서 나타나는 상황", description: "%s가 꿈에 반복해서 등장했다면, 현실에서 그만큼 자주 신경 쓰이는 문제나 감정이라는 신호일 수 있습니다." },
];

function toSlug(coreKeyword, situationType) {
  return `${coreKeyword}-${situationType}`;
}

function generate() {
  const coreSymbols = loadCoreSymbols();
  const generated = [];

  for (const symbol of coreSymbols) {
    for (const situation of situations) {
      const filledDescription = situation.description.replace("%s", symbol.keyword);

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
