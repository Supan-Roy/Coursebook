import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { courseService, materialService, usageService, semesterService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import UploadModal from '../components/UploadModal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import TodoList from '../components/TodoList';
import DocumentToPDF from '../components/Toolkit/DocumentToPDF';
import AddPageNumbers from '../components/Toolkit/AddPageNumbers';
import MergePDFs from '../components/Toolkit/MergePDFs';
import { SplitPDF } from '../components/Toolkit/SplitPDF';
import SecurePDF from '../components/Toolkit/SecurePDF';
import CompressPDF from '../components/Toolkit/CompressPDF';
import { FaFileImport, FaHashtag, FaObjectGroup, FaCut, FaLock, FaCompress } from 'react-icons/fa';

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({ code: '', title: '' });
  const [editingSemester, setEditingSemester] = useState(null);
  const [editingSemesterName, setEditingSemesterName] = useState('');
  const [addingCourseToSemester, setAddingCourseToSemester] = useState(null);
  const [newCourseData, setNewCourseData] = useState({ code: '', title: '' });
  const [creatingNewSemester, setCreatingNewSemester] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showDocumentToPDF, setShowDocumentToPDF] = useState(false);
  const [showAddPageNumbers, setShowAddPageNumbers] = useState(false);
  const [showMergePDFs, setShowMergePDFs] = useState(false);
  const [showSplitPDF, setShowSplitPDF] = useState(false);
  const [showSecurePDF, setShowSecurePDF] = useState(false);
  const [showCompressPDF, setShowCompressPDF] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Load active tab from localStorage, default to 'semesters'
    return localStorage.getItem('dashboardActiveTab') || 'semesters';
  });
  const [semesterOrder, setSemesterOrder] = useState(() => {
    // Load semester order from localStorage
    return JSON.parse(localStorage.getItem('semesterOrder') || '[]');
  });
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Persist active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);

  // Persist semester order to localStorage
  useEffect(() => {
    localStorage.setItem('semesterOrder', JSON.stringify(semesterOrder));
  }, [semesterOrder]);

  // Auto-initialize semester order if not set
  useEffect(() => {
    if (courses.length > 0 || semesters.length > 0) {
      const semesterNames = new Set();
      const groupedBySemester = courses.reduce((acc, course) => {
        const semester = course.semester || 'Unnamed Semester';
        if (!acc[semester]) {
          acc[semester] = [];
        }
        acc[semester].push(course);
        return acc;
      }, {});
      
      Object.keys(groupedBySemester).forEach(sem => semesterNames.add(sem));
      semesters.forEach(sem => semesterNames.add(sem.name));
      
      const allSemesters = Array.from(semesterNames);
      
      // Find new semesters (not in current order)
      const newSemesters = allSemesters.filter(sem => !semesterOrder.includes(sem));
      const existingSemesters = semesterOrder.filter(sem => allSemesters.includes(sem));
      
      // New semesters go to the beginning, existing maintain their order
      if (newSemesters.length > 0) {
        const newOrder = [...newSemesters.sort().reverse(), ...existingSemesters];
        setSemesterOrder(newOrder);
      }
    }
  }, [courses, semesters]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const coursesData = await courseService.getAll();
      console.log('Courses loaded:', coursesData);
      setCourses(coursesData);
      
      const materialsData = await materialService.getAll();
      console.log('Materials loaded:', materialsData);
      setMaterials(materialsData);
      
      const usageData = await usageService.get();
      console.log('Usage loaded:', usageData);
      setUsage(usageData);
      
      // Fetch semesters separately - don't fail dashboard if this fails
      try {
        const semestersData = await semesterService.getAll();
        console.log('Semesters loaded:', semestersData);
        setSemesters(semestersData);
      } catch (semesterError) {
        console.warn('Failed to load semesters:', semesterError);
        setSemesters([]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    loadData();
    setShowUploadModal(false);
  };



  // Group courses by semester
  const groupedBySemester = courses.reduce((acc, course) => {
    const semester = course.semester || 'Unnamed Semester';
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(course);
    return acc;
  }, {});

  // Merge database semesters with course-based semesters
  const semesterNames = new Set();
  
  // Add semesters from courses
  Object.keys(groupedBySemester).forEach(sem => semesterNames.add(sem));
  
  // Add semesters from database that don't have courses yet
  semesters.forEach(sem => semesterNames.add(sem.name));
  
  // Create semester list with custom ordering
  let semesterList = Array.from(semesterNames);
  
  // Sort by custom order if available, otherwise use newest first
  if (semesterOrder.length > 0) {
    semesterList.sort((a, b) => {
      const indexA = semesterOrder.indexOf(a);
      const indexB = semesterOrder.indexOf(b);
      if (indexA === -1) return 1; // Unknown items go to end
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } else {
    // Default: newest first (alphabetical reverse)
    semesterList = semesterList.sort().reverse();
  }

  const handleDeleteCourse = async (courseId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await courseService.delete(courseId);
          loadData();
        } catch (error) {
          console.error('Failed to delete course:', error);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleDeleteAllCourses = async (semesterName) => {
    const courseCount = (groupedBySemester[semesterName] || []).length;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Semester',
      message: courseCount > 0 
        ? `Are you sure you want to delete ${semesterName} and all ${courseCount} course${courseCount === 1 ? '' : 's'}? This action cannot be undone.`
        : `Are you sure you want to delete ${semesterName}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Use the semester delete endpoint which handles both semester and its courses
          await semesterService.delete(semesterName);
          loadData();
        } catch (error) {
          console.error('Failed to delete semester:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete semester',
            type: 'error'
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleMoveSemesterUp = (semesterName) => {
    const currentIndex = semesterOrder.indexOf(semesterName);
    if (currentIndex > 0) {
      const newOrder = [...semesterOrder];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      setSemesterOrder(newOrder);
    }
  };

  const handleMoveSemesterDown = (semesterName) => {
    const currentIndex = semesterOrder.indexOf(semesterName);
    if (currentIndex < semesterOrder.length - 1) {
      const newOrder = [...semesterOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setSemesterOrder(newOrder);
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

  const handleCreateNewSemester = async () => {
    if (!newSemesterName.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter a semester name',
        type: 'warning'
      });
      return;
    }

    try {
      // Create a blank semester without any courses
      await semesterService.create({
        name: newSemesterName.trim(),
      });
      setCreatingNewSemester(false);
      setNewSemesterName('');
      
      // Add new semester to the beginning of the order
      setSemesterOrder([newSemesterName.trim(), ...semesterOrder]);
      
      loadData();
    } catch (error) {
      console.error('Failed to create semester:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to create semester',
        type: 'error'
      });
    }
  };

  const handleAddNewCourse = async (semesterName) => {
    if (!newCourseData.code.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter a course code',
        type: 'warning'
      });
      return;
    }

    try {
      await courseService.create({
        code: newCourseData.code.toUpperCase().trim(),
        title: newCourseData.title.trim(),
        semester: semesterName,
      });
      setAddingCourseToSemester(null);
      setNewCourseData({ code: '', title: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create course:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to create course',
        type: 'error'
      });
    }
  };

  const handleUpdateSemesterName = async (oldName) => {
    if (!editingSemesterName.trim()) {
      setEditingSemester(null);
      return;
    }
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/courses/update-semester/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          old_semester: oldName,
          new_semester: editingSemesterName.trim(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        setAlertDialog({
          isOpen: true,
          title: 'Error',
          message: error.detail || 'Failed to update semester name',
          type: 'error'
        });
        return;
      }
      
      setEditingSemester(null);
      loadData();
    } catch (error) {
      console.error('Failed to update semester name:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update semester name',
        type: 'error'
      });
    }
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
          {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            Reload Page
          </button>
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
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome, <span className={`font-semibold ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Student'}</span></span>
              
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

      {/* Secondary Navigation */}
      <div className={`border-b sticky top-16 z-10 backdrop-blur-sm transition-colors ${isDarkMode ? 'border-gray-800 bg-black/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('semesters')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'semesters'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Semesters
              </div>
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'todos'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Todo List
              </div>
            </button>
            <button
              onClick={() => setActiveTab('toolkit')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'toolkit'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Toolkit
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'todos' ? (
          <TodoList isDarkMode={isDarkMode} />
        ) : activeTab === 'toolkit' ? (
          <div>
            {/* Toolkit Section */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Toolkit</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Convert files and secure your documents with our powerful tools.</p>
            </div>

            {/* Toolkit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* PDF Converter */}
              <div 
                onClick={() => setShowDocumentToPDF(true)}
                className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <FaFileImport className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Document to PDF</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Convert Word, Excel, PowerPoint and more to PDF</p>
              </div>

              {/* Add Page Numbers */}
              <div 
                onClick={() => setShowAddPageNumbers(true)}
                className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <FaHashtag className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Page Numbers</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add customizable page numbers to your PDF</p>
              </div>

              {/* PDF Merger */}
              <div 
                onClick={() => setShowMergePDFs(true)}
                className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FaObjectGroup className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Merge PDFs</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Combine multiple PDF files into one</p>
              </div>

              {/* Password Protect PDF */}
              <div 
                onClick={() => setShowSecurePDF(true)}
                className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <FaLock className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Secure PDF</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Lock your PDFs with password protection</p>
              </div>

              {/* PDF Splitter */}
              <div 
                onClick={() => setShowSplitPDF(true)}
                className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <FaCut className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Split PDF</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Extract specific pages from your PDF</p>
              </div>

              {/* PDF Compressor */}
              <div 
                onClick={() => setShowCompressPDF(true)}
                className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <FaCompress className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Compress PDF</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reduce PDF file size while maintaining quality</p>
              </div>
            </div>

            {/* Coming Soon Message */}
            <div className={`mt-12 p-8 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'border-gray-700/50 bg-gray-900/30' : 'border-gray-300 bg-gray-50'}`}>
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Toolkit Features Coming Soon</h3>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Click on any tool above to explore its features when available</p>
            </div>
          </div>
        ) : (
          <>
        {/* Create New Semester Section */}
        <div className={`rounded-2xl p-8 mb-8 border-2 border-dashed transition-colors ${isDarkMode ? 'border-gray-700/50 hover:border-sky-500/50 bg-gray-900/30' : 'border-gray-300 hover:border-sky-400 bg-gray-50'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Semester Button */}
            {creatingNewSemester ? (
              <div className={`border rounded-xl p-6 transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New Semester</h3>
                <input
                  type="text"
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  placeholder="Enter semester name (e.g., Fall 2024)"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewSemester();
                    } else if (e.key === 'Escape') {
                      setCreatingNewSemester(false);
                      setNewSemesterName('');
                    }
                  }}
                  className={`w-full px-3 py-2 mb-3 rounded-lg border-2 text-sm ${
                    isDarkMode
                      ? 'bg-gray-900 border-sky-500 text-white'
                      : 'bg-white border-sky-400 text-gray-900'
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateNewSemester()}
                    className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors text-white bg-sky-500 hover:bg-sky-600`}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setCreatingNewSemester(false);
                      setNewSemesterName('');
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
              <button
                onClick={() => setCreatingNewSemester(true)}
                className={`border-2 rounded-xl p-6 transition-all flex flex-col items-center justify-center hover:shadow-xl hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500' : 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-400'}`}
              >
                <svg className="w-8 h-8 mb-2 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-semibold text-white drop-shadow-md">
                  Create New Semester
                </p>
                <p className="text-xs mt-1 text-white/90">
                  Create blank semester manually
                </p>
              </button>
            )}

            {/* Upload Routine Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className={`border-2 rounded-xl p-6 transition-all flex flex-col items-center justify-center hover:shadow-xl hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500' : 'bg-gradient-to-br from-purple-400 to-purple-500 border-purple-400'}`}
            >
              <svg className="w-8 h-8 mb-2 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-semibold text-white drop-shadow-md">
                Upload Routine
              </p>
              <p className="text-xs mt-1 text-white/90">
                Extract courses from PDF or Image
              </p>
            </button>
          </div>
        </div>

        {/* Semesters Section */}
        {semesterList.length === 0 ? (
          <div className={`rounded-2xl p-8 mb-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
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
              <h3 className={`mt-4 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No semesters yet</h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Upload a routine to create your first semester</p>
            </div>
          </div>
        ) : (
          semesterList.map((semesterName) => (
            <div 
              key={semesterName}
              className={`rounded-2xl p-8 mb-8 border transition-all hover:shadow-lg ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                      {editingSemester === semesterName ? (
                        <input
                          type="text"
                          value={editingSemesterName}
                          onChange={(e) => setEditingSemesterName(e.target.value)}
                          onBlur={() => handleUpdateSemesterName(semesterName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            handleUpdateSemesterName(semesterName);
                          } else if (e.key === 'Escape') {
                            setEditingSemester(null);
                          }
                        }}
                        autoFocus
                        className={`text-2xl font-bold px-2 py-1 rounded border-2 border-sky-500 ${
                          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                        }`}
                      />
                    ) : (
                      <h2 
                        className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} cursor-pointer hover:text-sky-400 transition-colors`}
                        onClick={() => {
                          setEditingSemester(semesterName);
                          setEditingSemesterName(semesterName);
                        }}
                      >
                        {semesterName}
                      </h2>
                    )}
                    <button
                      onClick={() => {
                        setEditingSemester(semesterName);
                        setEditingSemesterName(semesterName);
                      }}
                      className={`p-1 rounded hover:bg-sky-500/10 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-sky-400' : 'text-gray-500 hover:text-sky-500'}`}
                      title="Edit semester name"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteAllCourses(semesterName)}
                      className={`p-1 rounded hover:bg-red-500/10 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
                      title="Delete all courses in this semester"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveSemesterUp(semesterName)}
                      disabled={semesterOrder.indexOf(semesterName) === 0}
                      className={`p-1 rounded transition-colors ${semesterOrder.indexOf(semesterName) === 0 ? 'opacity-40 cursor-not-allowed' : `hover:bg-sky-500/10 ${isDarkMode ? 'text-gray-400 hover:text-sky-400' : 'text-gray-500 hover:text-sky-500'}`}`}
                      title="Move semester up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveSemesterDown(semesterName)}
                      disabled={semesterOrder.indexOf(semesterName) === semesterOrder.length - 1}
                      className={`p-1 rounded transition-colors ${semesterOrder.indexOf(semesterName) === semesterOrder.length - 1 ? 'opacity-40 cursor-not-allowed' : `hover:bg-sky-500/10 ${isDarkMode ? 'text-gray-400 hover:text-sky-400' : 'text-gray-500 hover:text-sky-500'}`}`}
                      title="Move semester down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {(groupedBySemester[semesterName] || []).length} {(groupedBySemester[semesterName] || []).length === 1 ? 'course' : 'courses'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(groupedBySemester[semesterName] || []).map((course, index) => (
                  <div
                    key={course.id}
                    onClick={() => editingCourse !== course.id && navigate(`/course/${course.id}`)}
                    className={`group border-2 rounded-xl p-6 transition-all duration-200 relative shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer min-h-[180px] flex flex-col ${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500' : 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500'}`}
                  >
                    {/* Action buttons */}
                  {editingCourse !== course.id && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditCourse(course);
                        }}
                        className="p-1.5 rounded-lg transition-colors bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                        title="Edit course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="p-1.5 rounded-lg transition-colors bg-white/20 hover:bg-red-500/80 text-white backdrop-blur-sm"
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
                        className="w-full px-3 py-2 mb-2 rounded-lg border-2 border-white/30 bg-white/90 text-lg font-bold text-gray-900 placeholder-gray-500"
                      />
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="Course Title"
                        className="w-full px-3 py-2 mb-3 rounded-lg border-2 border-white/30 bg-white/90 text-sm text-gray-900 placeholder-gray-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCourse(course.id)}
                          className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors bg-white text-gray-900 hover:bg-gray-100"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCourse(null);
                            setEditFormData({ code: '', title: '' });
                          }}
                          className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors bg-black/20 text-white hover:bg-black/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4 pr-16">
                        <div className="flex-1 mr-2">
                          <h3 className="font-bold text-2xl mb-2 text-white drop-shadow-md">
                            {course.code}
                          </h3>
                          {course.title && (
                            <p className="text-base line-clamp-2 leading-relaxed text-white/90">
                              {course.title}
                            </p>
                          )}
                        </div>
                        <svg className="flex-shrink-0 group-hover:scale-110 transition-transform ml-2" width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                          <path d="M6.5 3H20V21H6.5C5.83696 21 5.20107 20.7366 4.73223 20.2678C4.26339 19.7989 4 19.163 4 18.5V5.5C4 4.83696 4.26339 4.20107 4.73223 3.73223C5.20107 3.26339 5.83696 3 6.5 3Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                          <path d="M9 7H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                          <path d="M9 11H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                        </svg>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/20 mt-auto">
                        <span className="text-sm font-medium text-white/80">
                          {materials.filter((m) => m.course === course.id).length} {materials.filter((m) => m.course === course.id).length === 1 ? 'file' : 'files'}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-semibold text-white/80">
                          View
                          <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                ))}

                {/* Add Course Card */}
                {addingCourseToSemester === semesterName ? (
                  <div className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${isDarkMode ? 'border-gray-700 bg-gray-900/30 hover:border-sky-500/50 hover:bg-gray-900/50' : 'border-gray-300 bg-gray-50 hover:border-sky-400 hover:bg-gray-100'}`}>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newCourseData.code}
                        onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value })}
                        placeholder="Course Code (e.g., CSE313)"
                        autoFocus
                        className={`w-full px-3 py-2 rounded-lg border-2 text-lg font-bold ${
                          isDarkMode
                            ? 'bg-gray-800 border-sky-500 text-sky-300'
                            : 'bg-white border-sky-400 text-sky-600'
                        }`}
                      />
                      <input
                        type="text"
                        value={newCourseData.title}
                        onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                        placeholder="Course Title (optional)"
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                          isDarkMode
                            ? 'bg-gray-800 border-sky-500 text-gray-300'
                            : 'bg-white border-sky-400 text-gray-700'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddNewCourse(semesterName)}
                          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-sky-500 hover:bg-sky-600 text-white'
                              : 'bg-sky-500 hover:bg-sky-600 text-white'
                          }`}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingCourseToSemester(null);
                            setNewCourseData({ code: '', title: '' });
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
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCourseToSemester(semesterName)}
                    className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center h-full hover:shadow-md ${
                      isDarkMode 
                        ? 'border-gray-700 hover:border-sky-500/50 bg-gray-900/20 hover:bg-gray-900/40' 
                        : 'border-gray-300 hover:border-sky-400 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <svg className={`w-8 h-8 mb-2 ${isDarkMode ? 'text-gray-600 group-hover:text-sky-400' : 'text-gray-400 group-hover:text-sky-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400 hover:text-sky-400' : 'text-gray-600 hover:text-sky-600'} transition-colors`}>
                      Add Course
                    </p>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Recent Materials */}
        <div className={`rounded-2xl p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Files</h2>

          {materials.filter(m => {
            const course = courses.find(c => c.id === m.course);
            return course && course.code !== 'ROUTINE';
          }).length === 0 ? (
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
              {materials.filter(m => {
                const course = courses.find(c => c.id === m.course);
                return course && course.code !== 'ROUTINE';
              }).slice(0, 5).map((material) => (
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
        </>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t mt-12 transition-colors ${isDarkMode ? 'border-gray-800 bg-gray-950/50' : 'border-gray-200 bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/coursebook.svg" alt="Coursebook" className="w-10 h-10" />
                <CoursebookTextLogo className="w-48 h-12" isDarkMode={isDarkMode} showUnderline={false} />
              </div>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your all-in-one academic companion for organizing courses, managing study materials, and tracking your academic journey.
              </p>
              <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                © 2026 Coursebook. All rights reserved.
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/privacy-policy')}
                    className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/terms-of-service')}
                    className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/cookie-policy')}
                    className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact & Developer Info */}
            <div>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Connect</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://github.com/Supan-Roy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    Supan-Roy
                  </a>
                </li>
                <li>
                  <a 
                    href="https://linkedin.com/in/supanroy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    /supanroy
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:contact@supanroy.com"
                    className={`flex items-center gap-2 text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    contact@supanroy.com
                  </a>
                </li>
              </ul>
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Developed by <span className="text-sky-400 font-semibold">Supan Roy</span>
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Visit: <a 
                    href="https://supanroy.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    supanroy.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        type="danger"
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />

      {/* Document to PDF Modal */}
      {showDocumentToPDF && (
        <DocumentToPDF onClose={() => setShowDocumentToPDF(false)} />
      )}

      {/* Add Page Numbers Modal */}
      {showAddPageNumbers && (
        <AddPageNumbers onClose={() => setShowAddPageNumbers(false)} />
      )}

      {/* Merge PDFs Modal */}
      {showMergePDFs && (
        <MergePDFs onClose={() => setShowMergePDFs(false)} />
      )}

      {/* Split PDF Modal */}
      {showSplitPDF && (
        <SplitPDF onClose={() => setShowSplitPDF(false)} />
      )}

      {/* Secure PDF Modal */}
      {showSecurePDF && (
        <SecurePDF onClose={() => setShowSecurePDF(false)} />
      )}

      {/* Compress PDF Modal */}
      {showCompressPDF && (
        <CompressPDF onClose={() => setShowCompressPDF(false)} />
      )}
    </div>
  );
}