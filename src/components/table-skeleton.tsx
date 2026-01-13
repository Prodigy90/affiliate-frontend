type TableSkeletonProps = {
  rows?: number;
  headerWidth?: string;
};

export function TableSkeleton({ rows = 2, headerWidth = "w-32" }: TableSkeletonProps) {
  return (
    <div className="space-y-2">
      <div className={`h-5 ${headerWidth} animate-pulse rounded bg-slate-800/70`} />
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 w-full animate-pulse rounded bg-slate-800/60"
        />
      ))}
    </div>
  );
}
