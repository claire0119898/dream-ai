import { createSemanticFallback } from "../lib/dreamSemantic.ts";

function assert(condition, message) { if (!condition) throw new Error(message); }

const dream = "작정하고 지은 실내 온천이었다. 미로 구조였고 한 방향으로 물살을 따라 둥둥 떠가게 되어있었다. 고급진 조명과 통로 옆 장식품만으로도 눈이 즐거워 갤러리에 온 건 지 물놀이를 하러 온 건지 구분이 안갔다. 그러다가 불시에 탁 트인 야외 온천으로 연결되었다. 환하고 따사로운 햇볕에 물이 은빛 보석처럼 반짝거렸다. 개방감에 아름다움에 예고 없이 야외가 펼쳐진 거에 행복에 젖어 미친듯이 발을 구르며 헤엄쳤다. 물은 맑았고 투명했다.";
const analysis = { summary: "", keywords: [{ keyword: "물", emoji: "", meaning: "감정", good: "정화", caution: "불안" }], emotions: ["행복"], situations: [], interpretation: "", advice: "", relatedKeywords: [] };
const result = createSemanticFallback(dream, analysis);
const visible = [result.coreConclusion, ...result.keyScenes.flatMap((item) => [item.title, item.meaning]), result.integratedInterpretation, ...result.realLifeConnections].join(" ");
for (const phrase of ["실내 온천", "물살을 따라", "야외 온천", "햇볕", "헤엄쳤", "맑았고 투명"] ) assert(visible.includes(phrase), `긴 꿈 fallback이 핵심 원문을 보존해야 합니다: ${phrase}`);
for (const forbidden of ["물살을 변하는 행동", "주체가 원문", "원문에 없는", "파서", "grounding"]) assert(!visible.includes(forbidden), `내부 검증 문구를 노출하면 안 됩니다: ${forbidden}`);
assert(result.keyScenes.length >= 2 && result.keyScenes.length <= 4, "핵심 장면은 2~4개여야 합니다.");
console.log("긴 서술형 꿈 fallback 검증: 1/1 통과");
