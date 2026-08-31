import type { DreamInterpretation } from "../types/dream";

type DreamResultProps = { interpretation: DreamInterpretation | null; onReset: () => void };

function Paragraphs({ text }: { text: string }) {
  return <div className="space-y-4">{text.split(/\n\s*\n/gu).filter(Boolean).map((paragraph, index) => (
    <p key={`${index}-${paragraph.slice(0, 24)}`} className="break-words text-[0.95rem] leading-[1.9] text-slate-200 sm:text-base">{paragraph}</p>
  ))}</div>;
}

const sectionClass = "border-t border-white/10 py-7 sm:py-9";

export default function DreamResult({ interpretation, onReset }: DreamResultProps) {
  if (!interpretation) return null;
  const symbols = interpretation.symbols ?? interpretation.keyScenes.map((scene) => ({ symbol: scene.title, generalMeaning: scene.meaning, meaningInThisDream: scene.meaning, connectedMeaning: "" }));
  const integrated = interpretation.integratedMeaning || interpretation.integratedInterpretation;
  const traditional = interpretation.traditionalInterpretation || "전통적인 해몽에서는 꿈에 나온 상징의 방향을 참고해 흐름을 읽습니다. 다만 꿈이 특정한 미래 사건을 확정하는 것은 아닙니다.";
  const psychological = interpretation.psychologicalInterpretation || interpretation.realLifeConnections.join(" ") || "이 꿈은 마음에 남은 감정과 변화의 방향을 비추는 장면으로 읽을 수 있습니다.";

  return <section id="result" aria-live="polite" aria-labelledby="dream-result-title" className="mx-4 mt-8 max-w-[52rem] scroll-mt-5 sm:mx-6 lg:mx-auto">
    <header className="pb-7 sm:pb-9">
      <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">DREAM READING</p>
      <h2 id="dream-result-title" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">{interpretation.title}</h2>
      {interpretation.flowAssessment && <p className="mt-4 inline-flex rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-sm font-semibold text-violet-100">{interpretation.flowAssessment}</p>}
    </header>

    <article className={sectionClass}><h3 className="text-xl font-bold text-white sm:text-2xl">전체 해몽</h3><div className="mt-4"><Paragraphs text={interpretation.overallInterpretation || interpretation.coreConclusion} /></div></article>
    <section className={sectionClass} aria-labelledby="symbols-title">
      <h3 id="symbols-title" className="text-xl font-bold text-white sm:text-2xl">핵심 상징 해석</h3>
      <ol className="mt-5 space-y-7">{symbols.slice(0, 7).map((item, index) => <li key={`${item.symbol}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3">
        <span className="mt-0.5 grid size-8 place-items-center rounded-full bg-violet-400/15 text-sm font-bold text-violet-100">{index + 1}</span>
        <div><h4 className="text-lg font-bold text-white">{item.symbol}</h4><p className="mt-2 text-sm leading-[1.8] text-slate-300 sm:text-base">{item.generalMeaning}</p><p className="mt-2 text-sm leading-[1.8] text-slate-100 sm:text-base">{item.meaningInThisDream}</p>{item.connectedMeaning && <p className="mt-2 text-sm leading-[1.8] text-violet-100/90 sm:text-base">{item.connectedMeaning}</p>}</div>
      </li>)}</ol>
    </section>
    <article className={sectionClass}><h3 className="text-xl font-bold text-white sm:text-2xl">종합 풀이</h3><div className="mt-4"><Paragraphs text={integrated} /></div></article>
    <article className={sectionClass}><h3 className="text-xl font-bold text-white sm:text-2xl">전통적인 해몽</h3><div className="mt-4"><Paragraphs text={traditional} /></div></article>
    <article className={sectionClass}><h3 className="text-xl font-bold text-white sm:text-2xl">심리적인 해석</h3><div className="mt-4"><Paragraphs text={psychological} /></div></article>
    <article className={sectionClass}><h3 className="text-xl font-bold text-white sm:text-2xl">길몽/주의 흐름</h3><div className="mt-4"><Paragraphs text={interpretation.fortuneFlow || "좋고 나쁨을 단정하기보다 꿈의 감정과 마지막 장면이 향한 방향을 중심으로 보는 꿈입니다."} /></div></article>
    <article className="my-7 rounded-2xl border border-violet-300/25 bg-violet-400/[0.08] p-5 sm:my-9 sm:p-7"><h3 className="text-lg font-bold text-white">한 문장 해석</h3><p className="mt-3 text-base font-medium leading-[1.8] text-violet-50 sm:text-lg">{interpretation.oneSentenceSummary || interpretation.coreConclusion}</p></article>
    <aside className="border-t border-white/10 py-6 text-sm leading-[1.8] text-slate-400"><h3 className="font-semibold text-slate-300">참고 안내</h3><p className="mt-1">{interpretation.disclaimer || interpretation.caution}</p></aside>
    <div className="py-7 text-center"><button type="button" onClick={onReset} className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">다른 꿈 풀이하기</button></div>
  </section>;
}
