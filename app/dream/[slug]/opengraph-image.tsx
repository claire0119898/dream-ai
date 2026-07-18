import { coreDreamKeywords } from "../../../data/dreamDictionary";
import { getDreamEditorial } from "../../../data/dreamEditorial";
import { createSocialImage, socialImageSize } from "../../../lib/socialImage";

export const alt = "잠결 꿈 사전 대표 이미지";
export const size = socialImageSize;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let keyword = slug;
  try { keyword = decodeURIComponent(slug); } catch { /* 원래 값을 사용합니다. */ }
  const item = coreDreamKeywords.find((candidate) => candidate.keyword === keyword);
  const displayName = item ? getDreamEditorial(item.keyword)?.displayName ?? item.keyword : "꿈";

  return createSocialImage({
    eyebrow: "잠결 · 꿈 사전",
    title: `${displayName} 꿈해몽`,
    subtitle: "기본 의미부터 상황별 해석과 심리적 의미까지 차분하게 살펴보세요.",
    emoji: item?.emoji ?? "☾",
  });
}
