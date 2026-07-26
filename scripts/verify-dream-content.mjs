import {
  collectAudit,
  printIssues,
  writeAuditReport,
} from "./dream-content-audit-lib.mjs";
import { runRelationChecks } from "./verify-dream-relations.mjs";
import { runGroundingChecks } from "./verify-input-grounding.mjs";
import { runEntityRelationChecks } from "./verify-entity-relations.mjs";
import { runTransformationChecks } from "./verify-transformations.mjs";
import { runInterpretationFactChecks } from "./verify-interpretation-facts.mjs";

const audit = collectAudit();
const relations = runRelationChecks({ quiet: true });
const grounding = runGroundingChecks({ quiet: true });
const entityRelations = runEntityRelationChecks({ quiet: true });
const transformations = runTransformationChecks({ quiet: true });
const interpretationFacts = runInterpretationFactChecks({ quiet: true });
const reportPath = writeAuditReport(audit, relations);
const errors = printIssues("꿈 콘텐츠 통합 검증", audit.issues);
console.log(`관계·대상 표본 검증: ${relations.passed}/${relations.total} 통과`);
console.log(`원문 근거 검증: ${grounding.passed}/${grounding.total} 통과`);
console.log(
  `주체·대상·소유 검증: ${entityRelations.passed}/${entityRelations.total} 통과`,
);
console.log(
  `변신 관계 검증: ${transformations.passed}/${transformations.total} 통과`,
);
console.log(
  `풀이 사실 정합성 검증: ${interpretationFacts.passed}/${interpretationFacts.total} 통과`,
);
console.log(`감사 보고서: ${reportPath}`);
if (
  errors ||
  relations.passed !== relations.total ||
  grounding.failures.length ||
  entityRelations.failures.length ||
  transformations.failures.length ||
  interpretationFacts.failures.length
) {
  process.exitCode = 1;
}
