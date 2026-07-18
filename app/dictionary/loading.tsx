export default function DictionaryLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050b18] px-4 py-16 sm:px-6" aria-busy="true" aria-label="꿈 사전을 불러오는 중">
      <div className="mx-auto max-w-6xl">
        <div className="skeleton h-4 w-28 rounded-full" />
        <div className="skeleton mt-8 h-12 max-w-xl rounded-2xl" />
        <div className="skeleton mt-4 h-6 max-w-2xl rounded-xl" />
        <div className="skeleton mt-10 h-44 rounded-3xl" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton h-64 rounded-2xl" />)}
        </div>
      </div>
    </main>
  );
}
