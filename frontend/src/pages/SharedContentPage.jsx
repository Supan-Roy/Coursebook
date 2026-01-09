import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { sharingService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function SharedContentPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (token && !loadingRef.current) {
      console.log('Loading shared content for token:', token);
      loadingRef.current = true;
      loadSharedContent();
    } else if (!token) {
      console.error('No token provided in URL');
      setError('Invalid share link. No token provided.');
      setLoading(false);
    }
  }, [token]);

  const loadSharedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching shared content from API...');
      const data = await sharingService.getSharedContent(token);
      console.log('Shared content loaded:', data);
      console.log('Courses:', data.courses);
      console.log('Materials:', data.materials);
      setShareData(data);
    } catch (err) {
      console.error('Failed to load shared content:', err);
      console.error('Error details:', err.response?.data, err.response?.status);
      if (err.response?.status === 403) {
        setError('This share requires a Coursebook account. Please log in to view.');
      } else if (err.response?.status === 410) {
        setError('This share link has expired.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load shared content. The link may be invalid.');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading shared content...</p>
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

  if (!shareData) {
    return null;
  }

  const { share_link, courses, materials } = shareData;

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
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
              <img src="/coursebook.svg" alt="Coursebook" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
              <CoursebookTextLogo className="w-32 h-8 sm:w-40 sm:h-10 md:w-48 md:h-12 hidden sm:block" isDarkMode={isDarkMode} showUnderline={false} />
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
        <div className={`rounded-2xl p-6 sm:p-8 border mb-6 ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {share_link.title || (share_link.share_type === 'semester' ? share_link.semester_name : 'Shared Course')}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {share_link.share_type === 'semester' ? 'Semester' : 'Course'} shared by {share_link.user?.email || 'a user'}
          </p>
        </div>

        {/* Courses */}
        {courses && courses.length > 0 && (
          <div className={`rounded-2xl p-6 sm:p-8 border mb-6 ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Courses ({courses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => {
                const courseMaterials = materials?.filter(m => {
                  const materialCourseId = m.course_id || m.course;
                  return materialCourseId === course.id;
                }) || [];
                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/shared/${token}/course/${course.id}`)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isDarkMode
                        ? 'border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20'
                        : 'border-sky-200 bg-sky-50 hover:bg-sky-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {course.code || course.title}
                        </h3>
                        {course.title && course.code && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{course.title}</p>
                        )}
                        {course.semester && (
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{course.semester}</p>
                        )}
                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {courseMaterials.length} file{courseMaterials.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(!courses || courses.length === 0) && (
          <div className={`rounded-2xl p-8 border text-center ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No courses available in this share.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

