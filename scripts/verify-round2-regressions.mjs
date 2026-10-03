import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { round2Cases } from "./dream-comparison-round2-cases.mjs";
import { isMeaningfulLabel, validateUnderstanding } from "../lib/dreamSemantic.ts";
import { validateNarrative } from "../lib/dreamNarrative.ts";
import { FINAL_READING_INSTRUCTIONS, UNDERSTANDING_INSTRUCTIONS } from "../lib/dreamPipeline.ts";

const dream = (id) => round2Cases.find((item) => item.id === id)?.dream;
const scene = (order, description, evidence) => ({ order, description, emotion: null, evidence });
const transition = (from, to, evidence) => ({ from, to, meaningCandidate: "꿈속 행동의 변화", evidence });
const understanding = (id, scenes, transitions) => ({
  summaryOfDream: dream(id), settings: [], scenes, importantSymbols: ["마지막 행동"], transitions,
  emotionalArc: { beginning: null, middle: null, ending: null },
  agencyArc: { beginning: null, ending: null, change: null },
  ending: "마지막 장면에서 꿈이 끝남", ambiguities: [], needsClarification: false, clarificationQuestion: null,
});

const case01 = understanding("round2-01", [
  scene(1, "친구보다 뒤에서 뛰며 소리를 들었다", "뒤에서 누가 오는 소리 나고"),
  scene(2, "떨어진 가방을 줍다가 문을 열었다", "저는 떨어진 가방 줍구다가"),
], [transition("가방을 줍던 중", "문을 열고 나감", "저는 떨어진 가방 줍구다가 문 하나 열어서 나갔어요")]);
const checked01 = validateUnderstanding(case01, dream("round2-01"));
assert(checked01, "round2-01: 한 글자 내부 오기는 원문 근거로 복원된다");
assert.equal(checked01.scenes[1].evidence, "저는 떨어진 가방 줍다가");
assert.equal(checked01.transitions[0].evidence, "저는 떨어진 가방 줍다가 문 하나 열어서 나갔어요");
assert.equal(validateUnderstanding({ ...case01, scenes: [case01.scenes[0], scene(2, "꿈에 없는 가방 소각", "저는 떨어진 가방 태우다가")] }, dream("round2-01")), null, "새 사건은 미세 오기로 취급하지 않는다");
assert.equal(validateUnderstanding({ ...case01, scenes: [case01.scenes[0], scene(2, "다른 인물이 가방을 주움", "친구가 떨어진 가방 줍다가")] }, dream("round2-01")), null, "인물 관계 변경은 거부한다");

const case13 = understanding("round2-13", [
  scene(1, "죽었다는 말을 들음", "꿈에서 제가 죽었다는 말을 들었는데"),
  scene(2, "집으로 돌아옴 ", "끝에는 집으로 돌아왔습니다"),
], [transition("길을 걸음", "집으로 돌아옴", "끝에는 집으로 돌아왔습니다")]);
assert(validateUnderstanding(case13, dream("round2-13")), "round2-13: 7자 장면 설명과 꿈속 죽음은 정상 입력이다");
assert.equal(validateUnderstanding({ ...case13, scenes: [case13.scenes[0], scene(2, "?", "끝에는 집으로 돌아왔습니다")] }, dream("round2-13")), null, "내용 없는 설명은 허용하지 않는다");

