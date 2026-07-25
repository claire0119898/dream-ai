import {
  checkDuplicates,
  loadDreamContent,
  printIssues,
} from "./dream-content-audit-lib.mjs";

const issues = checkDuplicates(loadDreamContent()).issues;
const errors = printIssues("꿈 문구 중복·유사도 검증", issues);
if (errors) process.exitCode = 1;
