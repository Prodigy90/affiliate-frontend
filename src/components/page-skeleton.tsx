type PageSkeletonProps = {
  showHeader?: boolean;
  showCards?: boolean;
  cardCount?: number;
};

export function PageSkeleton({
  showHeader = true,
  showCards = false,
  cardCount = 3,
}: PageSkeletonProps) {
  return (
    <div className="space-y-8">
      {showHeader && (
        <section className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800/70" />
          <div className="h-7 w-64 animate-pulse rounded bg-slate-800/70" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-800/60" />
        </section>
      )}
      {showCards && (
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
            />
          ))}
        </section>
      )}
    </div>
  );
}
