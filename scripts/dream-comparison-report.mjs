import { calculateCost } from "./config/model-pricing.mjs";

const sum = (values) => values.reduce((total, value) => total + value, 0);
const average = (values) => values.length ? sum(values) / values.length : null;
const display = (value, digits = 1) => value === null ? "측정 불가" : value.toFixed(digits);
const dollars = (value) => value === null ? "측정 불가" : `$${value.toFixed(6)}`;

export function summarizeCall(model, stage, usage, durationMs) {
  const cost = calculateCost(model, usage);
  return {
    model, stage, durationMs,
    inputTokens: usage?.input_tokens ?? null,
    outputTokens: usage?.output_tokens ?? null,
    cachedInputTokens: usage?.input_tokens_details?.cached_tokens ?? null,
    totalTokens: usage?.total_tokens ?? (usage ? usage.input_tokens + usage.output_tokens : null),
    ...cost ?? { inputCost: null, outputCost: null, totalCost: null },
  };
}

export function summarizeRun(variant, testCaseId, requestId, status, calls, durationMs, errorCode = null) {
  const measured = calls.length > 0 && calls.every((call) => call.totalCost !== null && call.inputTokens !== null && call.outputTokens !== null);
  return {
    variant, testCaseId, requestId, status, errorCode, calls, callCount: calls.length, durationMs,
    inputTokens: measured ? sum(calls.map((call) => call.inputTokens)) : null,
    outputTokens: measured ? sum(calls.map((call) => call.outputTokens)) : null,
    cachedInputTokens: measured ? sum(calls.map((call) => call.cachedInputTokens ?? 0)) : null,
    totalTokens: measured ? sum(calls.map((call) => call.totalTokens)) : null,
    inputCost: measured ? sum(calls.map((call) => call.inputCost)) : null,
    outputCost: measured ? sum(calls.map((call) => call.outputCost)) : null,
    totalCost: measured ? sum(calls.map((call) => call.totalCost)) : null,
  };
}

export function blindOrder(caseId, variants) {
  // 케이스별 고정 순환: 실행마다 같은 A/B/C/D를 만들지만 한 variant가 항상 A는 아닙니다.
  const offset = Number(caseId.match(/\d+$/u)?.[0] ?? 0) % variants.length;
  return [...variants.slice(offset), ...variants.slice(0, offset)];
}

export function renderInterpretation(result) {
  if (result.status === "clarification_required") return `확인 질문: ${result.clarification.message}\n`;
  const interpretation = result.interpretation;
  const narrative = interpretation.narrative;
  return [`# ${interpretation.title}`, narrative.opening, ...narrative.paragraphs.map((p) => p.text), `한 문장: ${narrative.coreMessage}`, `결말: ${narrative.flow.reading}`].join("\n\n") + "\n";
}

export function renderDraftForReview(raw) {
  const draft = raw?.narrative ?? raw;
  if (draft && typeof draft.title === "string" && typeof draft.opening === "string" && Array.isArray(draft.paragraphs)) {
    return [`# ${draft.title}`, draft.opening, ...draft.paragraphs.map((item) => item?.text).filter((item) => typeof item === "string"), typeof draft.coreMessage === "string" ? `한 문장: ${draft.coreMessage}` : "", typeof draft.flow?.reading === "string" ? `결말: ${draft.flow.reading}` : ""].filter(Boolean).join("\n\n") + "\n";
  }
  if (typeof raw?.clarificationQuestion === "string" && raw.clarificationQuestion.trim()) return `확인 질문: ${raw.clarificationQuestion}\n`;
  return `원본 구조화 응답:\n\n${JSON.stringify(raw, null, 2)}\n`;
}

export function renderEvaluationSheet(testCase, order) {
  const labels = order.map((_, index) => String.fromCharCode(65 + index));
  return [
    `# ${testCase.id} 사람 평가표`, "",
    `유형: ${testCase.type}`, "",
    "먼저 blind.md의 Result A/B를 읽으세요. 각 칸에 1~5점을 직접 적고, 아래 선호 결과도 선택하세요. 모델·파이프라인 정답표는 평가를 마친 뒤에만 확인하세요.", "",
    `| 평가 항목 | ${labels.map((label) => `Result ${label}`).join(" | ")} |`,
    `|---|${labels.map(() => "---:").join("|")}|`,
    ...[
      "원문 충실도", "해석 깊이", "해석의 설득력", "과도한 단정/과장 방지", "문장 자연스러움", "다시 사용하고 싶은 정도 (가장 중요)",
    ].map((item) => `| ${item} | ${labels.map(() => " ").join(" | ")} |`),
    "", "선호 결과 (A/B/동점): ", "", "선호 이유·문제점: ", "",
  ].join("\n");
}

