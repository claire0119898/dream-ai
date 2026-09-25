// 실제 키 없이 로컬 모의 제공자와 프로덕션 Next 서버를 연결하는 HTTP 회귀 검사.
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dungeonDream, dungeonUnderstanding, dungeonReading } from "./narrative-fixtures.mjs";

let mode = "unauthorized";
let providerCalls = 0;
const mock = http.createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  providerCalls++;
  assert.equal(request.headers.authorization, "Bearer local-test-only");
  response.setHeader("Content-Type", "application/json");
  if (mode === "unauthorized") {
    response.writeHead(401).end(JSON.stringify({ error: { message: "local mock error", type: "authentication_error" } }));
    return;
  }
  if (mode === "timeout") return;
  const stage = body.text.format.name;
  let output = stage.includes("understanding") ? dungeonUnderstanding : dungeonReading;
  if (mode === "bad-understanding") output = {};
  if (mode === "bad-reading" && !stage.includes("understanding")) output = { ...dungeonReading, endingEvidence: "입력에 없는 결말" };
  response.end(JSON.stringify({ id: "resp_local", object: "response", status: mode === "incomplete" ? "incomplete" : "completed", output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] }] }));
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
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, OPENAI_API_KEY: "local-test-only", OPENAI_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`, OPENAI_DREAM_MODEL: "local-mock", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", RATE_LIMIT_HASH_SALT: "local-test-salt", DREAM_INTERPRETATION_MODE: "ai-first", DREAM_REQUEST_TIMEOUT_MS: "1800" },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (data) => { logs += data; });
child.stderr.on("data", (data) => { logs += data; });
let serial = 0;
async function submit(dream = dungeonDream, user) {
  const response = await fetch(`${base}/api/interpret`, { method: "POST", headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": user || `192.0.2.${++serial}` }, body: JSON.stringify({ dream }) });
  assert(response.headers.get("x-request-id"));
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
  assert.equal((await submit(dungeonDream, "198.51.100.20")).status, 503, "실패 후 재시도 잠금 해제");
  assert.equal((await submit(dungeonDream, "198.51.100.20")).status, 429, "실패 시에도 비용 한도 유지");
  mode = "success";
  const success = await submit();
  assert.equal(success.status, 200);
  assert.equal(success.body.interpretation.narrative.version, "v16");
  assert.equal(success.body.interpretation.narrative.paragraphs.length, 3);
  const before = providerCalls;
  assert.deepEqual((await submit()).body, success.body);
  assert.equal(providerCalls, before, "유효한 캐시만 재사용");
  const invalid = await fetch(`${base}/api/interpret`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "null" });
  assert.equal(invalid.status, 400);
  assert(logs.includes("dream_reading_failed"));
  assert(!logs.includes(dungeonDream) && !logs.includes("local-test-only"), "원문과 키를 로그에 남기지 않는다");
  console.log("HTTP 해몽·오류·시간초과·재시도·한도·캐시 검증 통과 (외부 호출 없음)");
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
