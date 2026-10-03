// 명시적인 --live 실행에서만 OpenAI 비용이 발생합니다. 운영 API와 무관합니다.
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { DREAM_VARIANTS, runDreamVariant } from "../lib/dreamPipelineVariants.ts";
import { ENRICHMENT_TIMEOUT_MS } from "../lib/dreamConfig.ts";
import { isNarrativeInterpretation } from "../lib/dreamNarrative.ts";
import { safePipelineFailure } from "../lib/dreamPipeline.ts";
import { cases } from "./dream-comparison-cases.mjs";
import { round2Cases } from "./dream-comparison-round2-cases.mjs";
import { blindOrder, renderDraftForReview, renderEvaluationSheet, renderInterpretation, renderReport, renderRound2Report, summarizeCall, summarizeRun } from "./dream-comparison-report.mjs";

if (!process.argv.includes("--live")) {
  console.error("실제 비용이 발생합니다. 명시적으로 npm run compare:dream-pipeline:live 를 실행하세요.");
  process.exit(2);
}
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY가 없습니다. 키를 코드에 넣지 말고 환경변수로 제공하세요.");
  process.exit(2);
}
const round2 = process.argv.includes("--round2");
const variants = round2 ? ["two-step", "single-step"] : [...DREAM_VARIANTS];
const testCases = round2 ? round2Cases : cases;
const caseFlag = process.argv.indexOf("--case");
const selectedCases = caseFlag === -1 ? testCases : testCases.filter((testCase) => testCase.id === process.argv[caseFlag + 1]);
if (!selectedCases.length) throw new Error("unknown_case_id");
const outputDir = path.resolve(round2 ? "artifacts/dream-pipeline-comparison-round2" : "artifacts/dream-pipeline-comparison");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const runs = [];
const answerKey = ["# 블라인드 비교 정답표", "", "이 파일을 보기 전에 각 case의 blind.md를 평가하세요.", ""];

for (const [caseIndex, testCase] of selectedCases.entries()) {
  const caseDir = path.join(outputDir, testCase.id);
  await mkdir(caseDir, { recursive: true });
  await writeFile(path.join(caseDir, "input-summary.txt"), `합성 꿈 ID: ${testCase.id}\n유형: ${testCase.type}\n\n${testCase.dream}\n`);
  const visibleResults = new Map();
  for (const variant of variants) {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const deadline = startedAt + Math.min(ENRICHMENT_TIMEOUT_MS, 50_000);
    const calls = [];
    const rawOutputs = [];
    let stage = "understanding";
    let status = "failed";
    let errorCode = null;
    let validationIssues = [];
    let resultText = "생성 실패. metrics.json의 errorCode를 확인하세요.\n";
    try {
      const result = await runDreamVariant(variant, testCase.dream, false, async (generation) => {
        stage = generation.stage;
        const callNumber = calls.length + 1;
        const callStartedAt = Date.now();
        console.log(JSON.stringify({ event: "call_start", variant, testCaseId: testCase.id, requestId, callNumber, stage, model: generation.model }));
        // 실패한 API 요청도 호출 횟수에 포함합니다. usage가 없으면 비용은 측정 불가로 둡니다.
        const record = { stage, model: generation.model, durationMs: 0, inputTokens: null, outputTokens: null, cachedInputTokens: null, totalTokens: null, inputCost: null, outputCost: null, totalCost: null };
        calls.push(record);
        try {
          const response = await client.responses.create({
            model: generation.model, instructions: generation.instructions, input: generation.input,
            text: { format: { type: "json_schema", name: `dream_experiment_${generation.stage}_v16`, strict: true, schema: generation.schema } },
            max_output_tokens: generation.maxOutputTokens, store: false,
          }, { signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())), maxRetries: 0 });
          Object.assign(record, summarizeCall(generation.model, generation.stage, response.usage, Date.now() - callStartedAt));
          console.log(JSON.stringify({ event: "call_complete", variant, testCaseId: testCase.id, requestId, callNumber, ...record }));
          if (response.status !== "completed" || !response.output_text) throw new Error("output_incomplete");
          try {
            const parsed = JSON.parse(response.output_text);
            rawOutputs.push({ stage, model: generation.model, payload: parsed });
            return parsed;
          }
          catch { throw new Error("invalid_json"); }
        } catch (error) {
          record.durationMs = Date.now() - callStartedAt;
          console.warn(JSON.stringify({ event: "call_failed", variant, testCaseId: testCase.id, requestId, callNumber, stage, code: safePipelineFailure(error, stage).code }));
          throw error;
        }
      }, () => deadline - Date.now() > 15_000);
      status = result.status;
      resultText = renderInterpretation(result);
      if (result.status === "complete" && !isNarrativeInterpretation(result.interpretation)) throw new Error("invalid_visible_result");
    } catch (error) {
      status = "failed";
      const failure = safePipelineFailure(error, stage);
      errorCode = failure.code;
      validationIssues = failure.issues ?? [];
      if (round2) {
        if (rawOutputs.length) resultText = renderDraftForReview(rawOutputs.at(-1).payload);
        await writeFile(path.join(caseDir, `${variant}-diagnostics.json`), JSON.stringify({
          testCaseId: testCase.id, variant, requestId, failure,
          rawOutputs,
          note: "합성 꿈의 원본 응답입니다. 자동 검증을 완화하기 전에 사람이 실패 근거를 확인하세요.",
        }, null, 2));
      }
    }
    const run = summarizeRun(variant, testCase.id, requestId, status, calls, Date.now() - startedAt, errorCode);
    if (round2) run.validationIssues = validationIssues;
    runs.push(run);
    visibleResults.set(variant, resultText);
    await writeFile(path.join(caseDir, `${variant}.txt`), resultText);
    console.log(JSON.stringify({ event: "run_complete", variant, testCaseId: testCase.id, requestId, status, callCount: run.callCount, totalCost: run.totalCost, errorCode }));
  }
  const order = blindOrder(testCase.id, variants);
  const labels = ["A", "B", "C", "D"];
  const blind = [`# ${testCase.id} 블라인드 결과`, "", `유형: ${testCase.type}`, ""];
  for (const [index, variant] of order.entries()) {
    blind.push(`## Result ${labels[index]}`, "", visibleResults.get(variant).trim(), "");
    answerKey.push(`${testCase.id} Result ${labels[index]} → ${variant}`);
  }
  answerKey.push("");
  await writeFile(path.join(caseDir, "blind.md"), blind.join("\n"));
  if (round2) await writeFile(path.join(caseDir, "evaluation.md"), renderEvaluationSheet(testCase, order));
  console.log(JSON.stringify({ event: "case_complete", testCaseId: testCase.id, completed: caseIndex + 1, total: selectedCases.length }));
}
await writeFile(path.join(outputDir, "metrics.json"), JSON.stringify({ generatedAt: new Date().toISOString(), cases: selectedCases.map(({ id, type }) => ({ id, type })), runs }, null, 2));
await writeFile(path.join(outputDir, "report.md"), round2 ? renderRound2Report(selectedCases, variants, runs) : renderReport(selectedCases, variants, runs));
await writeFile(path.join(outputDir, "answer-key.md"), answerKey.join("\n"));
console.log(JSON.stringify({ event: "comparison_complete", cases: selectedCases.length, runs: runs.length, outputDir }));
