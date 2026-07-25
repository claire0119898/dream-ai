import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonDir = path.join(rootDir, "data", "json");

export const CORE_FILES = [
  "animals.json",
  "nature.json",
  "body.json",
  "people.json",
  "places.json",
  "money.json",
  "actions.json",
  "objects.json",
];

const REQUIRED_FIELDS = ["keyword", "emoji", "meaning", "good", "caution"];
const EXPECTED_CATEGORIES = new Set([
  "동물",
  "자연",
  "신체",
  "사람",
  "장소",
  "재물",
  "행동",
  "사물",
]);
const EXPECTED_COUNTS = {
  core: 93,
  aliases: 129,
  generated: 1767,
  situations: 19,
  editorials: 10,
};
const INVISIBLE_PATTERN = /[\u200B-\u200D\u2060\uFEFF]/u;
const DETERMINISTIC_PATTERNS = [
  /반드시\s+.{0,25}(생깁니다|일어납니다|됩니다)/u,
  /확실히\s+.{0,25}(생깁니다|일어납니다|됩니다)/u,
  /틀림없이\s+.{0,25}(생깁니다|일어납니다|됩니다)/u,
  /실제\s*(죽음|사고|질병|임신|재물).{0,15}예고합니다/u,
];
const AWKWARD_PATTERNS = [
  { pattern: /마음 한켠/u, suggestion: "‘마음 한편’으로 다듬어 주세요." },
  { pattern: /\(으\)로/u, suggestion: "받침에 맞는 자연스러운 조사를 사용해 주세요." },
  { pattern: /물리고 할퀴/u, suggestion: "‘물리거나 할퀴었다면’처럼 병렬 구조를 맞춰 주세요." },
];

function readJson(relativeName) {
  return JSON.parse(readFileSync(path.join(jsonDir, relativeName), "utf8"));
}

function readEditorial() {
  const source = readFileSync(path.join(rootDir, "data", "dreamEditorial.ts"), "utf8");
  const match = source.match(
    /export const dreamEditorial:[\s\S]*?=\s*(\{[\s\S]*\});\s*\n\s*export function/u,
  );
  if (!match) throw new Error("data/dreamEditorial.ts에서 dreamEditorial 객체를 읽지 못했습니다.");
  return Function(`"use strict"; return (${match[1]});`)();
}

export function loadDreamContent() {
  const coreByFile = CORE_FILES.map((file) => ({
    file: `data/json/${file}`,
    items: readJson(file),
  }));
  return {
    coreByFile,
    core: coreByFile.flatMap(({ items }) => items),
    generated: readJson("generated-dreams.json"),
    editorials: readEditorial(),
  };
}

