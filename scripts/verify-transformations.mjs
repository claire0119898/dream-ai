import { fileURLToPath } from "node:url";
import {
  factCases,
  factsFor,
  printSafeFailures,
  safeFailure,
} from "./dream-fact-fixtures.mjs";

function caseById(id) {
  return factCases.find((testCase) => testCase.id === id);
}

export function runTransformationChecks({ quiet = false } = {}) {
  const failures = [];
  const beads = factsFor(caseById("transformation_quantity")).facts;
  const beadChange = beads.transformations[0];
  if (
    beadChange?.before !== "염주알" ||
    beadChange.after !== "용" ||
    beadChange.quantityRelation !== "염주알 각각" ||
    !beads.actions.some(
      ({ subject, verb }) => subject === "용" && verb === "올라가다",
    )
  ) {
    failures.push(
      safeFailure(
        "transformation_quantity",
        "transformation_mismatch",
        {
          before: "염주알",
          after: "용",
          quantityRelation: "염주알 각각",
          finalAction: { subject: "용", verb: "올라가다" },
        },
        {
          before: beadChange?.before ?? null,
          after: beadChange?.after ?? null,
          quantityRelation: beadChange?.quantityRelation ?? null,
          actions: beads.actions.map(({ subject, verb }) => ({
            subject,
            verb,
          })),
        },
        "transformations.0",
      ),
    );
  }

  const cat = factsFor(caseById("transformation_emotion")).facts;
  const catChange = cat.transformations[0];
  if (
    catChange?.before !== "고양이" ||
    catChange.after !== "새" ||
    !cat.actions.some(
      ({ subject, verb }) => subject === "나" && verb === "열어주다",
    ) ||
    !cat.actions.some(
      ({ subject, verb }) => subject === "새" && verb === "날아가다",
    ) ||
    !cat.emotions.some(({ emotion }) => emotion === "안심")
  ) {
    failures.push(
      safeFailure(
        "transformation_emotion",
        "transformation_mismatch",
        {
          before: "고양이",
          after: "새",
          opener: "나",
          finalActor: "새",
          emotion: "안심",
        },
        {
          before: catChange?.before ?? null,
          after: catChange?.after ?? null,
          actions: cat.actions.map(({ subject, verb }) => ({
            subject,
            verb,
          })),
          emotions: cat.emotions.map(({ emotion }) => emotion),
        },
        "transformations.0",
      ),
    );
  }

  const ambiguous = factsFor(
    caseById("ambiguous_transformation"),
  ).facts;
  if (
    ambiguous.transformations.length ||
    ambiguous.actions.length ||
    ambiguous.ambiguityLevel !== "high"
  ) {
    failures.push(
      safeFailure(
        "ambiguous_transformation",
        "parse_ambiguous",
        {
          transformations: 0,
          actions: 0,
          ambiguityLevel: "high",
        },
        {
          transformations: ambiguous.transformations.length,
          actions: ambiguous.actions.length,
          ambiguityLevel: ambiguous.ambiguityLevel,
        },
        "ambiguityLevel",
      ),
    );
  }

  const confirmed = factsFor(
    caseById("ambiguous_transformation"),
    "beads_to_dragon",
  ).facts;
  if (
    confirmed.ambiguityLevel !== "low" ||
    confirmed.transformations[0]?.before !== "염주알" ||
    confirmed.transformations[0]?.after !== "용" ||
    !confirmed.actions.some(
      ({ subject, verb, object }) =>
        subject === "용" && verb === "올라가다" && object === null,
    )
  ) {
    failures.push(
      safeFailure(
        "ambiguous_transformation_confirmed",
        "transformation_mismatch",
        {
          ambiguityLevel: "low",
          before: "염주알",
          after: "용",
          finalAction: { subject: "용", verb: "올라가다", object: null },
        },
        {
          ambiguityLevel: confirmed.ambiguityLevel,
          transformation: confirmed.transformations[0] ?? null,
          actions: confirmed.actions.map(({ subject, verb, object }) => ({
            subject,
            verb,
            object,
          })),
        },
        "transformations.0",
      ),
    );
  }

  if (!quiet) {
    printSafeFailures(failures);
    console.log(`변신 관계 검증: ${4 - failures.length}/4 통과`);
  }
  return { total: 4, passed: 4 - failures.length, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runTransformationChecks();
  if (result.failures.length) process.exitCode = 1;
}
