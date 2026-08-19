"use client";

import { useRef, useState } from "react";
import type {
  DreamClarification as DreamClarificationData,
  DreamInterpretation,
} from "../types/dream";
import AdPlaceholder from "./AdPlaceholder";
import DreamClarification from "./DreamClarification";
import DreamInput from "./DreamInput";
import DreamResult from "./DreamResult";

const CLIENT_REQUEST_TIMEOUT_MS = 55_000;

export default function HomeDreamInterpreter() {
  const [dream, setDream] = useState("");
  const [interpretation, setInterpretation] = useState<DreamInterpretation | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [clarification, setClarification] =
    useState<DreamClarificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const requestController = useRef<AbortController | null>(null);

  async function interpretDream(clarificationKey?: string) {
    if (loading) return;
    const text = dream.trim();
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_REQUEST_TIMEOUT_MS);

    setLoading(true);
    setError("");
    setNotice(null);

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream: text, clarificationKey }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "꿈풀이를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");

      if (
        data.status === "clarification_required" &&
        data.clarification
      ) {
        setInterpretation(null);
        setClarification(data.clarification);
        window.requestAnimationFrame(() =>
          document
            .querySelector("#clarification")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
        return;
      }

      setInterpretation(data.interpretation);
      setClarification(null);
      setNotice(data.notice ?? null);
      window.requestAnimationFrame(() => document.querySelector("#result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError" && !timedOut) return;
      setInterpretation(null);
      setError(
        timedOut
          ? "꿈풀이를 불러오는 데 시간이 걸리고 있습니다. 잠시 후 다시 시도해 주세요."
          : caught instanceof Error
            ? caught.message
            : "꿈풀이를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      window.clearTimeout(timeout);
      if (requestController.current === controller) setLoading(false);
    }
  }

  function resetDream() {
    requestController.current?.abort();
    setDream("");
    setInterpretation(null);
    setError("");
    setNotice(null);
    setClarification(null);
    window.requestAnimationFrame(() => document.querySelector("#search textarea")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function editDream() {
    setClarification(null);
    setInterpretation(null);
    window.requestAnimationFrame(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        "#search textarea",
      );
      textarea?.scrollIntoView({ behavior: "smooth", block: "center" });
      textarea?.focus({ preventScroll: true });
    });
  }

  function updateDream(value: string) {
    setDream(value);
    if (clarification) setClarification(null);
  }

  return (
    <section aria-labelledby="dream-reading-title" className="relative py-12 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-violet-300/30 to-transparent" />
      <div className="mx-auto mb-7 max-w-3xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-violet-300">DREAM READING</p>
        <h2 id="dream-reading-title" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">기억이 선명할 때, 꿈 이야기를 남겨보세요</h2>
        <p className="mt-4 leading-7 text-slate-400">장면과 인물, 그때 느낀 감정을 함께 적으면 꿈의 흐름을 더 자연스럽게 살펴볼 수 있습니다.</p>
      </div>

      <DreamInput dream={dream} setDream={updateDream} onInterpret={() => void interpretDream()} loading={loading} />

      {error && <p role="alert" className="mx-4 mt-4 max-w-5xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-center text-sm leading-6 text-rose-200 sm:mx-6 lg:mx-auto">{error}</p>}

      <AdPlaceholder placement="input" className="mt-7" />
      {clarification && (
        <DreamClarification
          clarification={clarification}
          loading={loading}
          onConfirm={() => void interpretDream(clarification.key)}
          onEdit={editDream}
        />
      )}
      <DreamResult interpretation={interpretation} onReset={resetDream} />

      {notice && interpretation && <p role="status" className="mx-4 mt-5 max-w-5xl rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-center text-sm leading-6 text-violet-100 sm:mx-6 lg:mx-auto">{notice}</p>}
      {interpretation && <AdPlaceholder placement="result" className="mt-7" />}
    </section>
  );
}
