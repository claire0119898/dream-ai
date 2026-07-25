import {
  loadDreamContent,
  printIssues,
  validateDictionary,
  validateEditorials,
} from "./dream-content-audit-lib.mjs";

const content = loadDreamContent();
const dictionary = validateDictionary(content);
const editorial = validateEditorials(content);
const issues = [...dictionary.issues, ...editorial.issues];
const errors = printIssues("꿈 사전 구조·참조 검증", issues);
console.log(`핵심 ${dictionary.counts.core} · 별칭 ${dictionary.counts.aliases} · 자동 조합 ${dictionary.counts.generated} · 편집형 ${dictionary.counts.editorials}`);
if (errors) process.exitCode = 1;
