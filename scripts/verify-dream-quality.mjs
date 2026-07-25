const baseUrl = process.env.DREAM_TEST_BASE_URL || "http://127.0.0.1:3102";
const testAddress = process.env.DREAM_TEST_IP || "127.0.0.77";

const cases = [
  {
    name: "가족의 지원 단일 장면",
    dream: "꿈에서 친정아빠가 남편한테 살림에 보태라고 차고 계시던 은팔찌를 주셨어요.",
    expected: ["친정아버지", "남편", "살림", "은팔찌", "차고 계시던", "건네"],
    concepts: [["지원", "도움", "보태"], ["책임", "가정", "살림"], ["애착", "가치", "소중"], ["희생", "양보", "내어"]],
    expectsNoExplicitEmotion: true,
  },
  {
    name: "할머니의 따뜻한 밥그릇",
    dream: "돌아가신 할머니가 아무 말 없이 제 손에 따뜻한 밥그릇을 쥐여주셨어요.",
    expected: ["할머니", "말 없이", "손", "따뜻한", "밥그릇", "건네"],
    concepts: [["돌봄", "보살핌", "챙김", "온기"], ["기억", "그리움", "이어", "전해"]],
    expectsNoExplicitEmotion: true,
  },
  {
    name: "문을 고치고 불을 밝히는 가족",
    dream: "남편이 낡은 집의 문을 고치고 있었는데 친정엄마가 옆에서 계속 불을 밝혀주고 있었어요.",
    expected: ["남편", "낡은 집", "문", "고치", "친정어머니", "불"],
    concepts: [["회복", "고치", "정비"], ["도움", "밝혀", "길", "곁"]],
    expectsNoExplicitEmotion: true,
  },
  {
    name: "아들의 작은 신발",
    dream: "아들이 신던 작은 신발을 모르는 아이에게 주었는데 이상하게 아깝지 않았어요.",
    expected: ["아들", "신던", "작은 신발", "모르는 아이", "주", "아깝지"],
    concepts: [["성장", "지나간", "작아진"], ["나눔", "내어", "건네"], ["아깝지", "미련", "놓아"]],
  },
  {
    name: "가족의 지원과 소유물",
    dream:
      "친정아빠가 남편에게 살림에 보태라고 차고 있던 은팔찌를 주었습니다. 남편은 두 손으로 팔찌를 받았고 아버지는 말없이 웃었습니다.",
    expected: ["친정아빠", "남편", "살림", "은팔찌", "두 손", "웃"],
    concepts: [["지원", "도움", "보태"], ["책임", "가정", "살림"], ["애착", "가치", "소중"], ["희생", "양보", "내어"]],
  },
  {
    name: "시험과 해방감",
    dream:
      "시험장에 늦게 도착했는데 시험지는 이미 제출되어 있었습니다. 그런데 이상하게 불안하지 않았고 오히려 모든 부담이 끝난 것처럼 홀가분했습니다. 시험장을 나오자 비가 그치고 햇빛이 비쳤습니다.",
    expected: ["늦", "제출", "홀가분", "나오", "비", "햇빛"],
    concepts: [["부담", "책임", "평가"], ["벗어나", "내려놓", "해방", "끝"]],
  },
  {
    name: "구렁이와 시선",
    dream:
      "큰 검은 구렁이가 집 안으로 들어왔고 가족들은 가만히 있었지만 나만 도망쳤습니다. 마지막에는 뱀과 눈을 마주쳤습니다.",
    expected: ["구렁이", "집", "가족", "도망", "눈", "마주"],
    concepts: [["위협", "부담", "두려"], ["회피", "도망"], ["대면", "마주"]],
  },
  {
    name: "엘리베이터와 목적지",
    dream:
      "회사 엘리베이터가 계속 위로 올라갔지만 층수는 표시되지 않았습니다. 문이 열릴 때마다 낯선 사람들이 탔고 저는 내릴 곳을 찾지 못했습니다.",
    expected: ["엘리베이터", "위로", "층수", "문", "낯선", "내릴 곳"],
    concepts: [["목적지", "방향", "위치"], ["불확실", "알 수 없", "표시되지"]],
  },
  {
    name: "고양이의 변화",
    dream:
      "고양이가 창문 밖에서 울고 있었는데 문을 열자 새로 변해 날아갔습니다. 처음에는 걱정했지만 마지막에는 안심했습니다.",
    expected: ["고양이", "창문", "문", "새", "날아", "안심"],
    concepts: [["놓아", "허용", "통제"], ["해결", "자연스럽", "안심"]],
  },
];

