import OpenAI from "openai";
import { NextResponse } from "next/server";
import { validateDreamInput } from "../../../lib/dreamEngine";
import { DEFAULT_DREAM_MODEL, DREAM_INTERPRETATION_MODE, ENRICHMENT_MAX_OUTPUT_TOKENS, ENRICHMENT_TIMEOUT_MS } from "../../../lib/dreamConfig";
import { cacheInterpretation, getCachedInterpretation, reserveExternalAttempt, releaseExternalAttempt } from "../../../lib/externalUsageLimiter";
import { generateNarrative, DreamPipelineError, safePipelineFailure } from "../../../lib/dreamPipeline";

export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const deadline = startedAt + Math.min(ENRICHMENT_TIMEOUT_MS, 50_000);
  const json = (body: unknown, status = 200) => NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Request-Id": requestId },
  });
  const unavailable = () => json({ error: "지금은 꿈풀이를 완성하지 못했습니다. 입력한 내용은 그대로 있으니 잠시 후 다시 시도해 주세요." }, 503);
  let body: { dream?: unknown; clarificationKey?: unknown };
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_body");
    body = value;
  } catch { return json({ error: "기억나는 장면과 감정을 조금 더 자세히 적어주세요." }, 400); }
  const dream = typeof body.dream === "string" ? body.dream.trim() : "";
  const validation = validateDreamInput(dream);
  if (!validation.valid) return json({ error: validation.message }, 400);

  const cached = await getCachedInterpretation(dream);
  if (cached) return json({ interpretation: cached });
  if (!process.env.OPENAI_API_KEY || DREAM_INTERPRETATION_MODE === "dictionary-only") {
    console.warn("dream_reading_failed", { requestId, stage: "configuration", code: !process.env.OPENAI_API_KEY ? "missing_key" : "disabled_generation" });
    return unavailable();
  }
  const usage = await reserveExternalAttempt(request, dream);
  if (usage !== "allowed") {
    console.warn("dream_reading_failed", { requestId, stage: "usage", code: usage });
    if (usage === "duplicate") return json({ error: "같은 꿈의 풀이가 진행 중입니다. 잠시 후 다시 시도해 주세요." }, 409);
    if (usage === "user_limited") return json({ error: "잠시 동안 이용 가능한 횟수를 모두 사용했습니다. 시간을 두고 다시 시도해 주세요." }, 429);
    return unavailable();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
  let stage = "understanding";
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await generateNarrative(dream, body.clarificationKey === "semantic-clarification", async (generation) => {
      stage = generation.stage;
      const response = await client.responses.create({
        model: process.env.OPENAI_DREAM_MODEL || DEFAULT_DREAM_MODEL,
        instructions: generation.instructions, input: generation.input,
        text: { format: { type: "json_schema", name: `dream_${generation.stage}_v16`, strict: true, schema: generation.schema } },
        max_output_tokens: generation.stage === "understanding" ? 2200 : ENRICHMENT_MAX_OUTPUT_TOKENS,
        store: false,
      }, { signal: controller.signal, maxRetries: 0 });
      if (response.status !== "completed" || !response.output_text) throw new DreamPipelineError("output_incomplete", stage);
      try { return JSON.parse(response.output_text) as unknown; }
      catch { throw new DreamPipelineError("invalid_json", stage); }
    }, () => deadline - Date.now() > 15_000);
    if (result.status === "clarification_required") return json(result);
    await cacheInterpretation(dream, result.interpretation);
    return json({ interpretation: result.interpretation });
  } catch (error) {
    console.warn("dream_reading_failed", { requestId, ...safePipelineFailure(error, stage), elapsedMs: Date.now() - startedAt });
    return unavailable();
  } finally {
    clearTimeout(timeout);
    // 실패와 재질문도 잠금을 해제하되 비용 보호 카운터는 유지합니다.
    await releaseExternalAttempt(dream);
  }
}
