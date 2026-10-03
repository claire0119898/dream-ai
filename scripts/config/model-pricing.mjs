// OpenAI 공식 모델 페이지의 Standard 텍스트 요금, USD / 1M tokens.
// 확인일: 2026-10-03. Live 실험 전에 공식 가격 재확인 필요.
// https://developers.openai.com/api/docs/models/gpt-4.1
// https://developers.openai.com/api/docs/models/gpt-4.1-mini
export const MODEL_PRICING = Object.freeze({
  "gpt-4.1": { input: 2, cachedInput: 0.5, output: 8 },
  "gpt-4.1-mini": { input: 0.4, cachedInput: 0.1, output: 1.6 },
});

export function calculateCost(model, usage) {
  const price = MODEL_PRICING[model];
  if (!price) throw new Error(`가격이 등록되지 않은 모델: ${model}`);
  if (!usage || !Number.isFinite(usage.input_tokens) || !Number.isFinite(usage.output_tokens)) return null;
  const cachedTokens = usage.input_tokens_details?.cached_tokens ?? 0;
  if (!Number.isFinite(cachedTokens) || cachedTokens < 0 || cachedTokens > usage.input_tokens) throw new Error("invalid_cached_token_usage");
  const inputCost = ((usage.input_tokens - cachedTokens) * price.input + cachedTokens * price.cachedInput) / 1_000_000;
  const outputCost = usage.output_tokens * price.output / 1_000_000;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}
