export default function SkeletonCard({ isDarkMode, variant = 'course', className = '' }) {
  const surfaceClass = isDarkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-gray-100 border-gray-200';
  const blockClass = isDarkMode ? 'bg-gray-700/80' : 'bg-gray-200';

  if (variant === 'semester') {
    return (
      <div className={`rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-6 mb-2.5 sm:mb-3 md:mb-4 lg:mb-6 border ${surfaceClass} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <div className={`h-7 sm:h-8 w-44 rounded ${blockClass}`} />
              <div className={`h-4 w-24 mt-2 rounded ${blockClass}`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-8 w-8 rounded-lg ${blockClass}`} />
              <div className={`h-8 w-8 rounded-lg ${blockClass}`} />
              <div className={`h-8 w-8 rounded-lg ${blockClass}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 w-full">
            <SkeletonCard isDarkMode={isDarkMode} variant="course" />
            <SkeletonCard isDarkMode={isDarkMode} variant="course" className="hidden sm:flex" />
            <SkeletonCard isDarkMode={isDarkMode} variant="course" className="hidden lg:flex" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'recent-file') {
    return (
      <div className={`flex items-center justify-between p-2 sm:p-3 md:p-4 border rounded-lg ${surfaceClass} ${className}`}>
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 animate-pulse">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg ${blockClass}`} />
          <div className="flex-1 min-w-0">
            <div className={`h-4 w-44 max-w-full rounded ${blockClass}`} />
            <div className={`h-3 w-16 mt-2 rounded ${blockClass}`} />
          </div>
        </div>
        <div className={`ml-2 sm:ml-3 w-14 sm:w-16 h-7 rounded-lg ${blockClass}`} />
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[105px] sm:min-h-[115px] md:min-h-[130px] lg:min-h-[150px] flex flex-col ${isDarkMode ? 'bg-blue-700/40 border-blue-500/50' : 'bg-blue-100 border-blue-300'} ${className}`}>
      <div className="animate-pulse flex-1 flex flex-col">
        <div className={`h-6 w-24 rounded ${isDarkMode ? 'bg-blue-200/30' : 'bg-blue-300/70'}`} />
        <div className={`h-4 w-36 mt-3 rounded ${isDarkMode ? 'bg-blue-200/20' : 'bg-blue-300/50'}`} />
        <div className={`h-4 w-28 mt-2 rounded ${isDarkMode ? 'bg-blue-200/20' : 'bg-blue-300/50'}`} />
        <div className={`h-3 w-16 mt-auto pt-3 rounded ${isDarkMode ? 'bg-blue-200/20' : 'bg-blue-300/50'}`} />
      </div>
    </div>
  );
}
