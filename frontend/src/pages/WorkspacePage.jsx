import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sharingService, courseService } from '../services';
import ShareDialog from '../components/ShareDialog';
import ConfirmDialog from '../components/ConfirmDialog';

export default function WorkspacePage({ isDarkMode: propIsDarkMode }) {
  const { isAuthenticated, user } = useAuth();
  const { isDarkMode: themeIsDarkMode } = useTheme();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : themeIsDarkMode;
  
  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDialogType, setShareDialogType] = useState(null); // 'semester' or 'course'
  const [shareDialogData, setShareDialogData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('my-shares');
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadShareLinks();
      loadCourses();
    }
  }, [isAuthenticated]);

  const loadShareLinks = async () => {
    try {
      setLoading(true);
      const data = await sharingService.getAll();
      setShareLinks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load share links:', error);
      setShareLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await courseService.getAll();
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      
      // Extract unique semesters
      const semesterSet = new Set();
      coursesData.forEach(course => {
        if (course.semester) semesterSet.add(course.semester);
      });
      setSemesters(Array.from(semesterSet).sort());
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleShare = (type, data) => {
    setShareDialogType(type);
    setShareDialogData(data);
    setShowShareDialog(true);
  };

  const handleShareSuccess = () => {
    setShowShareDialog(false);
    loadShareLinks();
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    try {
      await sharingService.delete(linkToDelete);
      setShowDeleteConfirm(false);
      setLinkToDelete(null);
      loadShareLinks();
    } catch (error) {
      console.error('Failed to delete share link:', error);
    }
  };

  const handlePrivacyChange = async (linkId, newPrivacy) => {
    try {
      await sharingService.updatePrivacy(linkId, newPrivacy);
      loadShareLinks();
    } catch (error) {
      console.error('Failed to update privacy:', error);
    }
  };

  const copyToClipboard = async (text, linkId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinkId(linkId);
      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getShareUrl = (link) => {
    // Return the appropriate URL based on privacy setting
    if (link.privacy === 'coursebook_users') {
      return link.coursebook_share_url || `${link.share_url}?type=coursebook`;
    }
    return link.share_url;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-2xl p-8 border text-center ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Workspace</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to access your workspace and share your study materials
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Workspace</h1>
        <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Share your semesters, courses, and materials with others
        </p>
      </div>

      {/* Workspace Tabs */}
      <div className={`rounded-2xl border mb-6 ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
        {/* Tab Navigation */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-1 px-4 pt-2">
            <button
              onClick={() => setActiveWorkspaceTab('my-shares')}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeWorkspaceTab === 'my-shares'
                  ? isDarkMode
                    ? 'text-sky-400 border-sky-400'
                    : 'text-sky-600 border-sky-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Sharing Room
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('demo')}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeWorkspaceTab === 'demo'
                  ? isDarkMode
                    ? 'text-sky-400 border-sky-400'
                    : 'text-sky-600 border-sky-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Demo
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeWorkspaceTab === 'my-shares' ? (
            <>
              {/* Share Options */}
              <div className={`rounded-xl p-6 mb-6 border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Share with Others</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Share Semester */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                    <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Share Semester</h3>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Share all courses and materials in a semester
                    </p>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleShare('semester', { semester_name: e.target.value });
                          e.target.value = '';
                        }
                      }}
                      className={`w-full px-4 py-3 text-sm border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDarkMode 
                          ? 'bg-gray-900/70 border-gray-600 text-white hover:border-gray-500 focus:border-sky-500' 
                          : 'bg-white border-gray-400 text-gray-900 hover:border-gray-500 focus:border-sky-500'
                      }`}
                    >
                      <option value="" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Select a semester...</option>
                      {semesters.map(sem => (
                        <option key={sem} value={sem} className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>{sem}</option>
                      ))}
                    </select>
                  </div>

                  {/* Share Course */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                    <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Share Course</h3>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Share a specific course and all its materials
                    </p>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const course = courses.find(c => c.id === e.target.value);
                          if (course) {
                            handleShare('course', { course_id: course.id, course_name: course.code || course.title });
                            e.target.value = '';
                          }
                        }
                      }}
                      className={`w-full px-4 py-3 text-sm border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        isDarkMode 
                          ? 'bg-gray-900/70 border-gray-600 text-white hover:border-gray-500 focus:border-sky-500' 
                          : 'bg-white border-gray-400 text-gray-900 hover:border-gray-500 focus:border-sky-500'
                      }`}
                    >
                      <option value="" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Select a course...</option>
                      {courses.map(course => {
                        const displayName = course.code && course.title 
                          ? `${course.code} - ${course.title}`
                          : course.code || course.title || 'Untitled Course';
                        return (
                          <option key={course.id} value={course.id} className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                            {displayName} {course.semester ? `(${course.semester})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* My Shares */}
              <div>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Shares</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </div>
        ) : shareLinks.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No shared links yet. Share a semester or course to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map(link => (
              <div
                key={link.id}
                className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {link.title}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {link.share_type === 'semester' ? 'Semester' : 'Course'} • 
                      {link.shared_courses_count} course(s) • {link.shared_materials_count} file(s) • 
                      <span className={`inline-flex items-center px-2 py-0.5 ml-1 rounded text-xs font-medium ${
                        isDarkMode 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        Opened {link.access_count || 0} time{link.access_count !== 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLinkToDelete(link.id);
                      setShowDeleteConfirm(true);
                    }}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                    title="Delete share link"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Share Link */}
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Share Link:
                    </span>
                    <input
                      type="text"
                      value={getShareUrl(link)}
                      readOnly
                      className={`flex-1 px-3 py-1.5 text-xs border rounded-lg ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    <button
                      onClick={() => copyToClipboard(getShareUrl(link), link.id)}
                      className={`p-1.5 rounded-lg transition-all duration-200 relative ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} ${
                        copiedLinkId === link.id 
                          ? (isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600')
                          : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                      }`}
                      title={copiedLinkId === link.id ? "Copied!" : "Copy link"}
                    >
                      {copiedLinkId === link.id ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Privacy Control */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Privacy:
                  </span>
                  <select
                    value={link.privacy}
                    onChange={(e) => handlePrivacyChange(link.id, e.target.value)}
                    className={`px-2.5 py-1 text-xs border rounded transition-all focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      isDarkMode 
                        ? 'bg-gray-900/70 border-gray-600 text-white hover:border-gray-500 focus:border-sky-500' 
                        : 'bg-white border-gray-400 text-gray-900 hover:border-gray-500 focus:border-sky-500'
                    }`}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="public" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Public - Anyone with the link</option>
                    <option value="coursebook_users" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Coursebook Users Only</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
              </div>
            </>
          ) : (
            <div className={`rounded-xl p-8 border text-center ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Demo content coming soon...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          type={shareDialogType}
          data={shareDialogData}
          onSuccess={handleShareSuccess}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Share Link"
        message="Are you sure you want to delete this share link? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteLink}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setLinkToDelete(null);
        }}
      />
    </div>
  );
}

