export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`bd-skeleton ${className}`}
      style={{ width, height, minHeight: height || 16 }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <Skeleton height={40} width={40} className="rounded-xl" />
      <Skeleton height={28} width="60%" />
      <Skeleton height={14} width="40%" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton height={36} width={36} className="rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
