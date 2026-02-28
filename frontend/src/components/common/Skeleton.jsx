export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-pulse bg-gray-800 rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card animate-pulse space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-16" />
      ))}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProposalCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-800 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-32' : 'w-20'} flex-shrink-0`} />
      ))}
    </div>
  );
}
