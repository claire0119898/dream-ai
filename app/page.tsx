"use client";
import { analyzeDream, formatDreamAnalysis } from "../lib/dreamEngine";
import { useState } from "react";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

import DreamInput from "../components/DreamInput";
import KeywordGrid from "../components/KeywordGrid";
import DreamResult from "../components/DreamResult";

import { dreamDictionary } from "../data/dreamDictionary";

export default function Home() {
  const [dream, setDream] = useState("");
  const [result, setResult] = useState("");

  function interpretDream() {
  if (!dream.trim()) {
    setResult("꿈 내용을 먼저 입력해주세요.");
    return;
  }

  const analysis = analyzeDream(dream);
  const formattedResult = formatDreamAnalysis(analysis);

  setResult(formattedResult);
}

  function selectKeyword(keyword: string) {
    const item = dreamDictionary.find((d) => d.keyword === keyword);

    if (!item) return;

    setDream(`${keyword} 꿈`);

    setResult(
`${item.emoji} ${item.keyword}

${item.meaning}

좋은 의미
${item.good}

주의
${item.caution}`
    );
  }

  return (
    <main className="min-h-screen bg-[#050b18]">

      <Header />

      <Hero />

      <DreamInput
        dream={dream}
        setDream={setDream}
        onInterpret={interpretDream}
      />

      <KeywordGrid
        onSelectKeyword={selectKeyword}
      />

      <DreamResult
        result={result}
      />

      <Footer />

    </main>
  );
}