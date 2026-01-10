import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { sharingService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function SharedCourseDetailPage() {
  const { token, courseId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (token && courseId) {
      loadSharedContent();
    }
  }, [token, courseId]);

  const loadSharedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sharingService.getSharedContent(token);
      setShareData(data);
      
      // Find the specific course
      const foundCourse = data.courses?.find(c => c.id === courseId);
      if (!foundCourse) {
        setError('Course not found in this share.');
        return;
      }
      setCourse(foundCourse);
      
      // Filter materials for this course
      const courseMaterials = data.materials?.filter(m => {
        const materialCourseId = m.course_id || m.course;
        return materialCourseId === courseId;
      }) || [];
      setMaterials(courseMaterials);
    } catch (err) {
      console.error('Failed to load shared content:', err);
      if (err.response?.status === 403) {
        setError('This share requires a Coursebook account. Please log in to view.');
      } else if (err.response?.status === 410) {
        setError('This share link has expired.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load shared content. The link may be invalid.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const truncateFileName = (filename, maxLength = 25) => {
    if (filename.length <= maxLength) {
      return filename;
    }
    
    // Extract extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension, just truncate
      return filename.substring(0, maxLength - 3) + '...';
    }
    
    const extension = filename.substring(lastDotIndex); // includes the dot
    const nameWithoutExt = filename.substring(0, lastDotIndex);
    
    // Calculate available space: maxLength - extension length - 3 (for "...")
    const availableSpace = maxLength - extension.length - 3;
    
    if (availableSpace <= 0) {
      // Extension is too long, just show extension
      return '...' + extension;
    }
    
    // Truncate name and add ellipsis + extension
    return nameWithoutExt.substring(0, availableSpace) + '...' + extension;
  };

  const handleDownload = async (material) => {
    try {
      const fileUrl = `${BACKEND_BASE_URL}/materials/files/${material.id}/`;
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full rounded-2xl p-8 border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Unable to Load</h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            <div className="flex gap-3 justify-center">
              {error.includes('requires a Coursebook account') && !isAuthenticated && (
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Explore Coursebook
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-sm shadow bg-gradient-to-r transition-colors ${
          isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
            : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate(`/shared/${token}`)}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-0.5 cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
                <img src="/coursebook.svg" alt="Coursebook" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <CoursebookTextLogo className="w-36 h-9 sm:w-28 sm:h-7 md:w-40 md:h-10 lg:w-48 lg:h-12 flex-shrink-0" isDarkMode={isDarkMode} showUnderline={false} />
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-900 border border-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Explore Coursebook</span>
              <span className="sm:hidden">Explore</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className={`rounded-2xl p-6 sm:p-8 border mb-6 ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={course.code || course.title}>
            <span className="hidden md:inline">{course.code || course.title}</span>
            <span className="md:hidden">{truncateText(course.code || course.title, course.code ? 10 : 50)}</span>
          </h1>
          {course.title && course.code && (
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={course.title}>
              <span className="hidden md:inline">{course.title}</span>
              <span className="md:hidden">{truncateText(course.title, 50)}</span>
            </p>
          )}
          {course.semester && (
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} title={course.semester}>
              <span className="hidden md:inline">{course.semester}</span>
              <span className="md:hidden">{truncateText(course.semester, 20)}</span>
            </p>
          )}
        </div>

        {/* Files */}
        {materials.length > 0 ? (
          <div className={`rounded-2xl p-6 sm:p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Files ({materials.length})
            </h2>
            <div className="space-y-2">
              {materials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => window.open(`${BACKEND_BASE_URL}/materials/files/${material.id}/`, '_blank')}
                  className={`p-4 rounded-lg border cursor-pointer ${isDarkMode ? 'border-gray-700 bg-gray-900/30 hover:bg-gray-900/50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} transition-colors`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      }`}>
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={material.filename}>
                          <span className="hidden sm:inline truncate">{material.filename}</span>
                          <span className="sm:hidden">{truncateFileName(material.filename, 25)}</span>
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatBytes(material.size_bytes)} • {new Date(material.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`${BACKEND_BASE_URL}/materials/files/${material.id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors font-semibold text-sm text-center ${
                          isDarkMode
                            ? 'bg-white hover:bg-gray-100 text-black'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                        style={{ 
                          color: isDarkMode ? '#000000' : '#ffffff', 
                          fontWeight: '600'
                        }}
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDownload(material)}
                        className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
                          isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
                        }`}
                        title="Download file"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl p-8 border text-center ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No files available in this course.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

