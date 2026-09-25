// 명시적으로 실행할 때만 외부 요청과 비용이 발생합니다. --review에서만 원문/결과를 출력합니다.
import assert from "node:assert/strict";
import OpenAI from "openai";
import { generateNarrative } from "../lib/dreamPipeline.ts";
import { dungeonDream } from "./narrative-fixtures.mjs";

export const spaDream = "작정하고 지은 실내 온천이었다. 미로 구조였고 한 방향으로 물살을 따라 둥둥 떠가게 되어있었다. 고급진 조명과 통로 옆 장식품만으로도 눈이 즐거워 갤러리에 온 건 지 물놀이를 하러 온 건지 구분이 안갔다. 그러다가 불시에 탁 트인 야외 온천으로 연결되었다. 환하고 따사로운 햇볕에 물이 은빛 보석처럼 반짝거렸다. 개방감에 아름다움에 예고 없이 야외가 펼쳐진 거에 행복에 젖어 미친듯이 발을 구르며 헤엄쳤다. 물은 맑았고 투명했다.";
const dream = process.argv.includes("--spa") ? spaDream : dungeonDream;
const client = new OpenAI();
const started = Date.now();
let lastDraft;
let lastUnderstanding;
const stages = [];
const deadline = started + 50_000;
const result = await generateNarrative(dream, false, async (generation) => {
  stages.push(generation.stage);
  const response = await client.responses.create({
    model: process.env.OPENAI_DREAM_MODEL || "gpt-4.1", store: false,
    instructions: generation.instructions, input: generation.input,
    text: { format: { type: "json_schema", name: `dream_${generation.stage}_v16`, strict: true, schema: generation.schema } },
    max_output_tokens: generation.stage === "understanding" ? 2200 : 5000,
  }, { signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())), maxRetries: 0 });
  assert.equal(response.status, "completed");
  const value = JSON.parse(response.output_text);
  if (generation.stage !== "understanding") lastDraft = value;
  else lastUnderstanding = value;
  return value;
}, () => deadline - Date.now() > 15_000).catch((error) => {
  if (process.argv.includes("--review")) console.log(JSON.stringify({ model: process.env.OPENAI_DREAM_MODEL || "gpt-4.1", stages, elapsedMs: Date.now() - started, understanding: lastUnderstanding, draft: lastDraft }, null, 2));
  throw error;
});
assert.equal(result.status, "complete");
const reading = result.interpretation.narrative;
const visible = [reading.opening, ...reading.paragraphs.map((p) => p.text), reading.coreMessage, reading.flow.reading].join(" ");
if (!process.argv.includes("--spa")) {
  for (const pattern of [/녹음기|마이크/u, /표현|목소리|기록/u, /조력자/u, /장비방/u, /지키|막으|막다/u]) assert.match(visible, pattern);
  assert.doesNotMatch(visible, /안심하며\s*깼|(?:성공적으로|끝내)\s*(?:장비|마이크|녹음기)[를을]?\s*지켜냈/u);
} else {
  for (const pattern of [/미로|실내/u, /탐색|경험|즐거/u, /능동|주도|스스로|직접|적극/u, /행복|기쁨/u, /개방|해방|자유/u]) assert.match(visible, pattern);
}
console.log(JSON.stringify({ dream: process.argv.includes("--spa") ? "spa" : "dungeon", model: process.env.OPENAI_DREAM_MODEL || "gpt-4.1", stages, elapsedMs: Date.now() - started, title: result.interpretation.title, paragraphs: reading.paragraphs.length, characters: visible.length, result: "automated_checks_passed_manual_review_required" }));
// 검토를 요청한 실행에서만 제공된 예시의 결과를 출력합니다. 키·요청 헤더는 포함하지 않습니다.
if (process.argv.includes("--review")) console.log(JSON.stringify({ dream, understanding: lastUnderstanding, draft: lastDraft }, null, 2));