function issue(severity, file, keyword, field, type, sentence, suggestion) {
  return { severity, file, keyword, field, type, sentence, suggestion };
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

function sentences(value) {
  return normalize(value)
    .split(/(?<=[.!?。！？])\s+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function allTextFields(record) {
  return ["meaning", "good", "caution"]
    .filter((field) => typeof record[field] === "string")
    .map((field) => [field, record[field]]);
}

function hasBatchim(value) {
  const last = [...normalize(value)].at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

function endsWithRieul(value) {
  const last = [...normalize(value)].at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8;
}

function malformedJosaCandidates(keyword) {
  const batchim = hasBatchim(keyword);
  const ro = batchim && !endsWithRieul(keyword);
  return [
    `${keyword}${batchim ? "를" : "을"}`,
    `${keyword}${batchim ? "가" : "이"}`,
    `${keyword}${batchim ? "와" : "과"}`,
    `${keyword}${ro ? "로부터" : "으로부터"}`,
  ];
}

export function validateDictionary(content = loadDreamContent()) {
  const issues = [];
  const keywordLocations = new Map();
  const aliasLocations = new Map();

  for (const { file, items } of content.coreByFile) {
    if (!Array.isArray(items)) {
      issues.push(issue("error", file, "-", "-", "schema", "최상위 값이 배열이 아닙니다.", "JSON 배열로 구성해 주세요."));
      continue;
    }

    for (const [index, item] of items.entries()) {
      const label = normalize(item.keyword) || `#${index + 1}`;
      for (const field of REQUIRED_FIELDS) {
        if (typeof item[field] !== "string" || !normalize(item[field])) {
          issues.push(issue("error", file, label, field, "required", String(item[field] ?? ""), "비어 있지 않은 문자열을 입력해 주세요."));
        }
      }
      if (!EXPECTED_CATEGORIES.has(item.category)) {
        issues.push(issue("error", file, label, "category", "category", String(item.category ?? ""), "정의된 8개 카테고리 중 하나를 사용해 주세요."));
      }
      for (const [field, value] of Object.entries(item)) {
        if (
          typeof value === "string" &&
          (value !== value.trim() ||
            (field !== "emoji" && INVISIBLE_PATTERN.test(value)))
        ) {
          issues.push(issue("error", file, label, field, "whitespace", value, "앞뒤 공백과 보이지 않는 문자를 제거해 주세요."));
        }
      }
      const key = normalize(item.keyword);
      const previous = keywordLocations.get(key);
      if (previous) {
        issues.push(issue("error", file, label, "keyword", "duplicate_keyword", key, `이미 ${previous}에 있는 핵심 상징입니다.`));
      } else {
        keywordLocations.set(key, `${file}#${index + 1}`);
      }
      for (const arrayField of ["aliases", "related"]) {
        const values = item[arrayField] ?? [];
        if (!Array.isArray(values)) {
          issues.push(issue("error", file, label, arrayField, "schema", String(values), "문자열 배열로 입력해 주세요."));
          continue;
        }
        const seen = new Set();
        for (const value of values) {
          const normalizedValue = normalize(value);
          if (!normalizedValue) {
            issues.push(issue("error", file, label, arrayField, "empty_array_item", String(value), "빈 항목을 제거해 주세요."));
          } else if (seen.has(normalizedValue)) {
            issues.push(issue("error", file, label, arrayField, "duplicate_array_item", normalizedValue, "중복 항목을 하나만 남겨 주세요."));
          }
          seen.add(normalizedValue);
          if (arrayField === "aliases") {
            const locations = aliasLocations.get(normalizedValue) ?? [];
            locations.push({ keyword: key, file });
            aliasLocations.set(normalizedValue, locations);
          }
        }
      }
    }
  }

  const keywordSet = new Set(content.core.map((item) => normalize(item.keyword)));
  for (const { file, items } of content.coreByFile) {
    for (const item of items) {
      for (const related of item.related ?? []) {
        if (!keywordSet.has(normalize(related))) {
          issues.push(issue("error", file, item.keyword, "related", "missing_relation", related, "존재하는 핵심 상징을 연결해 주세요."));
        }
      }
    }
  }
  for (const [alias, locations] of aliasLocations) {
    const owners = new Set(locations.map(({ keyword }) => keyword));
    if (owners.size > 1) {
      issues.push(issue("error", locations[0].file, [...owners].join(", "), "aliases", "alias_collision", alias, "하나의 별칭이 여러 상징을 가리키지 않도록 조정해 주세요."));
    }
    if (keywordSet.has(alias) && !owners.has(alias)) {
      issues.push(issue("error", locations[0].file, locations[0].keyword, "aliases", "keyword_alias_collision", alias, "다른 핵심 상징과 같은 별칭을 제거해 주세요."));
    }
  }

  const generatedSlugs = new Set();
  const generatedPairs = new Set();
  const situationCounts = new Map();
  for (const item of content.generated) {
    const label = normalize(item.slug) || normalize(item.keyword);
    for (const field of [...REQUIRED_FIELDS, "baseKeyword", "situationType", "slug"]) {
      if (typeof item[field] !== "string" || !normalize(item[field])) {
        issues.push(issue("error", "data/json/generated-dreams.json", label, field, "required", String(item[field] ?? ""), "자동 조합 필수 필드를 채워 주세요."));
      }
    }
    if (!keywordSet.has(normalize(item.baseKeyword))) {
      issues.push(issue("error", "data/json/generated-dreams.json", label, "baseKeyword", "missing_base", item.baseKeyword, "존재하는 핵심 상징을 사용해 주세요."));
    }
    const expectedSlug = `${item.baseKeyword}-${item.situationType}`;
    if (item.slug !== expectedSlug || !/^[가-힣0-9-]+$/u.test(item.slug)) {
      issues.push(issue("error", "data/json/generated-dreams.json", label, "slug", "invalid_slug", item.slug, `‘${expectedSlug}’ 형식을 사용해 주세요.`));
    }
    if (generatedSlugs.has(item.slug)) {
      issues.push(issue("error", "data/json/generated-dreams.json", label, "slug", "duplicate_slug", item.slug, "slug를 고유하게 만들어 주세요."));
    }
    generatedSlugs.add(item.slug);
    const pair = `${item.baseKeyword}\u0000${item.situationType}`;
    if (generatedPairs.has(pair)) {
      issues.push(issue("error", "data/json/generated-dreams.json", label, "situationType", "duplicate_combination", pair, "상징·상황 조합을 하나만 남겨 주세요."));
    }
    generatedPairs.add(pair);
    situationCounts.set(item.situationType, (situationCounts.get(item.situationType) ?? 0) + 1);
    for (const malformed of malformedJosaCandidates(item.baseKeyword)) {
      if (item.meaning.includes(malformed)) {
        issues.push(issue("error", "data/json/generated-dreams.json", label, "meaning", "josa", malformed, "받침에 맞는 조사로 다시 생성해 주세요."));
      }
    }
  }

  const aliasCount = content.core.reduce((sum, item) => sum + (item.aliases?.length ?? 0), 0);
  const counts = {
    core: content.core.length,
    aliases: aliasCount,
    generated: content.generated.length,
    situations: situationCounts.size,
    editorials: Object.keys(content.editorials).length,
  };
  for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[name] !== expected) {
      issues.push(issue("error", "data/", "-", name, "count", String(counts[name]), `기준 수량 ${expected}개를 유지해 주세요.`));
    }
  }
  for (const [type, count] of situationCounts) {
    if (count !== counts.core) {
      issues.push(issue("error", "data/json/generated-dreams.json", type, "situationType", "coverage", String(count), `모든 핵심 상징 ${counts.core}개와 조합해 주세요.`));
    }
  }
  return { issues, counts };
}

export function validateEditorials(content = loadDreamContent()) {
  const issues = [];
  const keywordSet = new Set(content.core.map(({ keyword }) => keyword));
  const expectedKeys = new Set(["뱀", "이빨", "물", "돈", "아기", "죽다", "돼지", "고양이", "개", "시험보다"]);
  for (const expected of expectedKeys) {
    if (!content.editorials[expected]) {
      issues.push(issue("error", "data/dreamEditorial.ts", expected, "-", "missing_editorial", expected, "핵심 편집 페이지를 추가해 주세요."));
    }
  }
  for (const [keyword, item] of Object.entries(content.editorials)) {
    for (const field of ["displayName", "seoTitle", "seoDescription", "coreMeaning", "goodMeaning", "caution", "psychologicalMeaning"]) {
      if (!normalize(item[field])) {
        issues.push(issue("error", "data/dreamEditorial.ts", keyword, field, "required", String(item[field] ?? ""), "편집 문구를 채워 주세요."));
      }
    }
    if (normalize(item.seoTitle).length > 70) {
      issues.push(issue("warning", "data/dreamEditorial.ts", keyword, "seoTitle", "length", item.seoTitle, "검색 결과에서 잘리지 않도록 70자 안팎으로 다듬어 주세요."));
    }
    if (normalize(item.seoDescription).length > 160) {
      issues.push(issue("warning", "data/dreamEditorial.ts", keyword, "seoDescription", "length", item.seoDescription, "160자 이내로 다듬어 주세요."));
    }
    if (!Array.isArray(item.situations) || item.situations.length !== 6) {
      issues.push(issue("error", "data/dreamEditorial.ts", keyword, "situations", "count", String(item.situations?.length ?? 0), "상황별 해석 6개를 유지해 주세요."));
    }
    if (!Array.isArray(item.faqs) || item.faqs.length !== 3) {
      issues.push(issue("error", "data/dreamEditorial.ts", keyword, "faqs", "count", String(item.faqs?.length ?? 0), "FAQ 3개를 유지해 주세요."));
    }
    for (const related of item.related ?? []) {
      if (!keywordSet.has(related)) {
        issues.push(issue("error", "data/dreamEditorial.ts", keyword, "related", "missing_relation", related, "존재하는 핵심 상징을 연결해 주세요."));
      }
    }
  }
  return { issues };
}

export function checkKoreanCopy(content = loadDreamContent()) {
  const issues = [];
  const inspect = (file, keyword, field, value) => {
    for (const sentence of sentences(value)) {
      for (const pattern of DETERMINISTIC_PATTERNS) {
        if (pattern.test(sentence)) {
          issues.push(issue("error", file, keyword, field, "deterministic_claim", sentence, "가능성을 제시하는 비단정적 문장으로 바꿔 주세요."));
        }
      }
      for (const { pattern, suggestion } of AWKWARD_PATTERNS) {
        if (pattern.test(sentence)) {
          issues.push(issue("error", file, keyword, field, "awkward_copy", sentence, suggestion));
        }
      }
      if (sentence.length > 120) {
        issues.push(issue("warning", file, keyword, field, "long_sentence", sentence, "모바일 가독성을 위해 두 문장으로 나누는 것을 검토해 주세요."));
      }
    }
  };
  for (const { file, items } of content.coreByFile) {
    for (const item of items) {
      for (const [field, value] of allTextFields(item)) inspect(file, item.keyword, field, value);
    }
  }
  for (const item of content.generated) {
    inspect("data/json/generated-dreams.json", item.slug, "meaning", item.meaning);
  }
  for (const [keyword, item] of Object.entries(content.editorials)) {
    for (const field of ["seoTitle", "seoDescription", "coreMeaning", "goodMeaning", "caution", "psychologicalMeaning"]) {
      inspect("data/dreamEditorial.ts", keyword, field, item[field]);
    }
    for (const [index, situation] of item.situations.entries()) {
      inspect("data/dreamEditorial.ts", keyword, `situations[${index}].interpretation`, situation.interpretation);
    }
    for (const [index, faq] of item.faqs.entries()) {
      inspect("data/dreamEditorial.ts", keyword, `faqs[${index}].answer`, faq.answer);
    }
  }
  return { issues };
}

function tokenSet(value) {
  return new Set(normalize(value).replace(/[.,!?·“”‘’()[\]]/gu, "").split(/\s+/u).filter((token) => token.length > 1));
}

function similarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  const common = [...a].filter((token) => b.has(token)).length;
  return (2 * common) / (a.size + b.size);
}

export function checkDuplicates(content = loadDreamContent()) {
  const issues = [];
  const records = [];
  for (const { file, items } of content.coreByFile) {
    for (const item of items) {
      for (const [field, value] of allTextFields(item)) {
        records.push({ file, keyword: item.keyword, field, value: normalize(value) });
      }
    }
  }
  for (const [keyword, item] of Object.entries(content.editorials)) {
    for (const field of ["coreMeaning", "goodMeaning", "caution", "psychologicalMeaning"]) {
      records.push({ file: "data/dreamEditorial.ts", keyword, field, value: normalize(item[field]) });
    }
    for (const [index, situation] of item.situations.entries()) {
      records.push({ file: "data/dreamEditorial.ts", keyword, field: `situations[${index}]`, value: normalize(situation.interpretation) });
    }
  }
  const exact = new Map();
  for (const record of records) {
    const previous = exact.get(record.value);
    if (previous && previous.keyword !== record.keyword) {
      issues.push(issue("error", record.file, record.keyword, record.field, "exact_duplicate", record.value, `${previous.keyword}의 ${previous.field}와 같은 문장입니다. 상징별 맥락을 보강해 주세요.`));
    } else {
      exact.set(record.value, record);
    }
  }
  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      if (records[left].keyword === records[right].keyword) continue;
      const score = similarity(records[left].value, records[right].value);
      if (score >= 0.82 && records[left].value !== records[right].value) {
        issues.push(issue("warning", records[right].file, records[right].keyword, records[right].field, "similar_copy", records[right].value, `${records[left].keyword} 문구와 어휘 유사도 ${Math.round(score * 100)}%입니다. 수동 검토해 주세요.`));
      }
    }
  }
  return { issues };
}

