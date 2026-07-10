type DreamResultProps = {
  result: string;
};

export default function DreamResult({ result }: DreamResultProps) {
  if (!result) {
    return null;
  }

  return (
    <section
      id="result"
      className="mx-auto mt-8 max-w-5xl rounded-3xl border border-violet-400/30 bg-violet-500/10 p-6"
    >
      <h2 className="text-2xl font-bold text-white">해몽 결과</h2>

      <pre className="mt-4 whitespace-pre-wrap leading-8 text-slate-200">
        {result}
      </pre>
    </section>
  );
}