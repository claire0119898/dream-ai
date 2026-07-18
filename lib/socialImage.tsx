import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };

export function createSocialImage({
  title,
  subtitle,
  eyebrow = "잠결 · JAMGYEOL",
  emoji = "☾",
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  emoji?: string;
}) {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        color: "white",
        background: "linear-gradient(135deg, #060b19 0%, #121737 50%, #19123c 100%)",
        padding: "68px 76px",
      }}
    >
      <div style={{ position: "absolute", width: 430, height: 430, right: -110, top: -150, borderRadius: 999, background: "rgba(139,92,246,.24)", filter: "blur(2px)" }} />
      <div style={{ position: "absolute", width: 310, height: 310, left: -130, bottom: -170, borderRadius: 999, background: "rgba(34,211,238,.12)" }} />
      <div style={{ position: "absolute", right: 118, top: 116, display: "flex", width: 238, height: 238, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "2px solid rgba(221,214,254,.22)", background: "rgba(255,255,255,.045)", fontSize: 118, boxShadow: "0 0 100px rgba(167,139,250,.25)" }}>{emoji}</div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "72%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#ddd6fe", fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
          <span style={{ display: "flex", width: 42, height: 1, background: "#a78bfa" }} />{eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: title.length > 14 ? 58 : 70, lineHeight: 1.18, fontWeight: 800, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 24, maxWidth: 720, color: "#cbd5e1", fontSize: 28, lineHeight: 1.5 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", color: "#94a3b8", fontSize: 20 }}>꿈의 상징과 마음을 차분하게 읽는 시간</div>
      </div>
    </div>,
    socialImageSize,
  );
}
