import assert from "node:assert/strict";
import { validateNarrative, toNarrativeInterpretation } from "../lib/dreamNarrative.ts";
import { dungeonDream, dungeonReading, verboseDungeonReading } from "./narrative-fixtures.mjs";

// 긴 결과를 원문 복사로 평가하지 않고, 문단·결말·근거의 보존을 확인합니다.
const checked = validateNarrative(dungeonReading, dungeonDream);
assert(checked.ok);
const result = toNarrativeInterpretation(checked.value, 4);
assert.deepEqual(result.narrative.paragraphs.map((p) => p.text), dungeonReading.paragraphs.map((p) => p.text));
assert.equal(result.narrative.coreMessage, dungeonReading.coreMessage);
assert.equal(result.narrative.paragraphs.length, 3);
assert(result.integratedInterpretation.length < 750, "분량을 채우려고 해설을 늘리지 않는다");
assert.equal(validateNarrative(verboseDungeonReading, dungeonDream).ok, false, "이전의 긴 해설은 새 간결한 형식에 맞게 교정한다");
assert.equal(result.keyScenes.length, 0, "장면별 중복 카드로 되돌리지 않는다");
const copied = structuredClone(dungeonReading);
copied.paragraphs = Array.from({ length: 6 }, () => ({ text: dungeonDream, highlight: "", evidence: ["던전 같은 곳"] }));
assert.equal(validateNarrative(copied, dungeonDream).ok, false);
assert.equal(validateNarrative({ ...dungeonReading, endingEvidence: "던전 같은 곳에 들어가서" }, dungeonDream).ok, false, "시작을 결말 근거로 사용하지 않는다");
const withEmotion = { scenes: [], emotionalArc: { beginning: null, middle: null, ending: "행복" } };
assert.equal(validateNarrative(dungeonReading, dungeonDream, withEmotion).ok, false, "명시된 감정을 근거에서 누락하지 않는다");
console.log("장문 문단 보존·원문 복사 거부·결말/감정 근거 검사 통과");