export function renderRound2Report(cases, variants, runs) {
  const lines = [
    "# 꿈 해석 파이프라인 2차 비교", "",
    `합성 꿈 ${cases.length}개, two-step과 single-step만 비교합니다. 성공은 해설 완료 또는 확인 질문 반환이며, 품질의 정답이 아닙니다. 비용에는 검증 실패 호출도 포함됩니다.`, "",
    "| Variant | 성공률 | 해설 완료 | 확인 질문 | 평균 호출 | 평균 Input tokens | 평균 Output tokens | 평균 비용 | 평균 latency | 비용 측정 |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const variant of variants) {
    const group = runs.filter((run) => run.variant === variant);
    const measured = group.filter((run) => run.totalCost !== null);
    const successful = group.filter((run) => run.status !== "failed");
    lines.push(`| ${variant} | ${successful.length}/${group.length} (${group.length ? (successful.length / group.length * 100).toFixed(1) : "0.0"}%) | ${group.filter((run) => run.status === "complete").length} | ${group.filter((run) => run.status === "clarification_required").length} | ${display(average(group.map((run) => run.callCount)))} | ${display(average(measured.map((run) => run.inputTokens)))} | ${display(average(measured.map((run) => run.outputTokens)))} | ${dollars(average(measured.map((run) => run.totalCost)))} | ${display(average(group.map((run) => run.durationMs)), 0)}ms | ${measured.length}/${group.length} |`);
  }
  lines.push("", "## 케이스별 결과", "", "| Case | Variant | 상태 | 호출 | Input | Output | 비용 | latency | 검증 항목 |", "|---|---|---|---:|---:|---:|---:|---:|---|");
  for (const testCase of cases) for (const variant of variants) {
    const run = runs.find((item) => item.testCaseId === testCase.id && item.variant === variant);
    if (!run) continue;
    lines.push(`| ${testCase.id} | ${variant} | ${run.status} | ${run.callCount} | ${display(run.inputTokens, 0)} | ${display(run.outputTokens, 0)} | ${dollars(run.totalCost)} | ${display(run.durationMs, 0)}ms | ${(run.validationIssues ?? []).join(", ") || "—"} |`);
  }
  lines.push("", "실패 건의 원본 응답과 정확한 검증 항목은 케이스별 `*-diagnostics.json`에 저장됩니다. 원본 응답은 합성 꿈에 한정하며 콘솔 로그에 출력하지 않습니다.", "", "각 케이스의 `blind.md`와 비어 있는 `evaluation.md`를 먼저 평가한 뒤, 루트의 `answer-key.md`를 확인하세요. '다시 사용하고 싶은 정도'를 특히 중요하게 보되 자동으로 점수를 채우거나 비용만으로 운영 후보를 결정하지 않습니다.", "");
  return lines.join("\n");
}

