import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import FileUpload from './FileUpload';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { isDarkMode } = useTheme();
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen) return null;

  const handleUploadSuccess = (result) => {
    setUploadResult(result);
    setTimeout(() => {
      onUploadSuccess && onUploadSuccess(result);
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setUploadResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl transition-colors ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Upload Routine PDF
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload your class routine PDF to automatically extract courses
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {uploadResult ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Upload Successful!
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {uploadResult.message}
              </p>
              {uploadResult.courses_created && uploadResult.courses_created.length > 0 && (
                <div className="mt-4">
                  <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    COURSES CREATED:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {uploadResult.courses_created.map((course, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-medium text-sky-300 bg-sky-500/20 rounded-full border border-sky-500/30"
                      >
                        {course.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          )}
        </div>

        {/* Footer */}
        {!uploadResult && (
          <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              💡 Tip: The system will automatically scan your routine PDF and create course folders for each subject found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
