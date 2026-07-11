import OpenAI from "openai";
import { NextResponse } from "next/server";
import { coreDreamKeywords } from "../../../data/dreamDictionary";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type InterpretRequestBody = {
  dream?: string;
  // 클라이언트(사전 엔진)가 이미 찾아낸 힌트가 있으면 함께 보내서 GPT가 참고하게 합니다.
  // (완전히 새로운 상황이라 사전에 아무것도 안 걸렸다면 비어 있을 수 있습니다.)
  hint?: {
    emotions?: string[];
    situations?: string[];
  };
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI 해몽 기능이 아직 설정되지 않았습니다. (OPENAI_API_KEY 미설정)" },
        { status: 503 }
      );
    }

    const body: InterpretRequestBody = await request.json();
    const dream = body.dream;

    if (!dream || typeof dream !== "string" || !dream.trim()) {
      return NextResponse.json(
        { error: "꿈 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const relatedDreams = coreDreamKeywords.filter((item) =>
      dream.includes(item.keyword)
    );

    const dictionaryText =
      relatedDreams.length > 0
        ? relatedDreams
            .map(
              (item) =>
                `- ${item.keyword}: ${item.meaning} (좋은 의미: ${item.good} / 주의할 점: ${item.caution})`
            )
            .join("\n")
        : "(사전에서 직접 일치하는 상징은 없습니다. 등장인물의 실제 정체보다, 그 사람이 주는 이미지나 상황 자체에 집중해서 해석해주세요.)";

    const hintText = [
      body.hint?.emotions?.length ? `감지된 감정: ${body.hint.emotions.join(", ")}` : null,
      body.hint?.situations?.length ? `감지된 상황: ${body.hint.situations.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 한국어 꿈해몽 전문가입니다. 사용자가 적은 꿈 내용을 여러 겹의 상징으로 풀어서
해석해주세요. 실존 인물이 등장하더라도 그 사람 자체를 평가하지 말고, 그 인물이 대중적으로 주는
"이미지"(예: 친근함, 성실함, 권위 등)를 상징으로 다뤄주세요. 꿈에서 실제로 일어나지 않은 일
(혼나지 않음, 쫓겨나지 않음 등)이 있다면 그 부재도 해석의 단서로 활용하세요.
의학적·법적·재정적 조언처럼 단정하지 말고, 참고용 해석이라는 점을 안내하세요.
과장하거나 확신하는 말투 대신 "~일 수 있습니다", "~로 해석되곤 합니다"처럼 부드럽게 표현하세요.`,
        },
        {
          role: "user",
          content: `사용자의 꿈:
${dream}

${hintText ? hintText + "\n\n" : ""}참고할 꿈 사전 매칭 결과:
${dictionaryText}

아래 형식으로 답변해주세요. 마크다운 제목(#, ##)은 쓰지 말고, 번호와 줄바꿈만 사용하세요.

이 꿈은 "OOO" 자체보다 [핵심이 되는 상징/상황]이 중요합니다. (한 문장으로 꿈의 핵심 전제를 짚어주세요)

꿈의 상징
1. [첫 번째 사건/요소] = [그것이 상징하는 심리]
   (짧은 설명, 필요하면 불릿 2~3개로 구체적인 해석 예시)
2. [두 번째 사건/요소] = [그것이 상징하는 심리]
   (짧은 설명)
3. [세 번째 사건/요소가 있다면] = [그것이 상징하는 심리]
   (짧은 설명)

한 줄 해몽
"[전체를 압축한 한 문장 통찰]"

(꿈에서 일어나지 않은 일이 있다면, 그 점을 짚어서 마무리 코멘트를 한 단락 추가해주세요. 예: 실제로는 혼나거나 쫓겨나지 않았다는 점에서 무의식이 전하는 메시지가 무엇인지)
`,
        },
      ],
      temperature: 0.8,
    });

    const result =
      response.choices[0]?.message?.content || "해몽 결과를 생성하지 못했습니다.";

    return NextResponse.json({ result });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "AI 해몽 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
