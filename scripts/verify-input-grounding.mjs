import { fileURLToPath } from "node:url";
import { validateExtractedFacts } from "../lib/dreamFacts.ts";
import {
  factCases,
  factsFor,
  printSafeFailures,
  safeFailure,
} from "./dream-fact-fixtures.mjs";

export function runGroundingChecks({ quiet = false } = {}) {
  const failures = [];
  for (const testCase of factCases) {
    const { facts } = factsFor(testCase);
    const validation = validateExtractedFacts(testCase.input, facts);
    if (!validation.ok) {
      failures.push(
        safeFailure(
          testCase.id,
          validation.issue,
          "all evidence must be a substring of the normalized input",
          "fact validation failed",
          validation.field,
        ),
      );
    }
  }

  const byId = Object.fromEntries(
    factCases.map((testCase) => [
      testCase.id,
      factsFor(testCase).facts,
    ]),
  );
  const expectations = [
    [
      "transformation_quantity",
      byId.transformation_quantity.objects[0]?.quantity === "108개",
      "objects[0].quantity=108개",
      byId.transformation_quantity.objects[0]?.quantity ?? null,
      "objects.0.quantity",
    ],
    [
      "ownership_transfer",
      byId.ownership_transfer.objects[0]?.owner === "친정아버지",
      "objects[0].owner=친정아버지",
      byId.ownership_transfer.objects[0]?.owner ?? null,
      "objects.0.owner",
    ],
    [
      "negated_emotion",
      byId.negated_emotion.emotions.some(
        ({ emotion }) => emotion === "불안하지 않음",
      ),
      "explicit emotion=불안하지 않음",
      byId.negated_emotion.emotions.map(({ emotion }) => emotion),
      "emotions",
    ],
    [
      "ambiguous_transformation",
      byId.ambiguous_transformation.ambiguityLevel === "high" &&
        Boolean(byId.ambiguous_transformation.clarification),
      "ambiguityLevel=high and clarification present",
      {
        ambiguityLevel: byId.ambiguous_transformation.ambiguityLevel,
        clarification: Boolean(
          byId.ambiguous_transformation.clarification,
        ),
      },
      "ambiguityLevel",
    ],
    [
      "omitted_subject",
      byId.omitted_subject.actions[0]?.subject === null,
      "actions[0].subject=null",
      byId.omitted_subject.actions[0]?.subject ?? null,
      "actions.0.subject",
    ],
    [
      "exam_release_ending",
      byId.exam_release_ending.actions.some(
        ({ subject, verb }) => subject === "햇빛" && verb === "비치다",
      ) &&
        byId.exam_release_ending.emotions.some(
          ({ emotion }) => emotion === "불안하지 않음",
        ) &&
        byId.exam_release_ending.emotions.some(
          ({ emotion }) => emotion === "홀가분함",
        ),
      "ending action=햇빛이 비치다 and both explicit emotions preserved",
      {
        actions: byId.exam_release_ending.actions.map(
          ({ subject, verb }) => ({ subject, verb }),
        ),
        emotions: byId.exam_release_ending.emotions.map(
          ({ emotion }) => emotion,
        ),
      },
      "ending",
    ],
  ];
  for (const [caseId, passed, expected, actual, field] of expectations) {
    if (!passed) {
      failures.push(
        safeFailure(caseId, "grounding_mismatch", expected, actual, field),
      );
    }
  }

  if (!quiet) {
    printSafeFailures(failures);
    console.log(
      `원문 근거 검증: ${factCases.length - failures.length}/${factCases.length} 통과`,
    );
  }
  return {
    total: factCases.length,
    passed: failures.length === 0 ? factCases.length : factCases.length - failures.length,
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runGroundingChecks();
  if (result.failures.length) process.exitCode = 1;
}
