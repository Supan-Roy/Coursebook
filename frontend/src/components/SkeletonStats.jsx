export default function SkeletonStats({ isDarkMode, className = '' }) {
  const surfaceClass = isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200';
  const blockClass = isDarkMode ? 'bg-gray-700/80' : 'bg-gray-200';

  return (
    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border transition-colors ${surfaceClass} ${className}`}>
      <div className="animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <div className={`h-6 w-36 rounded ${blockClass}`} />
            <div className={`h-4 w-44 mt-2 rounded ${blockClass}`} />
          </div>
          <div className={`h-10 w-16 rounded ${blockClass}`} />
        </div>

        <div className="space-y-3">
          <div className={`w-full rounded-full h-3 ${blockClass}`} />
          <div className="flex justify-between">
            <div className={`h-4 w-20 rounded ${blockClass}`} />
            <div className={`h-4 w-20 rounded ${blockClass}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