const selectedCases = process.env.DREAM_TEST_CASE
  ? cases.filter((testCase) => testCase.name === process.env.DREAM_TEST_CASE)
  : cases;

for (const testCase of selectedCases) {
  const response = await fetch(`${baseUrl}/api/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": testAddress },
    body: JSON.stringify({ dream: testCase.dream }),
  });
  const payload = await response.json();
  const interpretation = payload.interpretation;
  if (!response.ok || !interpretation) {
    console.log(JSON.stringify({ name: testCase.name, status: response.status, result: "failed" }));
    continue;
  }

  const combined = [
    interpretation.coreMeaning,
    interpretation.overallDirection,
    interpretation.integratedInterpretation,
    ...interpretation.keyScenes.flatMap((scene) => [
      scene.title,
      scene.evidence,
      scene.generalMeaning,
      scene.specificMeaning,
      scene.connection,
    ]),
    ...interpretation.realLifeConnections,
    interpretation.reflectionQuestion,
  ].join(" ");
  const matched = testCase.expected.filter((term) => combined.includes(term));
  const matchedConcepts = testCase.concepts.filter((options) =>
    options.some((term) => combined.includes(term))
  );
  const paragraphCount = interpretation.integratedInterpretation
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;
  const reflectionQuestionCount = interpretation.reflectionQuestion.trim().endsWith("?") ? 1 : 0;
  const possibilityCount = (
    `${interpretation.integratedInterpretation} ${interpretation.realLifeConnections.join(" ")}`.match(/수 있습니다|수도 있습니다|연결해볼 수 있습니다|가능성/g) ?? []
  ).length;
  const technicalTermsExposed = /\b(?:AI|GPT|OpenAI|LLM|API|prompt|token|model)\b|인공지능|프롬프트|토큰|챗봇/i.test(
    JSON.stringify(payload)
  );
  const dictionaryStyleCount = (
    interpretation.integratedInterpretation.match(/(?:을|를|은|는)\s*(?:상징합니다|의미합니다)|(?:으로|라고)\s*해석됩니다/g) ?? []
  ).length;
  const sentences = interpretation.integratedInterpretation
    .replace(/\n+/g, " ")
    .match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g) ?? [];
  const maxSentenceLength = Math.max(0, ...sentences.map((sentence) => sentence.trim().length));
  const genericEnding = /(?:긍정적으로 생각|편안하게 받아들|마음을 돌아보|좋게 생각)(?:세요|보세요)?[.!?。！？]*$/u.test(
    interpretation.integratedInterpretation.trim()
  );
  const noEmotionAcknowledged = !testCase.expectsNoExplicitEmotion ||
    /(?:직접|분명하게).{0,18}(?:감정|느낌).{0,18}(?:없|않|드러나지|표현되지)|(?:감정|느낌).{0,18}(?:명시되지|분명하지)/u.test(
      interpretation.integratedInterpretation
    );

  console.log(
    JSON.stringify({
      name: testCase.name,
      status: response.status,
      sceneMatches: `${matched.length}/${testCase.expected.length}`,
      missingScenes: testCase.expected.filter((term) => !matched.includes(term)),
      conceptMatches: `${matchedConcepts.length}/${testCase.concepts.length}`,
      coreMeaningLength: interpretation.coreMeaning.length,
      keySceneCount: interpretation.keyScenes.length,
      sceneSpecificLengths: interpretation.keyScenes.map((scene) => scene.specificMeaning.length),
      interpretationLength: interpretation.integratedInterpretation.length,
      paragraphCount,
      reflectionQuestionCount,
      possibilityCount,
      realLifeConnectionCount: interpretation.realLifeConnections.length,
      dictionaryStyleCount,
      maxSentenceLength,
      genericEnding,
      noEmotionAcknowledged,
      technicalTermsExposed,
    })
  );
}
