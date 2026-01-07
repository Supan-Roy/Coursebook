import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import FileUpload from './FileUpload';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { isDarkMode } = useTheme();
  const [uploadResult, setUploadResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleCourses, setVisibleCourses] = useState([]);

  if (!isOpen) return null;

  const handleUploadSuccess = (result) => {
    setIsProcessing(true);
    setUploadResult(result);
    
    // Animate courses appearing one by one
    if (result.courses_created && result.courses_created.length > 0) {
      result.courses_created.forEach((course, index) => {
        setTimeout(() => {
          setVisibleCourses(prev => [...prev, course]);
        }, index * 150); // 150ms delay between each course
      });

      // Wait for all animations to complete, then close
      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => {
          onUploadSuccess && onUploadSuccess(result);
          handleClose();
        }, 1000);
      }, result.courses_created.length * 150 + 1000);
    } else {
      // No courses, close immediately
      setTimeout(() => {
        setIsProcessing(false);
        onUploadSuccess && onUploadSuccess(result);
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setUploadResult(null);
    setIsProcessing(false);
    setVisibleCourses([]);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
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
              Upload Routine
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload your class routine (PDF or Image) to automatically extract courses
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
            <div className="py-8">
              {isProcessing ? (
                <div className="space-y-6">
                  {/* Processing Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Creating Course Folders...
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {visibleCourses.length} of {uploadResult.courses_created?.length || 0} courses created
                    </p>
                  </div>

                  {/* Animated Course List */}
                  {uploadResult.courses_created && uploadResult.courses_created.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {visibleCourses.map((course, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 transform ${
                            isDarkMode 
                              ? 'bg-gray-800/50 border-gray-700' 
                              : 'bg-sky-50 border-sky-200'
                          } animate-slideInLeft`}
                          style={{ 
                            animationDelay: `${idx * 50}ms`,
                            opacity: 0,
                            animation: 'slideInLeft 0.3s ease-out forwards'
                          }}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDarkMode ? 'bg-sky-500/20' : 'bg-sky-500/20'
                          }`}>
                            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                              {course.code}
                            </p>
                            {course.title && (
                              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {course.title}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    All Done!
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {uploadResult.message}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          )}
        </div>

        {/* Add keyframe animation styles */}
        <style>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        {/* Footer */}
        {!uploadResult && (
          <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              💡 Tip: The system will automatically scan your routine (PDF or Image) and create course folders for each subject found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
