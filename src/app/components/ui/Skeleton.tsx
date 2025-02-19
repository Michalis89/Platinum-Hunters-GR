interface SkeletonProps {
  readonly type?: 'page' | 'grid' | 'card';
  readonly count?: number;
}

export default function Skeleton({ type = 'page', count = 6 }: SkeletonProps) {
  if (type === 'page') {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
        <div className="w-full max-w-3xl animate-pulse rounded-lg bg-gray-900 p-6 shadow-lg">
          <div className="mb-4 flex justify-center">
            <div className="h-48 w-48 rounded-lg bg-gray-700"></div>
          </div>
          <div className="mx-auto h-6 w-3/4 rounded bg-gray-700"></div>
          <div className="mx-auto mt-2 h-4 w-1/2 rounded bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse flex-col items-center rounded-lg bg-gray-700 p-4 shadow-lg"
          >
            <div className="h-40 w-32 rounded-lg bg-gray-600"></div>
            <div className="mt-4 h-4 w-3/4 rounded bg-gray-500"></div>
            <div className="mt-2 h-4 w-1/2 rounded bg-gray-500"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="flex animate-pulse flex-col items-center rounded-lg bg-gray-700 p-4 shadow-lg">
        <div className="h-40 w-32 rounded-lg bg-gray-600"></div>
        <div className="mt-4 h-4 w-3/4 rounded bg-gray-500"></div>
        <div className="mt-2 h-4 w-1/2 rounded bg-gray-500"></div>
      </div>
    );
  }

  return null;
}
