import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { courseService, materialService, preparationService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import PreparationMode from '../components/PreparationMode/PreparationMode';
import Toast from '../components/Toast';
import Sidebar from '../components/Sidebar';
import UploadQueue from '../components/UploadQueue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadAbortControllers, setUploadAbortControllers] = useState(new Map());
  const uploadAbortControllersRef = useRef(new Map());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPreparationMode, setShowPreparationMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [editingSummary, setEditingSummary] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState(new Set());
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const profileMenuRef = useRef(null);
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

  // Hide mobile greeting on very small screens to protect Coursebook logo
  useEffect(() => {
    const checkScreenSize = () => {
      setShowMobileGreeting(window.innerWidth >= 360);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Auto-clear upload queue a short time after all uploads finish
  useEffect(() => {
    if (!uploadQueue || uploadQueue.length === 0) return;

    const allDone = uploadQueue.every(
      (u) => u.status === 'completed' || u.status === 'error'
    );

    if (!allDone) return;

    const timer = setTimeout(() => {
      setUploadQueue([]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [uploadQueue]);

  const loadCourseData = async () => {
    try {
      const [courseData, materialsData, summariesData] = await Promise.all([
        courseService.getById(courseId),
        materialService.getByCourse(courseId),
        preparationService.listSummaries(courseId),
      ]);
      setCourse(courseData);
      setMaterials(materialsData);
      setSummaries(Array.isArray(summariesData) ? summariesData : []);
    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setLoading(false);
    }
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
      setToast({ message: 'Failed to download file', type: 'error' });
    }
  };



  const handleFileUpload = async (event) => {
    let files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Clear file input
    event.target.value = '';

    // Check for files exceeding 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      setAlertDialog({
        isOpen: true,
        title: 'File Size Limit Exceeded',
        message: `The following file(s) exceed the 10MB limit: ${fileNames}\n\nPlease keep file sizes to a maximum of 10MB.`,
        type: 'warning',
      });
      // Only proceed with files that are 10MB or less
      files = files.filter(file => file.size <= MAX_FILE_SIZE);
      if (files.length === 0) return;
    }

    // Initialize upload queue
    const newUploads = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      filename: file.name,
      status: 'pending',
      progress: 0,
      error: null,
      file: file, // Store file reference for cancel
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
    setUploading(true);

    // Upload files sequentially with progress tracking
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = newUploads[i].id;

      // Create abort controller for this upload
      const abortController = new AbortController();
      setUploadAbortControllers(prev => new Map(prev).set(uploadId, abortController));
      uploadAbortControllersRef.current.set(uploadId, abortController);

      try {
        // Update status to uploading
        setUploadQueue(prev =>
          prev.map(u =>
            u.id === uploadId
              ? { ...u, status: 'uploading', progress: 0 }
              : u
          )
        );

        const formData = new FormData();
        formData.append('file', file);
        formData.append('course', courseId);

        // Check if abort signal was already triggered before starting upload
        if (abortController.signal.aborted) {
          continue;
        }

        // Upload with progress tracking and abort signal
        const uploadPromise = materialService.upload(formData, (progressEvent) => {
          // Check if abort signal was triggered during upload
          if (abortController.signal.aborted) {
            // Abort the request if not already aborted
            if (!abortController.signal.aborted) {
              abortController.abort();
            }
            return;
          }
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadQueue(prev =>
              prev.map(u =>
                u.id === uploadId ? { ...u, progress } : u
              )
            );
          }
        }, abortController.signal);

        // Wait for upload, but check for cancellation
        await uploadPromise;

        // Double-check if upload was cancelled before marking as completed
        if (abortController.signal.aborted) {
          console.log('Upload was cancelled, skipping completion');
          continue;
        }

        // Final check - make sure it wasn't cancelled while we were waiting
        const finalCheck = uploadAbortControllersRef.current.get(uploadId);
        if (!finalCheck || finalCheck.signal.aborted) {
          console.log('Upload controller was removed or aborted');
          continue;
        }

        // Mark as completed only if not cancelled
        setUploadQueue(prev => {
          const upload = prev.find(u => u.id === uploadId);
          if (upload && upload.status !== 'cancelled') {
            return prev.map(u =>
              u.id === uploadId
                ? { ...u, status: 'completed', progress: 100 }
                : u
            );
          }
          return prev;
        });
      } catch (error) {
        // Check if upload was cancelled (check abort signal first, then error codes)
        if (abortController.signal.aborted || error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message?.includes('cancel') || error.message?.includes('aborted')) {
          setUploadQueue(prev =>
            prev.map(u =>
              u.id === uploadId
                ? { ...u, status: 'cancelled', error: 'Upload cancelled' }
                : u
            )
          );
          // Clean up abort controller
          uploadAbortControllersRef.current.delete(uploadId);
          setUploadAbortControllers(prev => {
            const newMap = new Map(prev);
            newMap.delete(uploadId);
            return newMap;
          });
          continue;
        }

        console.error('Failed to upload file:', error);

        const errorCode = error.response?.data?.code;
        const errorDetail = error.response?.data?.detail;

        // Mark as error
        setUploadQueue(prev =>
          prev.map(u =>
            u.id === uploadId
              ? { ...u, status: 'error', error: errorDetail || 'Upload failed' }
              : u
          )
        );

        if (errorCode === 'quota_exceeded') {
          // Show quota exceeded dialog with Upgrade option
          setConfirmDialog({
            isOpen: true,
            title: 'Storage limit reached',
            message:
              errorDetail ||
              'You have reached your 500 MB free storage limit. Please delete some files from your courses or Trash Bin, or upgrade your plan for more space.',
            type: 'warning',
            onConfirm: () => {
              navigate('/upgrade');
            },
          });
        } else if (i === 0) {
          // Only show error dialog for first file to avoid spam
          setAlertDialog({
            isOpen: true,
            title: 'Upload Error',
            message: errorDetail || 'Failed to upload some files. Please try again.',
            type: 'error',
          });
        }
      }
    }

    // Clean up abort controllers
    uploadAbortControllersRef.current.clear();
    setUploadAbortControllers(new Map());

    // Reload course data after all uploads complete
    await loadCourseData();
    setUploading(false);
  };

  const removeUpload = (uploadId) => {
    setUploadQueue(prev => prev.filter(u => u.id !== uploadId));
    uploadAbortControllersRef.current.delete(uploadId);
    setUploadAbortControllers(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
  };

  const cancelUpload = (uploadId) => {
    // Abort the upload request FIRST using ref (immediate access, no state delay)
    const abortController = uploadAbortControllersRef.current.get(uploadId);
    if (abortController && !abortController.signal.aborted) {
      console.log('Aborting upload:', uploadId);
      abortController.abort();
    }

    // Update status to cancelled
    setUploadQueue(prev =>
      prev.map(u =>
        u.id === uploadId && (u.status === 'pending' || u.status === 'uploading')
          ? { ...u, status: 'cancelled', error: 'Upload cancelled' }
          : u
      )
    );

    // Remove from ref immediately
    uploadAbortControllersRef.current.delete(uploadId);
    
    // Also update state for cleanup
    setUploadAbortControllers(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
  };

  const handleDeleteMaterial = async (materialId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Move to Trash',
      message: 'Move this file to trash? You can restore it within 30 days from the Trash Bin.',
      onConfirm: async () => {
        try {
          await materialService.delete(materialId);
          setToast({ message: 'File moved to trash', type: 'success' });
          loadCourseData();
        } catch (error) {
          console.error('Failed to delete material:', error);
          setToast({ message: 'Failed to move file to trash', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedMaterials.size;
    setConfirmDialog({
      isOpen: true,
      title: 'Move to Trash',
      message: `Move ${count} file${count > 1 ? 's' : ''} to trash? You can restore them within 30 days from the Trash Bin.`,
      onConfirm: async () => {
        try {
          const deletePromises = Array.from(selectedMaterials).map(id => materialService.delete(id));
          await Promise.all(deletePromises);
          setToast({ message: `${count} file${count > 1 ? 's' : ''} moved to trash`, type: 'success' });
          setSelectedMaterials(new Set());
          setIsSelectionMode(false);
          loadCourseData();
        } catch (error) {
          console.error('Failed to delete materials:', error);
          setToast({ message: 'Failed to move files to trash', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const toggleMaterialSelection = (materialId) => {
    const newSelected = new Set(selectedMaterials);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedMaterials(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMaterials.size === materials.length) {
      setSelectedMaterials(new Set());
    } else {
      setSelectedMaterials(new Set(materials.map(m => m.id)));
    }
  };

  const handleViewSummary = (summary) => {
    setSelectedSummary(summary);
  };

  const handleEditSummary = (summary) => {
    setEditingSummary({ ...summary });
  };

  const handleSaveSummaryEdit = async () => {
    try {
      await preparationService.updateSummary(editingSummary.id, {
        content: editingSummary.content,
        title: editingSummary.title,
      });
      await loadCourseData();
      setEditingSummary(null);
      setToast({ message: 'Summary updated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to update summary:', error);
      setToast({ message: 'Failed to update summary', type: 'error' });
    }
  };

  const handleDeleteSummary = async (summaryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Summary',
      message: 'Are you sure you want to delete this summary? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await preparationService.deleteSummary(summaryId);
          await loadCourseData();
          setSelectedSummary(null);
          setToast({ message: 'Summary deleted successfully', type: 'success' });
        } catch (error) {
          console.error('Failed to delete summary:', error);
          setToast({ message: 'Failed to delete summary', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
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

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      ppt: '📙',
      pptx: '📙',
      xls: '📗',
      xlsx: '📗',
      txt: '📄',
      zip: '📦',
      rar: '📦',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      bmp: '🖼️',
      svg: '🖼️',
      webp: '🖼️',
    };
    return icons[ext] || '📄';
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

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Course not found</h2>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey="dashboard"
        isDarkMode={isDarkMode}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16 ml-0' : 'lg:ml-64 ml-0'}`}>
      {/* Header */}
      <header
        className={`border-b backdrop-blur-sm sticky top-0 z-50 shadow bg-gradient-to-r transition-colors ${
          isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
            : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-16 gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0 overflow-hidden">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                  isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className={`hidden md:flex p-1.5 sm:p-2 rounded-lg transition-all border flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                title="Back to Dashboard"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-[1px] sm:gap-0.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 min-w-0"
                title="Go to Dashboard"
              >
                <img src="/coursebook.svg" alt="Coursebook" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <CoursebookTextLogo className="w-36 h-9 sm:w-28 sm:h-7 md:w-40 md:h-10 lg:w-48 lg:h-12 flex-shrink-0" isDarkMode={isDarkMode} showUnderline={false} />
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
              {/* Mobile greeting - Hidden on very small screens */}
              {showMobileGreeting && (
                <div className={`flex flex-col items-end text-right max-w-[70px] sm:max-w-[80px] md:max-w-[90px] lg:hidden leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                  {(() => {
                    const firstName = user?.first_name || 'User';
                    // Truncate first name to max 10 characters on mobile
                    const truncatedFirstName = firstName.length > 10 ? firstName.substring(0, 8) + '..' : firstName;
                    return (
                      <>
                        <div className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Welcome</div>
                        <div className={`text-[9px] sm:text-[10px] md:text-xs font-semibold truncate ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>{truncatedFirstName}</div>
                      </>
                    );
                  })()}
                </div>
              )}
              <div className="hidden lg:flex flex-col items-end">
                <span className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                  Welcome, <span className={`font-semibold ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Student'}</span>
                </span>
              </div>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg transition-all border flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => navigate('/trash')}
                className={`hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex-shrink-0 ${
                  isDarkMode ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                title="Open Trash Bin"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden md:inline">Trash</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-lg transition-all border flex-shrink-0 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                >
                  {user?.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      alt="Profile"
                      className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-sky-500/50"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg">
                      {user?.first_name?.[0] || 'S'}
                    </div>
                  )}
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    />
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3 md:py-4 lg:py-6 xl:py-8 ${uploadQueue.length > 0 ? 'pb-32 sm:pb-24' : ''} transition-all`}>
        {/* Course Header */}
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8 border bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500`}>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1.5 sm:mb-2 text-white drop-shadow-md break-words`} title={course.code}>
                <span className="hidden md:inline">{course.code}</span>
                <span className="md:hidden">{truncateText(course.code, 10)}</span>
              </h1>
              {course.title && (
                <p className={`text-sm sm:text-base md:text-lg text-white/90 break-words`} title={course.title}>
                  <span className="hidden md:inline">{course.title}</span>
                  <span className="md:hidden">{truncateText(course.title, 50)}</span>
                </p>
              )}
            </div>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
              <path d="M6.5 3H20V21H6.5C5.83696 21 5.20107 20.7366 4.73223 20.2678C4.26339 19.7989 4 19.163 4 18.5V5.5C4 4.83696 4.26339 4.20107 4.73223 3.73223C5.20107 3.26339 5.83696 3 6.5 3Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
              <path d="M9 7H16" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <path d="M9 11H16" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <path d="M9 15H14" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* Upload Button and Preparation Mode */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-wrap gap-2">
          <label className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all cursor-pointer text-sm sm:text-base ${
            uploading 
              ? 'opacity-50 cursor-not-allowed' 
              : isDarkMode 
                ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' 
                : 'bg-sky-500 text-white hover:bg-sky-600'
          }`}>
            <input
              type="file"
              multiple
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg,.gif,.bmp,.svg,.webp"
            />
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {uploading ? 'Uploading...' : 'Upload Material'}
          </label>
          
          <button
            onClick={() => setShowPreparationMode(true)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
              isDarkMode
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
            title="Open Preparation Mode"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-6.002-4.5-10.747-10-10.747z" />
            </svg>
            <span>Preparation</span>
          </button>
        </div>

        {/* Materials List */}
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5 md:mb-6">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Course Materials ({materials.length})
            </h2>
            {!isSelectionMode ? (
              <button
                onClick={() => setIsSelectionMode(true)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors font-medium text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Select
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {selectedMaterials.size === materials.length && materials.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedMaterials.size === 0}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm ${
                    selectedMaterials.size === 0
                      ? isDarkMode
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  Delete ({selectedMaterials.size})
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedMaterials(new Set());
                  }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {materials.length === 0 ? (
            <div className={`text-center py-12 sm:py-16 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <svg
                className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
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
              <h3 className={`mt-3 sm:mt-4 text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No materials yet</h3>
              <p className={`mt-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Upload your first file to get started</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] lg:max-h-[65vh] overflow-y-auto pr-1 sm:pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: isDarkMode ? '#9ca3af transparent' : '#9ca3af transparent' }}>
              {materials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleMaterialSelection(material.id);
                    } else {
                      window.open(`${BACKEND_BASE_URL}/materials/files/${material.id}/`, '_blank');
                    }
                  }}
                  className={`group flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg border transition-all ${
                    isSelectionMode ? 'cursor-pointer' : 'cursor-pointer'
                  } ${
                    isDarkMode 
                      ? selectedMaterials.has(material.id)
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-gray-700/50 hover:border-sky-500/50 bg-gray-900/30 hover:bg-gray-900/50'
                      : selectedMaterials.has(material.id)
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-gray-200 hover:border-sky-400 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0">
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(material.id)}
                        onChange={() => toggleMaterialSelection(material.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded cursor-pointer flex-shrink-0 ${
                          isDarkMode
                            ? 'accent-sky-500 bg-gray-800 border-gray-600'
                            : 'accent-sky-500 bg-white border-gray-300'
                        }`}
                      />
                    )}
                    <span className="text-base sm:text-xl md:text-2xl lg:text-3xl flex-shrink-0">
                      {getFileIcon(material.filename)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} title={material.filename}>
                        <span className="hidden sm:inline">{material.filename}</span>
                        <span className="sm:hidden">{truncateFileName(material.filename, 25)}</span>
                      </p>
                      <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatBytes(material.size_bytes)} • {new Date(material.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!isSelectionMode && (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(material);
                        }}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'hover:bg-sky-500/20 text-gray-400 hover:text-sky-400'
                            : 'hover:bg-sky-100 text-gray-500 hover:text-sky-600'
                        }`}
                        title="Download file"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const shareUrl = `${BACKEND_BASE_URL}/materials/files/${material.id}/`;
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: material.filename,
                                text: `Check out this file: ${material.filename}`,
                                url: shareUrl,
                              });
                            } catch (err) {
                              // User cancelled or share failed - silently handle
                            }
                          }
                          // No clipboard fallback - only use system share dialog
                        }}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'hover:bg-green-500/20 text-gray-400 hover:text-green-400'
                            : 'hover:bg-green-100 text-gray-500 hover:text-green-600'
                        }`}
                        title="Share file"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMaterial(material.id);
                        }}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                            : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                        }`}
                        title="Delete file"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Notes */}
        <div className={`mt-4 sm:mt-6 md:mt-8 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📝 Saved Notes ({summaries.length})
          </h2>

          {summaries.length === 0 ? (
            <div className={`text-center py-12 sm:py-16 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <svg
                className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
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
              <h3 className={`mt-3 sm:mt-4 text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No notes yet</h3>
              <p className={`mt-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Create detailed study notes from your materials in Preparation Mode</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  onClick={() => handleViewSummary(summary)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isDarkMode
                      ? 'border-gray-700 hover:border-sky-500/50 hover:bg-gray-800/50'
                      : 'border-gray-200 hover:border-sky-400/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {summary.title}
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {summary.word_count} words • {new Date(summary.created_at).toLocaleDateString()}
                      </p>
                      <p className={`text-xs mt-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {summary.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSummary(summary);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400'
                            : 'hover:bg-blue-100 text-gray-500 hover:text-blue-600'
                        }`}
                        title="Edit notes"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSummary(summary.id);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDarkMode
                            ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                            : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                        }`}
                        title="Delete summary"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Notes Modal */}
      {selectedSummary && !editingSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'}`} onClick={() => setSelectedSummary(null)} />
          
          <div className={`relative rounded-xl border shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`border-b p-6 sticky top-0 ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedSummary.title}
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedSummary.word_count} words • {new Date(selectedSummary.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await preparationService.downloadSummaryPdf({
                          text: selectedSummary.content,
                          title: selectedSummary.title,
                          courseCode: course.course_code,
                        });
                        setToast({ message: 'PDF downloaded successfully', type: 'success' });
                      } catch (err) {
                        console.error('Failed to download PDF', err);
                        setToast({ message: 'Failed to download PDF', type: 'error' });
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-sky-400'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-sky-600'
                    }`}
                    title="Download as PDF"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedSummary(null)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className={`whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedSummary.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'}`} onClick={() => setEditingSummary(null)} />
          
          <div className={`relative rounded-xl border shadow-2xl max-w-3xl w-full mx-4 ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`border-b p-6 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit Notes
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={editingSummary.title}
                  onChange={(e) => setEditingSummary({ ...editingSummary, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Content
                </label>
                <textarea
                  value={editingSummary.content}
                  onChange={(e) => setEditingSummary({ ...editingSummary, content: e.target.value })}
                  rows={15}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className={`border-t p-4 flex gap-3 justify-end ${isDarkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => setEditingSummary(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSummaryEdit}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white bg-sky-600 hover:bg-sky-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        type={confirmDialog.type || "danger"}
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

      {/* Upload Queue */}
      <UploadQueue uploads={uploadQueue} onRemove={removeUpload} onCancel={cancelUpload} />

      {/* Preparation Mode */}
      {showPreparationMode && (
        <PreparationMode
          materials={materials}
          courseCode={course?.code || 'Course'}
          courseId={course?.id || courseId}
          onClose={() => setShowPreparationMode(false)}
          onSave={loadCourseData}
        />
      )}
      </div>
    </div>
  );
}
