import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <Skeleton className="h-8 w-40 mb-4" />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>

      {/* Sections */}
      {['Dominios', 'Metas'].map((section) => (
        <div key={section} className="mb-6">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
