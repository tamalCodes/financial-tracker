export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <main className="w-full max-w-2xl px-6 py-16 text-center space-y-6">
        <h1 className="text-3xl font-semibold text-slate-900">
          Next app scaffolded
        </h1>
        <p className="text-slate-600">
          Start by wiring the dashboard route.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-white font-medium hover:bg-slate-800 transition-colors"
        >
          Go to dashboard
        </a>
      </main>
    </div>
  );
}
