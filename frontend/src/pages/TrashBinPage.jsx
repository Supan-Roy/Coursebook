import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { materialService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { FiTrash2, FiRefreshCw, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function TrashBinPage() {
  const [trashedMaterials, setTrashedMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState(null);
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const profileMenuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadTrashData();
  }, []);

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

  const loadTrashData = async () => {
    try {
      const data = await materialService.getTrash();
      setTrashedMaterials(data);
    } catch (error) {
      console.error('Failed to load trash:', error);
      setToast({ message: 'Failed to load trash bin', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (materialId, filename) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore File',
      message: `Restore "${filename}"? It will be moved back to its original location.`,
      onConfirm: async () => {
        try {
          await materialService.restore(materialId);
          setToast({ message: 'File restored successfully', type: 'success' });
          loadTrashData();
        } catch (error) {
          console.error('Failed to restore material:', error);
          setToast({ message: 'Failed to restore file', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handlePermanentDelete = async (materialId, filename) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete',
      message: `Permanently delete "${filename}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await materialService.permanentDelete(materialId);
          setToast({ message: 'File permanently deleted', type: 'success' });
          loadTrashData();
        } catch (error) {
          console.error('Failed to delete material:', error);
          setToast({ message: 'Failed to delete file', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleEmptyTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Empty Trash Bin',
      message: `Permanently delete all ${trashedMaterials.length} items? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await materialService.emptyTrash();
          setToast({ message: 'Trash bin emptied successfully', type: 'success' });
          loadTrashData();
        } catch (error) {
          console.error('Failed to empty trash:', error);
          setToast({ message: 'Failed to empty trash bin', type: 'error' });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const daysPassed = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📊', pptx: '📊',
      txt: '📃',
      zip: '📦', rar: '📦',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    };
    return iconMap[ext] || '📄';
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0B1120]' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
              <button
                onClick={() => navigate('/dashboard')}
                className={`p-2 rounded-lg transition-all border flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src="/coursebook.svg" alt="Coursebook" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
              <CoursebookTextLogo className="w-36 h-9 sm:w-28 sm:h-7 md:w-40 md:h-10 lg:w-48 lg:h-12 flex-shrink-0" isDarkMode={isDarkMode} showUnderline={false} />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Welcome, <span className="text-sky-300 font-semibold">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Student'}</span></span>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
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
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                >
                  {user?.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-sky-500/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.first_name?.[0] || 'S'}
                    </div>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

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
                            navigate('/settings');
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
                            setShowLogoutConfirm(true);
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🗑️ Trash Bin
              </h1>
              <p className={`text-xs sm:text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Items are automatically removed after 30 days
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`rounded-2xl border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
              <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading trash...</p>
            </div>
          )}

          {!loading && trashedMaterials.length === 0 && (
            <div className={`rounded-xl p-12 text-center border-2 border-dashed ${
              isDarkMode 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-gray-50 border-gray-300'
            }`}>
              <FiTrash2 className={`w-12 h-12 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Trash is Empty
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Deleted files will appear here
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className={`mt-6 px-4 py-2 rounded-lg font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' 
                    : 'bg-sky-500 text-white hover:bg-sky-600'
                }`}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Items Section */}
        {!loading && trashedMaterials.length > 0 && (
          <div className={`mt-8 rounded-xl border p-6 ${
            isDarkMode 
              ? 'bg-gray-900/50 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Items
              </h2>
              {trashedMaterials.length > 0 && (
                <button
                  onClick={handleEmptyTrash}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                  disabled={loading}
                >
                  Empty Trash
                </button>
              )}
            </div>

            <div className="space-y-2">
              {trashedMaterials.map((material) => {
                const daysRemaining = getDaysRemaining(material.deleted_at);
                const isExpiringSoon = daysRemaining <= 7;

                return (
                  <div
                    key={material.id}
                    className={`py-2 border-b transition-all last:border-b-0 ${
                      isDarkMode 
                        ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-900/80' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          <span className="text-xl">{getFileIcon(material.filename)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {material.filename}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className={`${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {formatFileSize(material.size_bytes)}
                            </span>
                            <span className={`flex items-center gap-1 ${
                              isExpiringSoon 
                                ? isDarkMode ? 'text-red-400' : 'text-red-600'
                                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <FiClock className="w-3 h-3" />
                              {daysRemaining}d left
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleRestore(material.id, material.filename)}
                          className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                            isDarkMode 
                              ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' 
                              : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                          }`}
                          title="Restore"
                        >
                          <FiRefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(material.id, material.filename)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isDarkMode 
                              ? 'hover:bg-red-500/20 text-red-400' 
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                          title="Delete permanently"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDarkMode={isDarkMode}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isDarkMode={isDarkMode}
        />
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out of Coursebook?"
        confirmText="Log out"
        type="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/login');
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      </div>
    </div>
  );
}
