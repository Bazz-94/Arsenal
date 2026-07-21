/** Fallback UI shown while the results page resolves the common-games lookup. */
export default function Loading() {
  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <div className="h-4 w-32 rounded bg-foreground/10" aria-hidden />
        <div className="mt-2 h-8 w-56 rounded bg-foreground/10" aria-hidden />

        <div
          role="status"
          aria-live="polite"
          className="mt-10 flex flex-col items-center gap-3 text-foreground/70"
        >
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60"
            aria-hidden
          />
          <span>Looking up common games…</span>
        </div>
      </div>
    </main>
  );
}
