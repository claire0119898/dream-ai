import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "잠결 | 꿈해몽과 꿈풀이",
    short_name: "잠결",
    description: "기억에 남은 꿈의 상징과 의미를 차분하게 풀어보세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#050b18",
    theme_color: "#050b18",
    lang: "ko",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
