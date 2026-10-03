import OpenAI from "openai";
import { NextResponse } from "next/server";
import { validateDreamInput } from "../../../lib/dreamEngine";
import { DEFAULT_DREAM_ANALYSIS_MODEL, DEFAULT_DREAM_MODEL, DREAM_INTERPRETATION_MODE, DREAM_PIPELINE, ENRICHMENT_MAX_OUTPUT_TOKENS, ENRICHMENT_TIMEOUT_MS } from "../../../lib/dreamConfig";
import { generateNarrative, generateTwoStepNarrative, DreamPipelineError, safePipelineFailure } from "../../../lib/dreamPipeline";

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

  if (!process.env.OPENAI_API_KEY || DREAM_INTERPRETATION_MODE === "dictionary-only") {
    console.warn("dream_reading_failed", { requestId, stage: "configuration", code: !process.env.OPENAI_API_KEY ? "missing_key" : "disabled_generation" });
    return unavailable();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
  let stage = "understanding";
  let openaiCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const runPipeline = DREAM_PIPELINE === "baseline-3step" ? generateNarrative : generateTwoStepNarrative;
    const result = await runPipeline(dream, body.clarificationKey === "semantic-clarification", async (generation) => {
      stage = generation.stage;
      const callNumber = ++openaiCalls;
      const model = DREAM_PIPELINE === "two-step" && stage === "understanding"
        ? process.env.OPENAI_DREAM_ANALYSIS_MODEL || DEFAULT_DREAM_ANALYSIS_MODEL
        : process.env.OPENAI_DREAM_MODEL || DEFAULT_DREAM_MODEL;
      const callStartedAt = Date.now();
      console.info("dream_openai_call_start", { requestId, pipeline: DREAM_PIPELINE, callNumber, stage, model });
      const response = await client.responses.create({
        model,
        instructions: generation.instructions, input: generation.input,
        text: { format: { type: "json_schema", name: `dream_${generation.stage}_v16`, strict: true, schema: generation.schema } },
        max_output_tokens: generation.stage === "understanding" ? 2200 : ENRICHMENT_MAX_OUTPUT_TOKENS,
        store: false,
      }, { signal: controller.signal, maxRetries: 0 });
      inputTokens += response.usage?.input_tokens ?? 0;
      outputTokens += response.usage?.output_tokens ?? 0;
      totalTokens += response.usage?.total_tokens ?? 0;
      console.info("dream_openai_call_complete", {
        requestId, pipeline: DREAM_PIPELINE, callNumber, stage, model,
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
        elapsedMs: Date.now() - callStartedAt,
      });
      if (response.status !== "completed" || !response.output_text) throw new DreamPipelineError("output_incomplete", stage);
      try { return JSON.parse(response.output_text) as unknown; }
      catch { throw new DreamPipelineError("invalid_json", stage); }
    }, () => deadline - Date.now() > 15_000);
    console.info("dream_interpret_complete", {
      requestId, pipeline: DREAM_PIPELINE, status: result.status, openaiCalls, inputTokens, outputTokens, totalTokens,
      elapsedMs: Date.now() - startedAt,
    });
    if (result.status === "clarification_required") return json(result);
    return json({ interpretation: result.interpretation });
  } catch (error) {
    console.warn("dream_reading_failed", {
      requestId, pipeline: DREAM_PIPELINE, ...safePipelineFailure(error, stage), openaiCalls, inputTokens, outputTokens, totalTokens,
      elapsedMs: Date.now() - startedAt,
    });
    return unavailable();
  } finally {
    clearTimeout(timeout);
  }
}