const case20 = understanding("round2-20", [
  scene(1, "자리가 없어 돌아다님", "자리가 없어서 돌아다녔어요"),
  scene(2, "동생과 빈자리에 앉음", "동생이 와서 같이 앉았어요"),
  scene(3, "음식이 나오지 않아 기다림", "음식은 안 나왔는데 기다리는 건 괜찮았어요"),
], [
  transition("자리 찾기", "동생을 부름", "자리가 없어서 돌아다녔어요. 제가 먼저 빈 의자 찾아서 손짓했고"),
  transition("손짓함", "같이 앉음", "손짓했고 동생이 와서 같이 앉았어요"),
  transition("같이 앉음", "기다림", "같이 앉았어요. 음식은 안 나왔는데 기다리는 건 괜찮았어요"),
]);
const checked20 = validateUnderstanding(case20, dream("round2-20"));
assert(checked20, "round2-20: 불연속 인용 하나는 제거하고 나머지 근거를 사용한다");
assert.equal(checked20.transitions.length, 2);
assert(checked20.transitions.every((item) => !item.evidence.startsWith("자리가 없어서")));
assert.equal(validateUnderstanding({ ...case20, transitions: [case20.transitions[0]] }, dream("round2-20")), null, "근거가 없는 유일한 전환은 버리고 진행하지 않는다");

for (const value of ["공", "비", "문", "집", "차", "불"]) assert(isMeaningfulLabel(value), `한 글자 상징 ${value} 허용`);
for (const value of ["이", "가", "은", "는", "것", "상태"]) assert(!isMeaningfulLabel(value), `문법 요소·일반 라벨 ${value} 거부`);

