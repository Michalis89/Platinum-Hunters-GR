interface SkeletonProps {
  readonly type?: "page" | "grid" | "card";
  readonly count?: number;
}

export default function Skeleton({ type = "page", count = 6 }: SkeletonProps) {
  if (type === "page") {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
        <div className="max-w-3xl w-full bg-gray-900 p-6 rounded-lg shadow-lg animate-pulse">
          <div className="flex justify-center mb-4">
            <div className="w-48 h-48 bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-6 bg-gray-700 w-3/4 mx-auto rounded"></div>
          <div className="h-4 bg-gray-700 w-1/2 mx-auto rounded mt-2"></div>
        </div>
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="p-4 bg-gray-700 rounded-lg shadow-lg animate-pulse flex flex-col items-center"
          >
            <div className="w-32 h-40 bg-gray-600 rounded-lg"></div>
            <div className="w-3/4 h-4 bg-gray-500 rounded mt-4"></div>
            <div className="w-1/2 h-4 bg-gray-500 rounded mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="p-4 bg-gray-700 rounded-lg shadow-lg animate-pulse flex flex-col items-center">
        <div className="w-32 h-40 bg-gray-600 rounded-lg"></div>
        <div className="w-3/4 h-4 bg-gray-500 rounded mt-4"></div>
        <div className="w-1/2 h-4 bg-gray-500 rounded mt-2"></div>
      </div>
    );
  }

  return null;
}