export function renderReport(cases, variants, runs) {
  const byVariant = Object.fromEntries(variants.map((variant) => [variant, runs.filter((run) => run.variant === variant)]));
  const baseline = average(byVariant["baseline-3step"].filter((run) => run.totalCost !== null).map((run) => run.totalCost));
  const lines = [
    "# 꿈 해석 파이프라인 비교", "",
    `합성 꿈 ${cases.length}개 × ${variants.length}개 버전. 금액은 Responses API usage와 Standard 텍스트 단가로 계산한 추정 USD이며, 품질 판단은 별도 사람 검토가 필요합니다.`, "",
    "| Variant | 성공/실행 | 평균 호출 | 평균 Input tokens | 평균 Output tokens | 평균 비용 | Baseline 대비 절감 | 비용 측정 건수 |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const variant of variants) {
    const group = byVariant[variant];
    const measured = group.filter((run) => run.totalCost !== null);
    const cost = average(measured.map((run) => run.totalCost));
    const saving = baseline !== null && baseline > 0 && cost !== null ? (1 - cost / baseline) * 100 : null;
    lines.push(`| ${variant} | ${group.filter((run) => run.status === "complete").length}/${group.length} | ${display(average(group.map((run) => run.callCount)))} | ${display(average(measured.map((run) => run.inputTokens)))} | ${display(average(measured.map((run) => run.outputTokens)))} | ${dollars(cost)} | ${saving === null ? "측정 불가" : `${saving.toFixed(1)}%`} | ${measured.length}/${group.length} |`);
  }
  lines.push("", "## 케이스별 비용", "", "| Case | Variant | 상태 | 호출 | Input | Output | 비용 | 실행 시간 |", "|---|---|---|---:|---:|---:|---:|---:|");
  for (const testCase of cases) for (const variant of variants) {
    const run = runs.find((item) => item.testCaseId === testCase.id && item.variant === variant);
    if (!run) continue;
    lines.push(`| ${testCase.id} | ${variant} | ${run.status}${run.errorCode ? ` (${run.errorCode})` : ""} | ${run.callCount} | ${display(run.inputTokens, 0)} | ${display(run.outputTokens, 0)} | ${dollars(run.totalCost)} | ${display(run.durationMs, 0)}ms |`);
  }
  const stageGroups = new Map();
  for (const run of runs) for (const call of run.calls) {
    const key = `${run.variant} / ${call.stage}`;
    const group = stageGroups.get(key) ?? [];
    group.push(call);
    stageGroups.set(key, group);
  }
  lines.push("", "## 단계별 비용과 토큰", "", "| Variant / 단계 | 호출 | 총 Input | 총 Output | 총 비용 |", "|---|---:|---:|---:|---:|");
  for (const [stage, calls] of stageGroups) {
    const measured = calls.filter((call) => call.totalCost !== null);
    lines.push(`| ${stage} | ${calls.length} | ${sum(measured.map((call) => call.inputTokens))} | ${sum(measured.map((call) => call.outputTokens))} | ${measured.length === calls.length ? dollars(sum(measured.map((call) => call.totalCost))) : "측정 불가"} |`);
  }
  const allMeasured = runs.flatMap((run) => run.calls).filter((call) => call.totalCost !== null);
  const stageTotals = [...stageGroups].map(([stage, calls]) => ({ stage, cost: sum(calls.filter((call) => call.totalCost !== null).map((call) => call.totalCost)), tokens: sum(calls.filter((call) => call.totalTokens !== null).map((call) => call.totalTokens)) }));
  const costliest = [...stageTotals].sort((a, b) => b.cost - a.cost)[0];
  const mostTokens = [...stageTotals].sort((a, b) => b.tokens - a.tokens)[0];
  const baselineCalls = byVariant["baseline-3step"].flatMap((run) => run.calls);
  const baselineCost = sum(baselineCalls.filter((call) => call.totalCost !== null).map((call) => call.totalCost));
  const revisionCost = sum(baselineCalls.filter((call) => call.stage === "revision" && call.totalCost !== null).map((call) => call.totalCost));
  lines.push("", "## 해석 메모", "", `- 측정된 호출 중 비용이 가장 큰 단계: ${costliest?.stage ?? "측정 불가"}.`, `- 측정된 호출 중 토큰이 가장 많은 단계: ${mostTokens?.stage ?? "측정 불가"}.`, `- Baseline revision 비용 비중: ${baselineCost > 0 ? `${(revisionCost / baselineCost * 100).toFixed(1)}%` : "측정 불가"}.`, `- Mini 혼합, 2-step, 1-step의 절감률은 위 표에 각각 표시했습니다. 실패나 usage 누락이 있으면 비용 평균의 측정 건수를 확인하세요.`, `- 측정 가능한 호출: ${allMeasured.length}/${runs.flatMap((run) => run.calls).length}. 실패한 API 호출은 usage가 없을 수 있어 실제 청구액과 차이가 날 수 있습니다.`, "- 블라인드 결과를 먼저 읽고 정확성·근거·자연스러움·확인 질문 적절성을 사람에게 평가받으세요. 비용만으로 운영 적용을 결정하지 마세요.", "");
  return lines.join("\n");
}
