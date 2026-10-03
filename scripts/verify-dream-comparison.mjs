import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { DREAM_VARIANTS, runDreamVariant, FINAL_READING_INSTRUCTIONS, singleReadingSchema } from "../lib/dreamPipelineVariants.ts";
import { calculateCost, MODEL_PRICING } from "./config/model-pricing.mjs";
import { cases } from "./dream-comparison-cases.mjs";
import { round2Cases } from "./dream-comparison-round2-cases.mjs";
import { blindOrder, renderDraftForReview, renderEvaluationSheet, renderReport, renderRound2Report, summarizeCall, summarizeRun } from "./dream-comparison-report.mjs";
import { DEFAULT_DREAM_ANALYSIS_MODEL, DEFAULT_DREAM_MODEL, DREAM_PIPELINE, MAX_DREAM_LENGTH, MIN_DREAM_LENGTH, resolveDreamPipeline } from "../lib/dreamConfig.ts";
import { DreamPipelineError } from "../lib/dreamPipeline.ts";
import { dungeonDream, dungeonUnderstanding, dungeonReading } from "./narrative-fixtures.mjs";

assert(cases.length >= 10);
assert.equal(new Set(cases.map((item) => item.id)).size, cases.length);
assert(cases.every((item) => item.dream.length >= 20 && item.dream.length <= 1500));
assert.equal(round2Cases.length, 20);
assert.equal(new Set(round2Cases.map((item) => item.id)).size, 20);
assert(round2Cases.every((item) => item.dream.trim().length >= MIN_DREAM_LENGTH && item.dream.length <= MAX_DREAM_LENGTH), "2차 합성 꿈은 입력 길이 한도 안에 있다");
assert.deepEqual(DREAM_VARIANTS, ["baseline-3step", "mixed-model-3step", "two-step", "single-step"]);
assert.equal(DEFAULT_DREAM_ANALYSIS_MODEL, "gpt-4.1-mini");
assert.equal(DEFAULT_DREAM_MODEL, "gpt-4.1");
assert.equal(resolveDreamPipeline(undefined), "two-step");
assert.equal(resolveDreamPipeline("baseline-3step"), "baseline-3step", "기존 경로로 롤백할 수 있다");
assert.equal(DREAM_PIPELINE, resolveDreamPipeline(process.env.DREAM_PIPELINE));