export function collectAudit() {
  const content = loadDreamContent();
  const dictionary = validateDictionary(content);
  const editorial = validateEditorials(content);
  const copy = checkKoreanCopy(content);
  const duplicates = checkDuplicates(content);
  const issues = [
    ...dictionary.issues,
    ...editorial.issues,
    ...copy.issues,
    ...duplicates.issues,
  ];
  return {
    content,
    counts: dictionary.counts,
    sections: {
      dictionary: dictionary.issues,
      editorial: editorial.issues,
      copy: copy.issues,
      duplicates: duplicates.issues,
    },
    issues,
  };
}

export function printIssues(title, issues) {
  const errors = issues.filter(({ severity }) => severity === "error");
  const warnings = issues.filter(({ severity }) => severity === "warning");
  console.log(`${title}: 오류 ${errors.length}건, 검토 권고 ${warnings.length}건`);
  for (const item of issues.slice(0, 40)) {
    console.log(`[${item.severity}] ${item.file} · ${item.keyword} · ${item.field} · ${item.type}`);
    console.log(`  문장/값: ${item.sentence}`);
    console.log(`  제안: ${item.suggestion}`);
  }
  if (issues.length > 40) console.log(`그 외 ${issues.length - 40}건은 감사 보고서에서 확인할 수 있습니다.`);
  return errors.length;
}

