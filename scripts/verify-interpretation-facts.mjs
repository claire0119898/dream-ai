import { fileURLToPath } from "node:url";
import {
  buildInterpretationGrounding,
  validateInterpretationFacts,
} from "../lib/dreamFacts.ts";
import { createDictionaryInterpretation } from "../lib/dreamInterpretation.ts";
import {
  emptyAnalysis,
  factCases,
  factsFor,
  printSafeFailures,
  safeFailure,
} from "./dream-fact-fixtures.mjs";

function reground(value, facts) {
  const result = structuredClone(value);
  result.grounding = buildInterpretationGrounding(result, facts);
  return result;
}

export function runInterpretationFactChecks({ quiet = false } = {}) {
  const failures = [];
  const clearCases = factCases.filter(
    ({ id }) => id !== "ambiguous_transformation",
  );
  const generated = new Map();

  for (const testCase of clearCases) {
    const { context, facts } = factsFor(testCase);
    const result = createDictionaryInterpretation(
      emptyAnalysis,
      context,
      facts,
    );
    generated.set(testCase.id, { result, facts });
    const validation = validateInterpretationFacts(result, facts);
    if (!validation.ok) {
      failures.push(
        safeFailure(
          testCase.id,
          validation.issue,
          "validated interpretation",
          "rejected interpretation",
          validation.field,
        ),
      );
    }
  }

  const mutationChecks = [
    {
      id: "invented_person",
      base: "ownership_transfer",
      issue: "entity_mismatch",
      mutate(value) {
        value.coreConclusion += " 딸이 이 물건을 받았습니다.";
      },
    },
    {
      id: "reversed_relation",
      base: "ownership_transfer",
      issue: "relation_mismatch",
      mutate(value) {
        value.relationshipMeaning =
          "남편이 친정아버지에게 은팔찌를 주었습니다.";
      },
    },
    {
      id: "changed_quantity",
      base: "transformation_quantity",
      issue: "quantity_mismatch",
      mutate(value) {
        value.coreConclusion = value.coreConclusion.replace("108", "109");
      },
    },
    {
      id: "reversed_transformation",
      base: "transformation_quantity",
      issue: "transformation_mismatch",
      mutate(value) {
        value.integratedInterpretation +=
          "\n\n용이 염주알로 변한 장면입니다.";
      },
    },
    {
      id: "invented_emotion",
      base: "quantity_attachment",
      issue: "unsupported_inference",
      mutate(value) {
        value.integratedInterpretation +=
          "\n\n사용자는 이 장면에서 불안을 느꼈습니다.";
      },
    },
    {
      id: "missing_grounding",
      base: "omitted_subject",
      issue: "response_grounding_failed",
      mutate(value) {
        value.grounding = [];
      },
      preserveGrounding: true,
    },
  ];

  for (const check of mutationChecks) {
    const source = generated.get(check.base);
    const changed = structuredClone(source.result);
    check.mutate(changed);
    const candidate = check.preserveGrounding
      ? changed
      : reground(changed, source.facts);
    const validation = validateInterpretationFacts(candidate, source.facts);
    if (validation.ok || validation.issue !== check.issue) {
      failures.push(
        safeFailure(
          check.id,
          check.issue,
          `rejected with ${check.issue}`,
          validation.ok ? "accepted" : validation.issue,
          validation.ok ? "result" : validation.field,
        ),
      );
    }
  }

  const total = clearCases.length + mutationChecks.length;
  if (!quiet) {
    printSafeFailures(failures);
    console.log(`풀이 사실 정합성 검증: ${total - failures.length}/${total} 통과`);
  }
  return { total, passed: total - failures.length, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runInterpretationFactChecks();
  if (result.failures.length) process.exitCode = 1;
}

