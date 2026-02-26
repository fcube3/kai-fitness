type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

function safeNextPath(value?: string) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  return value;
}

export default function FitnessLoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams?.error === '1';
  const nextPath = safeNextPath(searchParams?.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md">
        {/* Top accent line */}
        <div className="h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-transparent" />

        <div className="rounded-b-2xl border border-t-0 border-white/10 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-sm">
          {/* App identity */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              {/* Fitness icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15 border border-green-500/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 6.5H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2.5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M17.5 6.5H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2.5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="6.5" y="9" width="11" height="6" rx="1" stroke="#22C55E" strokeWidth="1.5"/>
                  <path d="M6.5 12h11" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Kai Fitness</p>
                <h1 className="text-xl font-bold text-zinc-100 leading-tight">Performance Hub</h1>
              </div>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Track your lifts. Own your progress. No excuses.
            </p>
          </div>

          <form action="/auth" method="post" className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-500/60 focus:ring-2 focus:ring-green-500/20"
              />
            </div>

            {hasError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                <span className="text-rose-400">✕</span>
                <p className="text-sm text-rose-300">Incorrect password. Please try again.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-green-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-green-400 active:scale-[0.98]"
            >
              Enter the hub →
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-700">
            Private · Fitness · Secured
          </p>
        </div>
      </section>
    </main>
  );
}
