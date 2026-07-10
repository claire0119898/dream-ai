type DreamInputProps = {
  dream: string;
  setDream: (value: string) => void;
  onInterpret: () => void;
};

export default function DreamInput({
  dream,
  setDream,
  onInterpret,
}: DreamInputProps) {
  return (
    <section
      id="search"
      className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6"
    >
      <h2 className="text-2xl font-bold text-white">
        꿈 내용을 입력해 주세요
      </h2>

      <p className="mt-2 text-slate-400">
        기억나는 장면, 감정, 장소, 인물을 자세히 적을수록 더 좋은 해몽을 받을 수 있습니다.
      </p>

      <textarea
        value={dream}
        onChange={(e) => setDream(e.target.value)}
        className="mt-5 h-44 w-full resize-none rounded-2xl border border-white/10 bg-[#0b1528] p-4 text-white outline-none placeholder:text-slate-500"
        placeholder="예) 하늘을 날다가 잔잔한 바다 위로 내려왔고 마음이 편안했습니다."
      />

      <button
        onClick={onInterpret}
        className="mt-4 w-full rounded-2xl bg-violet-500 px-6 py-4 font-bold text-white hover:bg-violet-600"
      >
        ✨ 꿈 해몽 보기
      </button>
    </section>
  );
}