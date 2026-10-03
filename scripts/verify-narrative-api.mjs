// 실제 키 없이 로컬 모의 제공자와 프로덕션 Next 서버를 연결하는 HTTP 회귀 검사.
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dungeonDream, dungeonUnderstanding, dungeonReading } from "./narrative-fixtures.mjs";

let mode = "unauthorized";
let providerCalls = 0;
const providerRequests = [];
const mock = http.createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  providerCalls++;
  providerRequests.push({ model: body.model, stage: body.text.format.name });
  assert.equal(request.headers.authorization, "Bearer local-test-only");
  response.setHeader("Content-Type", "application/json");
  if (mode === "unauthorized") {
    response.writeHead(401).end(JSON.stringify({ error: { message: "local mock error", type: "authentication_error" } }));
    return;
  }
  if (mode === "timeout") return;
  const stage = body.text.format.name;
  let output = stage.includes("understanding") ? dungeonUnderstanding : dungeonReading;
  if (mode === "clarification" && stage.includes("understanding")) output = { ...dungeonUnderstanding, needsClarification: true, clarificationQuestion: "마지막에 무엇을 막으려 했나요?" };
  if (mode === "bad-understanding") output = {};
  if (mode === "bad-reading" && !stage.includes("understanding")) output = { ...dungeonReading, endingEvidence: "입력에 없는 결말" };
  response.end(JSON.stringify({ id: "resp_local", object: "response", status: mode === "incomplete" ? "incomplete" : "completed", usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }, output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] }] }));
});
mock.listen(0, "127.0.0.1");
await once(mock, "listening");
const reserve = http.createServer();
reserve.listen(0, "127.0.0.1");
await once(reserve, "listening");
const port = reserve.address().port;
await new Promise((resolve) => reserve.close(resolve));
const base = `http://127.0.0.1:${port}`;
let logs = "";
const requestIds = [];
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, OPENAI_API_KEY: "local-test-only", OPENAI_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`, DREAM_PIPELINE: "two-step", OPENAI_DREAM_ANALYSIS_MODEL: "local-analysis", OPENAI_DREAM_MODEL: "local-final", DREAM_INTERPRETATION_MODE: "ai-first", DREAM_REQUEST_TIMEOUT_MS: "1800" },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (data) => { logs += data; });
child.stderr.on("data", (data) => { logs += data; });
let serial = 0;
async function submit(dream = dungeonDream, user, clarificationKey) {
  const response = await fetch(`${base}/api/interpret`, { method: "POST", headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": user || `192.0.2.${++serial}` }, body: JSON.stringify({ dream, clarificationKey }) });
  const requestId = response.headers.get("x-request-id");
  assert(requestId);
  requestIds.push(requestId);
  assert.equal(response.headers.get("cache-control"), "no-store");
  return { status: response.status, body: await response.json() };
}
try {
  const started = Date.now();
  while (true) {
    if (child.exitCode !== null) throw new Error("Next test server exited");
    try { if ((await fetch(base)).ok) break; } catch {}
    if (Date.now() - started > 20_000) throw new Error("Next startup timeout");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  for (const failure of ["unauthorized", "incomplete", "bad-understanding", "bad-reading", "timeout"]) {
    mode = failure;
    const result = await submit();
    assert.equal(result.status, 503, failure);
    assert.equal(result.body.interpretation, undefined, "오류를 정상 해몽으로 위장하지 않는다");
    assert.equal(typeof result.body.error, "string");
  }
  mode = "unauthorized";
  assert.equal((await submit(dungeonDream, "198.51.100.20")).status, 503);
  assert.equal((await submit(dungeonDream, "198.51.100.20")).status, 503, "같은 입력도 재시도할 수 있다");
  mode = "success";
  const beforeSuccess = providerCalls;
  const repeatUser = "198.51.100.21";
  const success = await submit(dungeonDream, repeatUser);
  assert.equal(success.status, 200);
  assert.equal(success.body.interpretation.narrative.version, "v16");
  assert.equal(success.body.interpretation.narrative.paragraphs.length, 3);
  assert.equal(providerCalls - beforeSuccess, 2, "정상적인 two-step 해설은 두 번만 호출한다");
  assert.deepEqual(providerRequests.slice(-2).map(({ model, stage }) => [model, stage]), [["local-analysis", "dream_understanding_v16"], ["local-final", "dream_final-reading_v16"]]);
  assert.deepEqual(await submit(dungeonDream, repeatUser), success);
  assert.deepEqual(await submit(dungeonDream, repeatUser), success);
  assert.equal(providerCalls - beforeSuccess, 6, "같은 사용자의 반복 요청도 저장소나 횟수 제한 없이 다시 생성한다");
  for (const requestId of requestIds.slice(-3)) {
    assert.equal(logs.match(new RegExp(`dream_openai_call_start \\{\\n  requestId: '${requestId}'`, "gu"))?.length, 2);
    assert.equal(logs.match(new RegExp(`dream_openai_call_complete \\{\\n  requestId: '${requestId}'`, "gu"))?.length, 2);
    assert.match(logs, new RegExp(`dream_interpret_complete \\{\\n  requestId: '${requestId}'`, "u"));
  }
  assert.match(logs, /dream_openai_call_complete[\s\S]*inputTokens: 100[\s\S]*outputTokens: 50[\s\S]*totalTokens: 150/u);
  assert.match(logs, /dream_interpret_complete[\s\S]*openaiCalls: 2[\s\S]*inputTokens: 200[\s\S]*outputTokens: 100[\s\S]*totalTokens: 300/u);
  mode = "clarification";
  const beforeClarification = providerCalls;
  const clarification = await submit();
  assert.equal(clarification.status, 200);
  assert.equal(clarification.body.status, "clarification_required");
  assert.equal(providerCalls - beforeClarification, 1, "확인 질문은 분석 단계만 호출한다");
  const confirmed = await submit(dungeonDream, undefined, "semantic-clarification");
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.interpretation.narrative.version, "v16");
  assert.equal(providerCalls - beforeClarification, 3, "확인 후 요청은 분석과 최종 해설을 호출한다");
  mode = "bad-understanding";
  const beforeInputCases = providerCalls;
  assert.equal((await submit("하얀 방에서 문을 열고 나왔어요. 그때 기분은 평온했어요.")).status, 503);
  assert.equal((await submit("길을 따라 걸었어요. ".repeat(55))).status, 503);
  assert.equal(providerCalls - beforeInputCases, 2, "짧고 긴 유효 입력은 제공자 단계까지 도달한다");
  const beforeDeathDreams = providerCalls;
  assert.equal((await submit("꿈에서 제가 죽었습니다. 현실의 제 안전과는 무관한 꿈 장면이었어요. 무슨 뜻인가요?")).status, 503);
  assert.equal((await submit("돌아가신 가족이 꿈에 나와서 저에게 식사를 차려 주었습니다. 반가웠어요.")).status, 503);
  assert.equal(providerCalls - beforeDeathDreams, 2, "꿈속 죽음이나 돌아가신 가족은 입력 단계에서 차단되지 않는다. 모의 제공자의 다른 꿈 근거 때문에 후속 검증에서 실패한다");
  const beforeInvalid = providerCalls;
  assert.equal((await submit("")).status, 400, "빈 입력 차단");
  assert.equal((await submit("꿈".repeat(751))).status, 400, "1,500자 초과 입력 차단");
  assert.equal(providerCalls, beforeInvalid, "잘못된 입력은 OpenAI를 호출하지 않는다");
  const invalid = await fetch(`${base}/api/interpret`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "null" });
  assert.equal(invalid.status, 400);
  assert(logs.includes("dream_reading_failed"));
  assert(!logs.includes(dungeonDream) && !logs.includes("local-test-only"), "원문과 키를 로그에 남기지 않는다");
  console.log("HTTP 해몽·오류·시간초과·재시도·저장소 없는 재생성 검증 통과 (외부 호출 없음)");
  if (process.argv.includes("--preview")) {
    console.log(`Local fixture preview: ${base} (Ctrl+C to stop)`);
    await once(process, "SIGINT");
  }
} finally {
  child.kill("SIGTERM");
  if (child.exitCode === null) await once(child, "exit");
  mock.closeAllConnections();
  await new Promise((resolve) => mock.close(resolve));
}