const reading19 = {
  title: "삼촌과 잠시 공을 주고받은 꿈",
  opening: "삼촌과 잠시 다시 만나 반가웠다가 헤어지며 조금 슬퍼진 마음을 떠올리게 하는 꿈이에요.",
  paragraphs: [
    { text: "운동장에서 삼촌과 공을 주고받으며 반가웠다는 점이 눈에 띄어요. 이미 떠난 사람을 꿈에서 만난 시간이 짧지만 분명하게 남아 있어요.", highlight: "", evidence: ["잠깐 공을 주고받았어요", "웃으면서 반가웠는데"] },
    { text: "삼촌이 먼저 떠난 뒤에도 공을 들고 운동장 문으로 나왔어요. 만남의 기쁨과 헤어진 뒤의 슬픔이 차례로 나타났다는 점을 중심으로 읽을 수 있어요.", highlight: "", evidence: ["그가 먼저 손을 흔들고 가자 조금 슬펐습니다", "저는 공을 들고 운동장 문으로 나왔어요"] },
  ],
  coreMessage: "반가운 만남과 헤어지는 아쉬움이 함께 남은 꿈이에요.",
  flow: { label: "관계", reading: "삼촌을 만나 반가웠다가 그가 떠난 뒤 조금 슬퍼했고, 공을 들고 문으로 나오는 흐름이에요." },
  centralFocus: { symbol: "공", evidence: "저는 공을 들고 운동장 문으로 나왔어요" },
  endingEvidence: "저는 공을 들고 운동장 문으로 나왔어요",
  emotionalEvidence: ["웃으면서 반가웠는데", "조금 슬펐습니다"],
};
assert.equal(validateNarrative(reading19, dream("round2-19")).ok, true, "round2-19: 공 한 글자는 유효한 상징이다");
assert.equal(validateNarrative({ ...reading19, centralFocus: { ...reading19.centralFocus, symbol: "이" } }, dream("round2-19")).ok, false);
for (const decoration of ["...", "…"]) {
  const decorated = { ...reading19, centralFocus: { ...reading19.centralFocus, evidence: `${decoration}${reading19.centralFocus.evidence}${decoration}` } };
  assert.equal(validateNarrative(decorated, dream("round2-19")).ok, true, `${decoration}: 인용 앞뒤 장식은 허용한다`);
  assert.equal(validateNarrative({ ...reading19, endingEvidence: `${decoration}${reading19.endingEvidence}` }, dream("round2-19")).ok, true, `${decoration}: 결말 인용의 앞 장식은 허용한다`);
  assert.equal(validateNarrative({ ...reading19, emotionalEvidence: [`${reading19.emotionalEvidence[0]}${decoration}`] }, dream("round2-19")).ok, true, `${decoration}: 감정 인용의 뒤 장식은 허용한다`);
  assert.equal(validateNarrative({ ...reading19, paragraphs: [{ ...reading19.paragraphs[0], evidence: [`${decoration}${reading19.paragraphs[0].evidence[0]}`] }, reading19.paragraphs[1]] }, dream("round2-19")).ok, true, `${decoration}: 문단 인용의 앞 장식은 허용한다`);
  assert.equal(validateNarrative({ ...reading19, centralFocus: { ...reading19.centralFocus, evidence: `잠깐 공을 ${decoration} 주고받았어요` } }, dream("round2-19")).ok, false, `${decoration}: 연속된 원문 중간의 장식도 인용으로 인정하지 않는다`);
  assert.equal(validateNarrative({ ...reading19, centralFocus: { ...reading19.centralFocus, evidence: `웃으면서 반가웠는데 ${decoration} 저는 공을 들고 운동장 문으로 나왔어요` } }, dream("round2-19")).ok, false, `${decoration}: 떨어진 구절을 이어 붙일 수 없다`);
  assert.equal(validateNarrative({ ...reading19, centralFocus: { ...reading19.centralFocus, evidence: `${decoration}삼촌이 공을 태웠어요${decoration}` } }, dream("round2-19")).ok, false, `${decoration}: 앞뒤 장식으로 없는 사건을 감출 수 없다`);
}
assert(validateNarrative({ ...reading19, paragraphs: [{ ...reading19.paragraphs[0], evidence: ["삼촌이 공을 태웠어요"] }, reading19.paragraphs[1]] }, dream("round2-19")).issues?.includes("paragraph_evidence"), "꿈에 없는 사건은 거부한다");
assert(validateNarrative({ ...reading19, emotionalEvidence: ["갑자기 행복했어요"] }, dream("round2-19")).issues?.includes("source_evidence"), "꿈에 없는 감정은 거부한다");
assert(validateNarrative({ ...reading19, centralFocus: { ...reading19.centralFocus, evidence: "삼촌이 공을 주웠어요" } }, dream("round2-19")).issues?.includes("source_evidence"), "의미가 다른 인용은 거부한다");
const directEmotion19 = understanding("round2-19", [
  { ...scene(1, "삼촌과 공을 주고받음", "웃으면서 반가웠는데"), emotion: "반가웠는데" },
  { ...scene(2, "삼촌이 떠나자 슬퍼짐", "그가 먼저 손을 흔들고 가자 조금 슬펐습니다"), emotion: "조금 슬펐습니다" },
], [transition("함께 있음", "헤어짐", "그가 먼저 손을 흔들고 가자 조금 슬펐습니다")]);
directEmotion19.emotionalArc = { beginning: "반가웠는데", middle: "조금 슬펐습니다", ending: null };
const checkedEmotion19 = validateUnderstanding(directEmotion19, dream("round2-19"));
assert.equal(checkedEmotion19?.scenes[0].emotion, "반가웠는데", "원문에 직접 나온 감정은 유지한다");
assert.equal(checkedEmotion19?.emotionalArc.middle, "조금 슬펐습니다");

