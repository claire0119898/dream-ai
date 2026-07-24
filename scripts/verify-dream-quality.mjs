const baseUrl = process.env.DREAM_TEST_BASE_URL || "http://127.0.0.1:3102";

const cases = [
  {
    name: "시험과 해방감",
    dream:
      "시험장에 늦게 도착했는데 시험지는 이미 제출되어 있었습니다. 그런데 이상하게 불안하지 않았고 오히려 모든 부담이 끝난 것처럼 홀가분했습니다. 시험장을 나오자 비가 그치고 햇빛이 비쳤습니다.",
    expected: ["늦", "제출", "홀가분", "나오", "비", "햇빛"],
  },
  {
    name: "구렁이와 시선",
    dream:
      "큰 검은 구렁이가 집 안으로 들어왔고 가족들은 가만히 있었지만 나만 도망쳤습니다. 마지막에는 뱀과 눈을 마주쳤습니다.",
    expected: ["구렁이", "집", "가족", "도망", "눈", "마주"],
  },
  {
    name: "엘리베이터와 목적지",
    dream:
      "회사 엘리베이터가 계속 위로 올라갔지만 층수는 표시되지 않았습니다. 문이 열릴 때마다 낯선 사람들이 탔고 저는 내릴 곳을 찾지 못했습니다.",
    expected: ["엘리베이터", "위로", "층수", "문", "낯선", "내릴 곳"],
  },
  {
    name: "고양이의 변화",
    dream:
      "고양이가 창문 밖에서 울고 있었는데 문을 열자 새로 변해 날아갔습니다. 처음에는 걱정했지만 마지막에는 안심했습니다.",
    expected: ["고양이", "창문", "문", "새", "날아", "안심"],
  },
];

const selectedCases = process.env.DREAM_TEST_CASE
  ? cases.filter((testCase) => testCase.name === process.env.DREAM_TEST_CASE)
  : cases;

for (const testCase of selectedCases) {
  const response = await fetch(`${baseUrl}/api/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.77" },
    body: JSON.stringify({ dream: testCase.dream }),
  });
  const payload = await response.json();
  const interpretation = payload.interpretation;
  if (!response.ok || !interpretation) {
    console.log(JSON.stringify({ name: testCase.name, status: response.status, result: "failed" }));
    continue;
  }

  const combined = [
    interpretation.summary,
    interpretation.emotion,
    interpretation.flow,
    interpretation.interpretation,
    ...interpretation.symbols.map((symbol) => `${symbol.name} ${symbol.meaning}`),
  ].join(" ");
  const matched = testCase.expected.filter((term) => combined.includes(term));
  const guidanceCount = interpretation.guidance.split("\n").filter(Boolean).length;
  const technicalTermsExposed = /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/i.test(
    JSON.stringify(payload)
  );

  console.log(
    JSON.stringify({
      name: testCase.name,
      status: response.status,
      sceneMatches: `${matched.length}/${testCase.expected.length}`,
      missingScenes: testCase.expected.filter((term) => !matched.includes(term)),
      summaryLength: interpretation.summary.length,
      emotionLength: interpretation.emotion.length,
      flowLength: interpretation.flow.length,
      interpretationLength: interpretation.interpretation.length,
      guidanceCount,
      technicalTermsExposed,
    })
  );
}
