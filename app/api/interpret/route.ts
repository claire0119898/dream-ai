import OpenAI from "openai";
import { NextResponse } from "next/server";

import {
  DEFAULT_DREAM_MODEL,
  ENRICHMENT_MAX_OUTPUT_TOKENS,
  ENRICHMENT_TIMEOUT_MS,
} from "../../../lib/dreamConfig";
import { analyzeDream, needsContextEnrichment, validateDreamInput } from "../../../lib/dreamEngine";
import {
  createDictionaryInterpretation,
  mergeInterpretations,
  validateExternalInterpretation,
} from "../../../lib/dreamInterpretation";
import type { DreamInterpretation } from "../../../types/dream";
import { reserveExternalAttempt } from "../../../lib/externalUsageLimiter";

type InterpretRequestBody = { dream?: unknown };
type ProviderError = Error & { status?: number; code?: string };

const interpretationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "symbols",
    "emotion",
    "flow",
    "interpretation",
    "guidance",
    "caution",
  ],
  properties: {
    title: { type: "string", maxLength: 60 },
    summary: { type: "string", maxLength: 500 },
    symbols: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "meaning"],
        properties: {
          name: { type: "string", maxLength: 80 },
          meaning: { type: "string", maxLength: 400 },
        },
      },
    },
    emotion: { type: "string", maxLength: 500 },
    flow: { type: "string", maxLength: 500 },
    interpretation: { type: "string", maxLength: 1800 },
    guidance: { type: "string", maxLength: 600 },
    caution: { type: "string", maxLength: 500 },
  },
} as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function dictionaryContext(interpretation: DreamInterpretation) {
  return JSON.stringify({
    summary: interpretation.summary,
    symbols: interpretation.symbols,
    emotion: interpretation.emotion,
    flow: interpretation.flow,
    guidance: interpretation.guidance,
  });
}

function logProviderFailure(error: unknown) {
  const providerError = error as ProviderError;
  console.error("Dream interpretation enrichment failed", {
    name: providerError?.name || "UnknownError",
    status: providerError?.status,
    code: providerError?.code,
  });
}

async function requestContextualInterpretation(
  dream: string,
  dictionary: DreamInterpretation
): Promise<DreamInterpretation | null> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;

  try {
    const requestPromise = client.responses.create(
      {
        model: process.env.OPENAI_DREAM_MODEL || DEFAULT_DREAM_MODEL,
        instructions: `당신은 차분하고 따뜻한 한국어 꿈풀이 해설자입니다.
꿈의 인물, 장소, 행동, 감정과 전체 흐름을 함께 고려하세요. 사전 상징을 나열하지 말고 맥락으로 연결하세요.
미래, 사고, 죽음, 임신, 질병, 재물을 단정하거나 공포를 조장하지 마세요.
꿈이 실제 사건을 예고한다고 표현하지 말고, 최근 경험과 감정이 반영될 수 있음을 자연스럽게 안내하세요.
필드마다 역할을 나누고 같은 문장을 반복하지 마세요. 사용자에게 기술적인 처리 방식을 언급하지 마세요.`,
        input: `꿈 이야기:\n${dream}\n\n사전 기반 기본 풀이:\n${dictionaryContext(dictionary)}\n\n기본 풀이를 존중하면서 꿈의 문맥에 맞게 정해진 구조의 각 항목을 완성하세요. title은 반드시 "꿈풀이"로 작성하세요.`,
        text: {
          format: {
            type: "json_schema",
            name: "dream_interpretation",
            strict: true,
            schema: interpretationSchema,
          },
        },
        max_output_tokens: ENRICHMENT_MAX_OUTPUT_TOKENS,
      },
      { signal: controller.signal, maxRetries: 0 }
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new DOMException("Interpretation timed out", "AbortError"));
      }, ENRICHMENT_TIMEOUT_MS);
    });

    const response = await Promise.race([requestPromise, timeoutPromise]);
    if (!response.output_text) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      return null;
    }

    return validateExternalInterpretation(parsed);
  } finally {
    clearTimeout(timeout!);
  }
}

export async function POST(request: Request) {
  let body: InterpretRequestBody;

  try {
    body = (await request.json()) as InterpretRequestBody;
  } catch {
    return json({ error: "기억나는 장면과 감정을 조금 더 자세히 적어주세요." }, 400);
  }

  const dream = typeof body.dream === "string" ? body.dream.trim() : "";
  const validation = validateDreamInput(dream);

  if (!validation.valid) {
    return json({ error: validation.message || "기억나는 장면과 감정을 조금 더 자세히 적어주세요." }, 400);
  }

  const analysis = analyzeDream(dream);
  const dictionary = createDictionaryInterpretation(analysis);

  if (!process.env.OPENAI_API_KEY || !needsContextEnrichment(analysis, dream)) {
    return json({ interpretation: dictionary });
  }

  // 모든 사용자·전체 한도와 동일 꿈 재요청을 외부 호출 직전에 원자적으로 확인하고,
  // 성공 여부와 무관하게 이번 시도를 기록해 과도한 재시도를 막습니다.
  const usageDecision = await reserveExternalAttempt(request, dream);

  if (usageDecision !== "allowed") {
    return json({
      interpretation: dictionary,
      notice:
        usageDecision === "user_limited"
          ? "오늘은 충분한 꿈 이야기를 나누었어요. 잠시 후 다시 찾아주세요."
          : null,
    });
  }

  const contextual = await requestContextualInterpretation(dream, dictionary).catch((error) => {
    logProviderFailure(error);
    return null;
  });
  const interpretation = contextual
    ? mergeInterpretations(dictionary, contextual)
    : dictionary;

  return json({ interpretation });
}