const reading05 = {
  title: "도서관에서 다른 길을 찾은 꿈",
  opening: "책을 반납하려던 길이 길어지자 다른 출입구를 거쳐 책을 말리고 친구를 만나는 꿈이에요.",
  paragraphs: [
    { text: "계단이 계속 늘어나던 도서관에서 다른 출입구를 듣고 뒤뜰로 나갔어요. 하던 일을 곧바로 끝내지 못했지만 다른 길을 찾는 움직임이 이어져요.", highlight: "", evidence: ["계단이 계속 늘어났어요", "뒤뜰로 나가니 작은 연못이 있었습니다"] },
    { text: "젖은 책을 말리며 친구와 책장을 넘긴 뒤 집 쪽 버스를 탔어요. 책을 다룬 행동과 친구와 함께한 짧은 시간이 결말까지 연결돼요.", highlight: "", evidence: ["연못 옆에서 젖은 책을 말리고 있는데", "학교 때 친구가 다가와 말없이 같이 책장을 넘겼어요"] },
  ],
  coreMessage: "책을 끝내려던 계획에서 잠시 다른 길과 만남으로 이어진 꿈이에요.",
  flow: { label: "전환", reading: "도서관에서 뒤뜰과 버스로 장소가 바뀌었고, 마지막에는 창밖의 도서관 불빛을 봤어요." },
  centralFocus: { symbol: "젖은 책", evidence: "연못 옆에서 젖은 책을 말리고 있는데" },
  endingEvidence: "버스 창밖으로 처음 도서관 불빛이 보였습니다",
  emotionalEvidence: [],
};
assert.equal(validateNarrative(reading05, dream("round2-05")).ok, true);
const hallucinated05 = validateNarrative({ ...reading05, emotionalEvidence: ["눈이 즐거워"] }, dream("round2-05"));
assert.equal(hallucinated05.ok, false, "round2-05: 원문에 없는 감정 인용은 계속 탈락한다");
assert(hallucinated05.issues.includes("source_evidence"));
assert(!UNDERSTANDING_INSTRUCTIONS.includes("눈이 즐거워"), "감정 예시 문구가 mini 프롬프트에서 제거됐다");
assert.match(UNDERSTANDING_INSTRUCTIONS, /<원문에서 직접 확인되는 감정 표현>/u);
assert.match(FINAL_READING_INSTRUCTIONS, /sceneNotes와 이 지침의 예시는 사용자 원문이 아닙니다/u);
assert.match(FINAL_READING_INSTRUCTIONS, /서로 떨어진 두 구절을 말줄임표로 이어/u);

// 저장된 과거 응답이 있는 로컬 환경에서는 원본도 재검증합니다. CI는 위의 독립 fixture만 사용합니다.
for (const id of ["round2-01", "round2-05", "round2-13", "round2-19", "round2-20"]) {
  const path = `artifacts/dream-pipeline-comparison-round2/${id}/two-step-diagnostics.json`;
  if (!existsSync(path)) continue;
  const snapshot = JSON.parse(readFileSync(path, "utf8"));
  if (!snapshot.rawOutputs?.length) continue; // 이전 연결 실패의 진단 파일은 응답이 없어 재검증 대상이 아닙니다.
  const parsed = validateUnderstanding(snapshot.rawOutputs[0].payload, dream(id));
  assert(parsed, `${id}: 저장된 understanding 응답 재검증`);
  if (id === "round2-13") {
    const archived = snapshot.rawOutputs.find((output) => output.stage === "final-reading")?.payload;
    assert(archived, "round2-13: 저장된 final-reading 응답이 있다");
    assert(validateNarrative(archived, dream(id), parsed).issues?.includes("source_evidence"), "저장된 응답의 내부 생략은 계속 거부한다");
    const corrected = { ...archived, centralFocus: { ...archived.centralFocus, evidence: "...끝에는 집으로 돌아왔습니다." } };
    assert.equal(validateNarrative(corrected, dream(id), parsed).ok, true, "round2-13: 연속된 원문 인용으로 바꾸면 정상 판정된다");
  }
  if (id === "round2-05") {
    assert.equal(parsed.scenes[6].emotion, null, "원문에 없는 장면 감정은 제거한다");
    assert.equal(parsed.emotionalArc.ending, null, "원문에 없는 감정 변화는 제거한다");
    const check = validateNarrative(snapshot.rawOutputs[1].payload, dream(id), parsed);
    assert.equal(check.ok, false, "기존 환각 출력은 여전히 거부한다");
    assert(check.issues.includes("source_evidence"));
  }
  if (id === "round2-19") assert.equal(validateNarrative(snapshot.rawOutputs[1].payload, dream(id), parsed).ok, true);
}

assert.equal(round2Cases.length, 20, "2차 합성 테스트셋 전체를 유지한다");
console.log("round2-01/05/13/19/20 validator 회귀 검증 통과 (OpenAI 호출 없음)");
