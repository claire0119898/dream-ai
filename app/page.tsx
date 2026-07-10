"use client";
import { analyzeDream, validateDreamInput } from "../lib/dreamEngine";
import { useState } from "react";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import AdBanner from "../components/AdBanner";

import DreamInput from "../components/DreamInput";
import KeywordGrid from "../components/KeywordGrid";
import DreamResult from "../components/DreamResult";

import type { DreamAnalysis } from "../types/dream";

export default function Home() {
  const [dream, setDream] = useState("");
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [error, setError] = useState("");

  function interpretDream() {
    const validation = validateDreamInput(dream);

    if (!validation.valid) {
      setError(validation.message ?? "꿈 내용을 확인해주세요.");
      setAnalysis(null);
      return;
    }

    setError("");
    setAnalysis(analyzeDream(dream));
  }

  function selectKeyword(keyword: string) {
    const text = `${keyword} 꿈`;
    setDream(text);
    setError("");
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

      {analysis && <AdBanner />}

      <Footer />
    </main>
  );
}
