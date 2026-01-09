import { useTheme } from '../context/ThemeContext';

export default function UploadQueue({ uploads, onRemove, onCancel }) {
  const { isDarkMode } = useTheme();

  if (!uploads || uploads.length === 0) return null;

  const hasActiveUploads = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

  return (
    <div className={`fixed bottom-2 sm:bottom-4 right-2 sm:right-4 left-2 sm:left-auto w-auto sm:w-full sm:max-w-md z-50 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`rounded-lg sm:rounded-xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-2 sm:px-4 py-2 sm:py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-xs sm:text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Uploading ({uploads.filter(u => u.status === 'uploading' || u.status === 'pending').length})
            </h3>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {hasActiveUploads && (
                <button
                  onClick={() => {
                    uploads.forEach(u => {
                      if (u.status === 'uploading' || u.status === 'pending') {
                        onCancel && onCancel(u.id);
                      }
                    });
                  }}
                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors whitespace-nowrap ${
                    isDarkMode
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  Cancel All
                </button>
              )}
              {uploads.every(u => u.status === 'completed' || u.status === 'error' || u.status === 'cancelled') && (
                <button
                  onClick={() => uploads.forEach(u => onRemove && onRemove(u.id))}
                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors whitespace-nowrap ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="max-h-[200px] sm:max-h-96 overflow-y-auto">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className={`px-2 sm:px-4 py-2 sm:py-3 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                  upload.status === 'completed'
                    ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                    : upload.status === 'error'
                    ? isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                    : upload.status === 'cancelled'
                    ? isDarkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                    : isDarkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'
                }`}>
                  {upload.status === 'completed' ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : upload.status === 'error' ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : upload.status === 'cancelled' ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1 gap-1">
                    <p className={`text-xs sm:text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {upload.filename}
                    </p>
                    {upload.status === 'uploading' && (
                      <span className={`text-[10px] sm:text-xs ml-1 sm:ml-2 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {upload.progress}%
                      </span>
                    )}
                  </div>
                  {upload.status === 'uploading' && (
                    <div className={`w-full h-1 sm:h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDarkMode ? 'bg-sky-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  {upload.status === 'completed' && (
                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      Upload complete
                    </p>
                  )}
                  {upload.status === 'error' && (
                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {upload.error || 'Upload failed'}
                    </p>
                  )}
                  {upload.status === 'cancelled' && (
                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Upload cancelled
                    </p>
                  )}
                </div>
                {upload.status === 'uploading' || upload.status === 'pending' ? (
                  <button
                    onClick={() => onCancel && onCancel(upload.id)}
                    className={`ml-1 sm:ml-2 p-0.5 sm:p-1 rounded transition-colors flex-shrink-0 ${
                      isDarkMode
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    }`}
                    title="Cancel upload"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => onRemove && onRemove(upload.id)}
                    className={`ml-1 sm:ml-2 p-0.5 sm:p-1 rounded transition-colors flex-shrink-0 ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

