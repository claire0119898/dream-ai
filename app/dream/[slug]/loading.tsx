export default function DreamDetailLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050b18] px-4 py-12 sm:px-6" aria-busy="true" aria-label="꿈풀이를 불러오는 중">
      <div className="mx-auto max-w-6xl">
        <div className="skeleton h-4 w-40 rounded-full" />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div><div className="skeleton h-12 max-w-md rounded-2xl" /><div className="skeleton mt-5 h-24 rounded-2xl" /></div>
          <div className="skeleton h-64 rounded-[2rem]" />
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3"><div className="skeleton h-48 rounded-3xl lg:col-span-2" /><div className="skeleton h-48 rounded-3xl" /></div>
      </div>
    </main>
  );
}