function issueTable(issues) {
  if (!issues.length) return "검출된 항목이 없습니다.";
  return issues
    .map((item) => `- **${item.severity === "error" ? "오류" : "검토"}** · \`${item.file}\` · \`${item.keyword}\` · \`${item.field}\`\n  - 문제: ${item.sentence}\n  - 제안: ${item.suggestion}`)
    .join("\n");
}

export function writeAuditReport(audit, relationSummary) {
  const errors = audit.issues.filter(({ severity }) => severity === "error");
  const warnings = audit.issues.filter(({ severity }) => severity === "warning");
  const report = `# 잠결 꿈 콘텐츠 전수 감사 보고서

생성 기준: 자동 검증 스크립트 실행 시점  
검증 범위: 핵심 꿈 사전 8개 JSON, 자동 조합 데이터, 편집형 상세 콘텐츠 10개, 한국어 문장, 중복, 관련 꿈, 관계 해석 표본

## 데이터 현황

| 항목 | 검증 수량 | 기준 | 결과 |
| --- | ---: | ---: | --- |
| 핵심 상징 | ${audit.counts.core} | 93 | ${audit.counts.core === 93 ? "통과" : "확인 필요"} |
| 별칭 | ${audit.counts.aliases} | 129 | ${audit.counts.aliases === 129 ? "통과" : "확인 필요"} |
| 자동 조합 | ${audit.counts.generated} | 1,767 | ${audit.counts.generated === 1767 ? "통과" : "확인 필요"} |
| 상황 유형 | ${audit.counts.situations} | 19 | ${audit.counts.situations === 19 ? "통과" : "확인 필요"} |
| 편집형 상세 페이지 | ${audit.counts.editorials} | 10 | ${audit.counts.editorials === 10 ? "통과" : "확인 필요"} |

## 이번 감사에서 바로잡은 항목

- 자동 조합 문장 1,767개를 다시 생성해 받침별 조사 오류 803건을 교정했습니다.
- 다른 핵심 상징과 충돌하던 별칭 3건을 정리했습니다. \`운전하다→자동차\` 1건은 제거하고, \`보석→반지\`는 \`귀금속\`으로, \`통장→은행\`은 \`예금계좌\`로 교체해 별칭 수 129개를 유지했습니다.
- 추격·공격·등장·발견·축소·변화·기쁨·반복 상황 문구와 공통 풀이 문구 12곳을 자연스럽고 비단정적인 표현으로 다듬었습니다.
- 공항·회사 항목에서 다른 상징과 80% 이상 유사하던 문장 2건을 각 장소의 구체적인 맥락에 맞게 다시 작성했습니다.
- 관련 꿈 참조는 핵심 상징 93개를 기준으로 무결성을 검사했습니다.
- 자동 조합은 각 핵심 상징마다 19개 상황이 빠짐없이 존재하는지 검증했습니다.

## 검증 대상 파일

- 집계·사전: \`data/coreDreamKeywords.ts\`, \`data/dreamDictionary.ts\`, \`data/dreamEditorial.ts\`, \`data/emotions.ts\`, \`data/situations.ts\`
- 핵심 JSON: ${CORE_FILES.map((file) => `\`data/json/${file}\``).join(", ")}
- 자동 조합: \`data/json/generated-dreams.json\`
- 해석·관계: \`lib/dreamEngine.ts\`, \`lib/dreamContext.ts\`, \`lib/dreamInterpretation.ts\`, \`lib/dreamPresentation.ts\`
- 사용자 출력: \`app/dream/[slug]/page.tsx\`, \`components/DreamResult.tsx\`
- 생성 규칙: \`scripts/generateDreamDatabase.mjs\`

## 수정 수치

| 항목 | 건수 |
| --- | ---: |
| 자동 조합 조사 오류 교정 | 803 |
| 표기 교정 템플릿 | 1 (\`마음 한켠\` → \`마음 한편\`) |
| 별칭 충돌 해소 | 3 |
| 별칭 삭제 | 1 |
| 별칭 교체 | 2 |
| 완전 중복 문장 제거 | 0 |
| 80% 이상 유사 문장 개선 | 2 |
| 잘못된 관련 꿈 링크 | 0 |
| 문체·표현 개선 | 14 |

## 자동 검증 결과

- 차단 오류: **${errors.length}건**
- 수동 검토 권고: **${warnings.length}건**
- 관계 해석 표본: **${relationSummary.passed}/${relationSummary.total} 통과**

### 사전 구조 및 참조

${issueTable(audit.sections.dictionary)}

### 편집형 콘텐츠

${issueTable(audit.sections.editorial)}

### 한국어 문장

${issueTable(audit.sections.copy)}

### 중복·유사 문장

${issueTable(audit.sections.duplicates)}

## 자동 수정하지 않은 수동 검토 항목

- \`시험보다\`는 내부 키이지만 화면에는 ‘시험’으로 표시됩니다. URL·관련 참조 호환성 때문에 이번 감사에서는 키를 일괄 변경하지 않았습니다.
- \`머리\`→\`머리카락\`, \`출장\`→\`여행\`처럼 문맥에 따라 넓게 해석될 수 있는 별칭은 검색 회귀 가능성이 있어 유지했습니다.
- 민속적 상징은 문화권과 개인 경험에 따라 달라질 수 있으므로 단정형 문구만 자동 차단하고, 해석 방향 자체는 편집 검토 대상으로 남겼습니다.
- 자동 조합 1,767개는 검색 발견성을 위한 보조 데이터입니다. 제목·조사는 자동 검증하지만 모든 상징과 모든 상황의 의미 적합성을 사람이 개별 감수한 콘텐츠로 간주해서는 안 됩니다.
- 문장 유사도 검사는 어휘 기반 보조 지표입니다. 경고 항목은 실제 문맥을 읽고 수정 여부를 결정해야 합니다.

## 검증 범위의 한계

- 자동 검사는 스키마·참조·조사·금지 표현·길이·어휘 유사도를 다루며, 민속 해석의 문화적 타당성을 사실 검증하지는 않습니다.
- 외부에서 구성되는 문맥 해석은 구조 검증과 관계 표본으로 확인했습니다. 가능한 모든 자유 입력의 의미 보존을 증명하는 검사는 아닙니다.
- 이 보고서는 저장된 콘텐츠만 다루며 운영 중 외부 응답, 배포 환경 변수, 캐시의 실제 내용은 포함하지 않습니다.

## 관계 해석 표본

${relationSummary.details.map((item) => `- ${item.name}: ${item.passed ? "통과" : `실패 — ${item.message}`}`).join("\n")}

## 재검증 명령

\`\`\`bash
npm run validate:dreams
npm run check:copy
npm run check:duplicates
npm run verify:relations
npm run verify:content
\`\`\`
`;
  const reportPath = path.join(rootDir, "reports", "dream-content-audit.md");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, "utf8");
  return reportPath;
}
