import {
  checkKoreanCopy,
  loadDreamContent,
  printIssues,
} from "./dream-content-audit-lib.mjs";

const issues = checkKoreanCopy(loadDreamContent()).issues;
const errors = printIssues("한국어 문장 검증", issues);
if (errors) process.exitCode = 1;
