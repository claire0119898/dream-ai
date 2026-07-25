import {
  collectAudit,
  printIssues,
  writeAuditReport,
} from "./dream-content-audit-lib.mjs";
import { runRelationChecks } from "./verify-dream-relations.mjs";

const audit = collectAudit();
const relations = runRelationChecks({ quiet: true });
const reportPath = writeAuditReport(audit, relations);
const errors = printIssues("꿈 콘텐츠 통합 검증", audit.issues);
console.log(`관계·대상 표본 검증: ${relations.passed}/${relations.total} 통과`);
console.log(`감사 보고서: ${reportPath}`);
if (errors || relations.passed !== relations.total) process.exitCode = 1;
