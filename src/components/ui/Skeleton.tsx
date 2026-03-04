'use client';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/60 ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBox className="h-24" />
        <SkeletonBox className="h-24" />
        <SkeletonBox className="h-24" />
        <SkeletonBox className="h-24" />
      </div>
      {/* Chart */}
      <SkeletonBox className="h-72" />
      {/* Volume chart */}
      <SkeletonBox className="h-56" />
      {/* PR + Weakness */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SkeletonBox className="h-48" />
        <SkeletonBox className="h-48" />
      </div>
      {/* Recent sessions */}
      <SkeletonBox className="h-64" />
    </div>
  );
}

export function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBox className="h-10 w-full" />
      <SkeletonBox className="h-10 w-48" />
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBox key={i} className="h-14" />
      ))}
    </div>
  );
}
