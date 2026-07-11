"use client";
import { analyzeDream, needsAiEnrichment, validateDreamInput } from "../lib/dreamEngine";
import { useState } from "react";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import AdBanner from "../components/AdBanner";

import DreamInput from "../components/DreamInput";
import KeywordGrid from "../components/KeywordGrid";
import DreamResult from "../components/DreamResult";
import AiDreamResult from "../components/AiDreamResult";

import type { DreamAnalysis } from "../types/dream";

export default function Home() {
  const [dream, setDream] = useState("");
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [error, setError] = useState("");

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function requestAiInterpretation(dreamText: string, hint: DreamAnalysis) {
    setAiLoading(true);
    setAiError(null);
    setAiText(null);

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dream: dreamText,
          hint: { emotions: hint.emotions, situations: hint.situations },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI 해몽 중 오류가 발생했습니다.");
      }

      setAiText(data.result);
    } catch {
      setAiError(
        "AI 해몽을 불러오지 못했어요. 잠시 후 다시 시도해주시거나, 위 사전 기반 해석을 참고해주세요."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function interpretDream() {
    const validation = validateDreamInput(dream);

    if (!validation.valid) {
      setError(validation.message ?? "꿈 내용을 확인해주세요.");
      setAnalysis(null);
      setAiText(null);
      setAiError(null);
      return;
    }

    setError("");
    const result = analyzeDream(dream);
    setAnalysis(result);
    setAiText(null);
    setAiError(null);

    // 사전에 등록된 상징을 하나도 못 찾았다면(예: 사전에 없는 인물/복합 상황),
    // 더 깊은 해석을 위해 AI(GPT)에게 보완 해석을 요청합니다.
    if (needsAiEnrichment(result)) {
      void requestAiInterpretation(dream, result);
    }
  }

  function selectKeyword(keyword: string) {
    const text = `${keyword} 꿈`;
    setDream(text);
    setError("");
    setAiText(null);
    setAiError(null);
    setAnalysis(analyzeDream(text));
  }

  return (
    <main className="min-h-screen bg-[#050b18]">
      <Header />

      <Hero />

      <DreamInput dream={dream} setDream={setDream} onInterpret={interpretDream} />

      {error && (
        <p className="mx-auto mt-4 max-w-5xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-center text-rose-200">
          {error}
        </p>
      )}

      <AdBanner />

      <KeywordGrid onSelectKeyword={selectKeyword} />

      <DreamResult analysis={analysis} />

      <AiDreamResult text={aiText} loading={aiLoading} error={aiError} />

      {analysis && <AdBanner />}

      <Footer />
    </main>
  );
}
