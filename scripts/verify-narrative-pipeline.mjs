import assert from "node:assert/strict";
import { generateNarrative, safePipelineFailure, DreamPipelineError } from "../lib/dreamPipeline.ts";
import { validateNarrative, toNarrativeInterpretation, isNarrativeInterpretation } from "../lib/dreamNarrative.ts";
import { MemoryExternalUsageStore, cachedInterpretation } from "../lib/externalUsageLimiter.ts";
import { dungeonDream, dungeonUnderstanding, dungeonReading } from "./narrative-fixtures.mjs";

assert.equal(validateNarrative(dungeonReading, dungeonDream, dungeonUnderstanding).ok, true);
const badHighlight = structuredClone(dungeonReading);
badHighlight.paragraphs[0].highlight = "본문에 없는 강조 구절";
const repairedHighlight = validateNarrative(badHighlight, dungeonDream);
assert.equal(repairedHighlight.ok, true);
assert.equal(repairedHighlight.value.paragraphs[0].highlight, "", "표시 오류 때문에 본문을 버리지 않는다");
const calls = [];
const result = await generateNarrative(dungeonDream, false, async (call) => {
  calls.push(call.stage);
  return call.stage === "understanding" ? dungeonUnderstanding : dungeonReading;
});
assert.deepEqual(calls, ["understanding", "reading", "revision"], "형식이 맞아도 원문 대조 편집을 수행한다");
assert.equal(result.status, "complete");
assert(result.interpretation.integratedInterpretation.length < 750, "짧은 해설도 정상 통과한다");
assert(isNarrativeInterpretation(result.interpretation));
assert(!JSON.stringify(result.interpretation).includes("endingEvidence"), "내부 대조 자료는 응답에 포함하지 않는다");

const copied = { ...dungeonReading, paragraphs: Array.from({ length: 5 }, () => ({ text: dungeonDream, highlight: "", evidence: ["던전 같은 곳"] })) };
assert.equal(validateNarrative(copied, dungeonDream).ok, false, "원문 복사·반복 거부");
assert.equal(validateNarrative({ ...dungeonReading, opening: "이 꿈은 마지막에 남은 감정이 전체 방향을 정하는 꿈입니다. 개별 상징은 시작과 마지막 사이의 변화 속에서 읽을 때 의미가 분명해집니다." }, dungeonDream).ok, false, "스크린샷의 일반론 거부");
assert.equal(validateNarrative({ ...dungeonReading, endingEvidence: "안심하고 마이크를 지켜냈다" }, dungeonDream).ok, false, "입력에 없는 결말 거부");
assert.equal(validateNarrative({ ...dungeonReading, emotionalEvidence: ["너무 무서웠다"] }, dungeonDream).ok, false, "입력에 없는 감정 근거 거부");
assert.equal(validateNarrative({ ...dungeonReading, paragraphs: [null, ...dungeonReading.paragraphs] }, dungeonDream).ok, false);
assert.equal(validateNarrative({ ...dungeonReading, opening: dungeonReading.opening + " 그 선택은 집착과 절박함을 드러냅니다." }, dungeonDream).ok, false, "단순한 욕구를 과장된 상태로 바꾸지 않는다");
assert.equal(validateNarrative({ ...dungeonReading, opening: dungeonReading.opening + " 흐림에서 투명으로 전환되는 순간입니다." }, dungeonDream).ok, false, "후반의 상태에서 반대의 과거 상태를 만들지 않는다");

const revisions = [];
await generateNarrative(dungeonDream, false, async (call) => {
  revisions.push(call.stage);
  if (call.stage === "understanding") return dungeonUnderstanding;
  if (call.stage === "reading") return copied;
  const input = JSON.parse(call.input);
  assert(input.revision.issues.length > 0 && input.revision.draft, "교정에 실제 초안과 문제 전달");
  return dungeonReading;
});
assert.deepEqual(revisions, ["understanding", "reading", "revision"]);
const deadlineCalls = [];
await assert.rejects(generateNarrative(dungeonDream, false, async (call) => {
  deadlineCalls.push(call.stage);
  return call.stage === "understanding" ? dungeonUnderstanding : copied;
}, () => false), (e) => e.code === "reading_rejected");
assert.deepEqual(deadlineCalls, ["understanding", "reading"], "남은 시간이 부족하면 교정하지 않는다");
const clarificationCalls = [];
const clarification = await generateNarrative(dungeonDream, false, async (call) => {
  clarificationCalls.push(call.stage);
  return { ...dungeonUnderstanding, needsClarification: true, clarificationQuestion: "마지막에 무엇을 막으려 했나요?" };
});
assert.equal(clarification.status, "clarification_required");
assert.deepEqual(clarificationCalls, ["understanding"]);
await assert.rejects(generateNarrative(dungeonDream, false, async (call) => call.stage === "understanding" ? dungeonUnderstanding : copied), (e) => e instanceof DreamPipelineError && e.code === "reading_rejected");
await assert.rejects(generateNarrative(dungeonDream, false, async () => { throw new Error("secret-provider-error"); }), /secret-provider-error/);
assert(!JSON.stringify(safePipelineFailure(new Error(dungeonDream), "reading")).includes(dungeonDream), "로그에 원문을 포함하지 않는다");

const store = new MemoryExternalUsageStore();
const reservation = { identityHash: "test-user", dreamHash: "test-dream" };
assert.equal(await store.reserve(reservation), "allowed");
assert.equal(await store.reserve({ ...reservation, identityHash: "other-user" }), "duplicate");
await store.release(reservation.dreamHash);
assert.equal(await store.reserve(reservation), "allowed", "실패 후 같은 꿈 재시도 가능");
await store.release(reservation.dreamHash);
assert.equal(await store.reserve(reservation), "user_limited", "실패해도 비용 한도 유지");
const interpretation = toNarrativeInterpretation(dungeonReading, 4);
await store.setCached("narrative", interpretation);
assert(cachedInterpretation(await store.getCached("narrative")));
assert.equal(cachedInterpretation({ schemaVersion: "interpretation-v14", promptVersion: "emotion-first-reading-v14", interpretation }), null);
assert.equal(cachedInterpretation({ schemaVersion: "interpretation-v15", promptVersion: "narrative-v15", interpretation }), null, "긴 문체의 이전 캐시는 재사용하지 않는다");
assert.equal(cachedInterpretation({ schemaVersion: "interpretation-v16", promptVersion: "narrative-v16", interpretation: { title: "옛 해몽", coreConclusion: "일반 문구" } }), null);
console.log("서술형 해몽·실패·교정·재시도·캐시 검증 통과");
