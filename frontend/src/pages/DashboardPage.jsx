import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { courseService, materialService, usageService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import UploadModal from '../components/UploadModal';

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({ code: '', title: '' });
  const [semesterName, setSemesterName] = useState(() => {
    return localStorage.getItem('semesterName') || 'Semester Name';
  });
  const [editingSemester, setEditingSemester] = useState(false);
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // Save semester name to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('semesterName', semesterName);
  }, [semesterName]);

  const loadData = async () => {
    try {
      const [coursesData, materialsData, usageData] = await Promise.all([
        courseService.getAll(),
        materialService.getAll(),
        usageService.get(),
      ]);
      console.log('Courses loaded:', coursesData);
      console.log('Materials loaded:', materialsData);
      console.log('Usage loaded:', usageData);
      setCourses(coursesData);
      setMaterials(materialsData);
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    loadData();
    setShowUploadModal(false);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseService.delete(courseId);
        loadData();
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  const handleDeleteAllCourses = async () => {
    try {
      // Delete all courses
      const deletePromises = courses.map(course => courseService.delete(course.id));
      await Promise.all(deletePromises);
      loadData();
    } catch (error) {
      console.error('Failed to delete courses:', error);
    }
  };

  const handleUpdateCourse = async (courseId) => {
    try {
      await courseService.update(courseId, editFormData);
      setEditingCourse(null);
      setEditFormData({ code: '', title: '' });
      loadData();
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const startEditCourse = (course) => {
    setEditingCourse(course.id);
    setEditFormData({ code: course.code, title: course.title || '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    if (!usage) return 0;
    return (usage.used_bytes / usage.quota_bytes) * 100;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`mt-4 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-20 backdrop-blur-sm transition-colors ${isDarkMode ? 'border-gray-800 bg-black/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/coursebook.svg" alt="Coursebook" className="w-10 h-10" />
              <CoursebookTextLogo className="w-48 h-12" isDarkMode={isDarkMode} showUnderline={false} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Welcome, <span className="text-sky-300 font-semibold">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Student'}</span></span>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all border border-gray-700 hover:border-sky-500/50"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.first_name?.[0] || 'S'}
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.first_name} {user?.last_name}</p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </button>
                      <button
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Navigate to settings (to be implemented)
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storage Usage Card */}
        {usage && (
          <div className={`rounded-2xl p-8 mb-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Storage Usage</h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your account storage capacity</p>
              </div>
              <span className="text-3xl font-bold text-sky-400">{getStoragePercentage().toFixed(0)}%</span>
            </div>
            <div className="space-y-3">
              <div className={`w-full rounded-full h-3 overflow-hidden border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-200 border-gray-300'}`}>
                <div
                  className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-sky-500 to-cyan-400"
                  style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                ></div>
              </div>
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-sky-300 font-semibold">{formatBytes(usage.used_bytes)}</span>
                <span>{formatBytes(usage.quota_bytes)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Courses Section */}
        <div className={`rounded-2xl p-8 mb-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {editingSemester ? (
                  <input
                    type="text"
                    value={semesterName}
                    onChange={(e) => setSemesterName(e.target.value)}
                    onBlur={() => setEditingSemester(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingSemester(false)}
                    autoFocus
                    className={`text-2xl font-bold px-2 py-1 rounded border-2 border-sky-500 ${
                      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                ) : (
                  <h2 
                    className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} cursor-pointer hover:text-sky-400 transition-colors`}
                    onClick={() => setEditingSemester(true)}
                  >
                    {semesterName}
                  </h2>
                )}
                <button
                  onClick={() => setEditingSemester(true)}
                  className={`p-1 rounded hover:bg-sky-500/10 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-sky-400' : 'text-gray-500 hover:text-sky-500'}`}
                  title="Edit semester name"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteAllCourses}
                  className={`p-1 rounded hover:bg-red-500/10 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
                  title="Delete all courses"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and explore your courses</p>
            </div>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20 border border-sky-400/30"
            >
              📄 Upload Routine
            </button>
          </div>

          {courses.length === 0 ? (
            <div className={`text-center py-16 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <svg
                className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className={`mt-4 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No courses yet</h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Add your first course to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`group border rounded-xl p-6 transition-all duration-200 backdrop-blur-sm relative ${isDarkMode ? 'border-gray-700/50 hover:border-sky-500/50 bg-gray-900/50' : 'border-sky-200 hover:border-sky-400 bg-sky-50 shadow-sm'}`}
                >
                  {/* Action buttons */}
                  {editingCourse !== course.id && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditCourse(course)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-sky-500/20 text-gray-400 hover:text-sky-400' 
                            : 'hover:bg-sky-100 text-gray-500 hover:text-sky-600'
                        }`}
                        title="Edit course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' 
                            : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                        }`}
                        title="Delete course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {editingCourse === course.id ? (
                    <div className="mb-4">
                      <input
                        type="text"
                        value={editFormData.code}
                        onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                        placeholder="Course Code"
                        className={`w-full px-3 py-2 mb-2 rounded-lg border-2 text-lg font-bold ${
                          isDarkMode
                            ? 'bg-gray-800 border-sky-500 text-sky-300'
                            : 'bg-white border-sky-400 text-sky-600'
                        }`}
                      />
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="Course Title"
                        className={`w-full px-3 py-2 mb-3 rounded-lg border-2 text-sm ${
                          isDarkMode
                            ? 'bg-gray-800 border-sky-500 text-gray-300'
                            : 'bg-white border-sky-400 text-gray-700'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCourse(course.id)}
                          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-sky-500 hover:bg-sky-600 text-white'
                              : 'bg-sky-500 hover:bg-sky-600 text-white'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCourse(null);
                            setEditFormData({ code: '', title: '' });
                          }}
                          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between mb-4 pr-12">
                      <div className="flex-1">
                        <h3 className={`font-bold text-xl mb-1 ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                          {course.code}
                        </h3>
                        {course.title && (
                          <p className={`text-sm line-clamp-2 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {course.title}
                          </p>
                        )}
                      </div>
                      <div className="text-3xl opacity-40 group-hover:opacity-60 transition-opacity flex-shrink-0">
                        📚
                      </div>
                    </div>
                  )}
                  <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {materials.filter((m) => m.course === course.id).length} {materials.filter((m) => m.course === course.id).length === 1 ? 'file' : 'files'}
                    </span>
                    <button 
                      onClick={() => navigate(`/course/${course.id}`)}
                      className={`flex items-center gap-1 text-xs font-semibold group-hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      View
                      <svg className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Materials */}
        <div className={`rounded-2xl p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Files</h2>

          {materials.length === 0 ? (
            <div className={`text-center py-16 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <svg
                className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className={`mt-4 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No materials yet</h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Upload your first study material</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.slice(0, 5).map((material) => (
                <div
                  key={material.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all group ${isDarkMode ? 'border-gray-700/30 hover:border-sky-500/30 bg-gray-900/30 hover:bg-gray-900/50' : 'border-gray-200 hover:border-sky-500/30 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center group-hover:from-sky-500/40 group-hover:to-cyan-500/40 transition-colors border border-sky-500/20">
                      <svg
                        className="h-5 w-5 text-sky-400 group-hover:text-cyan-300 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{material.filename}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{formatBytes(material.size_bytes)}</p>
                    </div>
                  </div>
                  <a
                    href={material.storage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200 hover:bg-sky-500/10 rounded-lg transition-all border border-sky-500/20 hover:border-sky-500/50"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
