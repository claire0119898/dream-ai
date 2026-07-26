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

export function runEntityRelationChecks({ quiet = false } = {}) {
  const failures = [];
  const transfer = factsFor(caseById("ownership_transfer")).facts;
  const transferAction = transfer.actions[0];
  const transferObject = transfer.objects.find(
    ({ name }) => name === "은팔찌",
  );
  if (
    transferAction?.subject !== "친정아버지" ||
    transferAction.recipient !== "남편" ||
    transferAction.object !== "은팔찌" ||
    transferAction.purpose !== "살림에 보태기" ||
    transferObject?.owner !== "친정아버지"
  ) {
    failures.push(
      safeFailure(
        "ownership_transfer",
        "relation_mismatch",
        {
          subject: "친정아버지",
          recipient: "남편",
          object: "은팔찌",
          purpose: "살림에 보태기",
          owner: "친정아버지",
        },
        {
          subject: transferAction?.subject ?? null,
          recipient: transferAction?.recipient ?? null,
          object: transferAction?.object ?? null,
          purpose: transferAction?.purpose ?? null,
          owner: transferObject?.owner ?? null,
        },
        "actions.0",
      ),
    );
  }

  const roles = factsFor(caseById("separate_roles")).facts.actions;
  if (
    !roles.some(
      ({ subject, verb, object }) =>
        subject === "남편" && verb === "고치다" && object === "문",
    ) ||
    !roles.some(
      ({ subject, verb, object }) =>
        subject === "친정어머니" && verb === "밝히다" && object === "불",
    )
  ) {
    failures.push(
      safeFailure(
        "separate_roles",
        "relation_mismatch",
        [
          { subject: "남편", verb: "고치다", object: "문" },
          { subject: "친정어머니", verb: "밝히다", object: "불" },
        ],
        roles.map(({ subject, verb, object }) => ({
          subject,
          verb,
          object,
        })),
        "actions",
      ),
    );
  }

  const quantity = factsFor(caseById("quantity_attachment")).facts;
  const bracelet = quantity.objects.find(({ name }) => name === "팔찌");
  const beads = quantity.objects.find(({ name }) => name === "구슬");
  if (
    bracelet?.quantity !== null ||
    beads?.quantity !== "12개" ||
    beads.owner !== "팔찌" ||
    beads.state !== "12개 중 하나가 깨짐"
  ) {
    failures.push(
      safeFailure(
        "quantity_attachment",
        "quantity_mismatch",
        {
          braceletQuantity: null,
          beadQuantity: "12개",
          beadOwner: "팔찌",
          beadState: "12개 중 하나가 깨짐",
        },
        {
          braceletQuantity: bracelet?.quantity ?? null,
          beadQuantity: beads?.quantity ?? null,
          beadOwner: beads?.owner ?? null,
          beadState: beads?.state ?? null,
        },
        "objects",
      ),
    );
  }

  const omitted = factsFor(caseById("omitted_subject")).facts.actions[0];
  if (omitted?.subject !== null) {
    failures.push(
      safeFailure(
        "omitted_subject",
        "unsupported_inference",
        null,
        omitted?.subject ?? null,
        "actions.0.subject",
      ),
    );
  }

  if (!quiet) {
    printSafeFailures(failures);
    console.log(`주체·대상·소유 검증: ${4 - failures.length}/4 통과`);
  }
  return { total: 4, passed: 4 - failures.length, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runEntityRelationChecks();
  if (result.failures.length) process.exitCode = 1;
}