const expected = {
  "baseline-3step": [["understanding", "gpt-4.1"], ["reading", "gpt-4.1"], ["revision", "gpt-4.1"]],
  "mixed-model-3step": [["understanding", "gpt-4.1-mini"], ["reading", "gpt-4.1"], ["revision", "gpt-4.1-mini"]],
  "two-step": [["understanding", "gpt-4.1-mini"], ["final-reading", "gpt-4.1"]],
  "single-step": [["single-reading", "gpt-4.1"]],
};
for (const variant of DREAM_VARIANTS) {
  const calls = [];
  const result = await runDreamVariant(variant, dungeonDream, false, async (generation) => {
    calls.push(generation);
    return generation.stage === "understanding" ? dungeonUnderstanding
      : generation.stage === "single-reading" ? { needsClarification: false, clarificationQuestion: null, sceneCount: 4, narrative: dungeonReading }
      : dungeonReading;
  });
  assert.equal(result.status, "complete");
  assert.deepEqual(calls.map(({ stage, model }) => [stage, model]), expected[variant]);
  assert.equal(result.interpretation.narrative.version, "v16");
  assert(calls.every((call) => call.maxOutputTokens > 0));
  if (variant === "two-step") assert.match(calls[1].instructions, /원문과 각 문장을 내부적으로 대조하세요/u);
  if (variant === "single-step") assert.equal(calls[0].schema, singleReadingSchema);
}
const noRevision = [];
await runDreamVariant("baseline-3step", dungeonDream, false, async (generation) => {
  noRevision.push(generation.stage);
  return generation.stage === "understanding" ? dungeonUnderstanding : dungeonReading;
}, () => false);
assert.deepEqual(noRevision, ["understanding", "reading"]);
for (const variant of DREAM_VARIANTS) {
  const calls = [];
  const clarification = await runDreamVariant(variant, dungeonDream, false, async (generation) => {
    calls.push(generation.stage);
    return generation.stage === "understanding"
      ? { ...dungeonUnderstanding, needsClarification: true, clarificationQuestion: "누가 상자를 받았나요?" }
      : { needsClarification: true, clarificationQuestion: "누가 상자를 받았나요?", sceneCount: 1, narrative: null };
  });
  assert.equal(clarification.status, "clarification_required");
  assert.equal(calls.length, 1);
}
assert.match(FINAL_READING_INSTRUCTIONS, /없는 사건·감정/u);
const usage = { input_tokens: 1000, output_tokens: 500, total_tokens: 1500, input_tokens_details: { cached_tokens: 200 } };
assert.equal(MODEL_PRICING["gpt-4.1"].output, 8);
assert.equal(calculateCost("gpt-4.1", usage).totalCost, 0.0057);
assert.equal(calculateCost("gpt-4.1-mini", usage).totalCost, 0.00114);
assert.equal(calculateCost("gpt-4.1", null), null);
assert.throws(() => calculateCost("unpriced-model", usage), /가격이 등록되지 않은 모델/u);
const call = summarizeCall("gpt-4.1", "reading", usage, 123);
const run = summarizeRun("baseline-3step", "case-01", "test-request", "complete", [call], 200);
assert.equal(run.callCount, 1);
assert.equal(run.cachedInputTokens, 200);
assert.equal(run.totalCost, 0.0057);
assert.equal(summarizeRun("baseline-3step", "case-01", "test-request", "failed", [{ ...call, totalCost: null }], 200).totalCost, null);
assert.deepEqual(blindOrder("case-01", [...DREAM_VARIANTS]), blindOrder("case-01", [...DREAM_VARIANTS]));
assert.notDeepEqual(blindOrder("case-01", [...DREAM_VARIANTS]), blindOrder("case-02", [...DREAM_VARIANTS]));
assert.match(renderReport([{ id: "case-01" }], [...DREAM_VARIANTS], [run]), /평균 비용/u);
const round2Report = renderRound2Report([{ id: "round2-01" }], ["two-step", "single-step"], [
  { ...run, variant: "two-step", testCaseId: "round2-01", durationMs: 200 },
  { ...run, variant: "single-step", testCaseId: "round2-01", durationMs: 120, status: "failed", validationIssues: ["source_evidence"] },
]);
assert.match(round2Report, /평균 latency/u);
assert.match(round2Report, /source_evidence/u);
const evaluation = renderEvaluationSheet(round2Cases[0], ["two-step", "single-step"]);
assert.match(evaluation, /다시 사용하고 싶은 정도 \(가장 중요\)/u);
assert(!evaluation.includes("two-step") && !evaluation.includes("single-step"), "사람 평가표에 정답을 노출하지 않는다");
assert.match(renderDraftForReview({ narrative: dungeonReading }), /바쁜 와중에도 내 목소리를 지키고 싶은 마음/u);
await assert.rejects(runDreamVariant("single-step", dungeonDream, false, async () => ({ needsClarification: false, clarificationQuestion: null, sceneCount: 1, narrative: {} })), (error) => error instanceof DreamPipelineError && error.code === "single_rejected" && error.issues.includes("structure"));
assert.throws(() => execFileSync(process.execPath, ["--no-warnings", "--experimental-strip-types", "scripts/compare-dream-pipelines.mjs"], { stdio: "ignore" }), (error) => error.status === 2);
assert.throws(() => execFileSync(process.execPath, ["--no-warnings", "--experimental-strip-types", "scripts/compare-dream-pipelines.mjs", "--round2"], { stdio: "ignore" }), (error) => error.status === 2);
console.log("꿈 파이프라인 4종·호출 수·모델·가격·블라인드·live 실행 가드 검증 통과 (외부 호출 없음)");
