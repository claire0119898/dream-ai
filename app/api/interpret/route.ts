import OpenAI from "openai";
import { NextResponse } from "next/server";
import { dreamDictionary } from "../../../data/dreamDictionary";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { dream } = await request.json();

    if (!dream || typeof dream !== "string") {
      return NextResponse.json(
        { error: "꿈 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const relatedDreams = dreamDictionary.filter((item) =>
      dream.includes(item.keyword)
    );

    const dictionaryText =
      relatedDreams.length > 0
        ? relatedDreams
            .map(
              (item) =>
                `키워드: ${item.keyword}
기본 의미: ${item.meaning}
좋은 의미: ${item.good}
주의할 점: ${item.caution}`
            )
            .join("\n\n")
        : "관련 꿈 사전 키워드가 없습니다.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 한국어 꿈해몽 전문가입니다. 사용자의 꿈을 부드럽고 이해하기 쉽게 해석하세요. 단, 의학적·법적·재정적 조언처럼 단정하지 말고 참고용 해석이라고 안내하세요.",
        },
        {
          role: "user",
          content: `
사용자의 꿈:
${dream}

참고할 꿈 사전:
${dictionaryText}

위 내용을 바탕으로 다음 형식으로 답변해주세요.

1. 꿈의 핵심 요약
2. 발견된 상징과 의미
3. 종합 해몽
4. 현실에서 참고할 조언
5. 참고 안내
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