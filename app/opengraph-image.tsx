import { createSocialImage, socialImageSize } from "../lib/socialImage";

export const alt = "잠결 - 꿈해몽과 꿈풀이";
export const size = socialImageSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialImage({
    title: "잠결에 남은 꿈의 의미",
    subtitle: "기억에 남은 장면과 감정을 따라 꿈의 상징을 차분하게 풀어보세요.",
  });
}
