import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sharingService, courseService, materialService } from '../services';
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
  const [activeMaterialManagerTab, setActiveMaterialManagerTab] = useState('big-files');
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [showMaterialDeleteConfirm, setShowMaterialDeleteConfirm] = useState(false);
  const ACTIVITIES_PER_PAGE = 10;

  useEffect(() => {
    if (isAuthenticated) {
      loadShareLinks();
      loadCourses();
      if (activeWorkspaceTab === 'material-manager') {
        loadMaterials();
      }
    }
  }, [isAuthenticated, activeWorkspaceTab]);

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

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true);
      const allMaterials = await materialService.getAll();
      setMaterials(Array.isArray(allMaterials) ? allMaterials : []);
    } catch (error) {
      console.error('Failed to load materials:', error);
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Analyze big files
  const bigFiles = useMemo(() => {
    const nonDeleted = materials.filter(m => !m.is_deleted);
    const sorted = [...nonDeleted].sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0));
    const limit = materials.length > 20 ? 10 : 5;
    return sorted.slice(0, limit);
  }, [materials]);

  // Detect duplicates
  const duplicates = useMemo(() => {
    const nonDeleted = materials.filter(m => !m.is_deleted);
    const filenameMap = new Map();
    
    nonDeleted.forEach(material => {
      const filename = material.filename?.toLowerCase();
      if (filename) {
        if (!filenameMap.has(filename)) {
          filenameMap.set(filename, []);
        }
        filenameMap.get(filename).push(material);
      }
    });

    const duplicateGroups = [];
    filenameMap.forEach((materials, filename) => {
      if (materials.length > 1) {
        duplicateGroups.push(materials);
      }
    });

    return duplicateGroups;
  }, [materials]);

  const totalDuplicateCount = useMemo(() => {
    return duplicates.reduce((sum, group) => sum + group.length - 1, 0);
  }, [duplicates]);

  // Recent activity
  const activities = useMemo(() => {
    const activityList = [];
    
    // Add material uploads
    materials.forEach(material => {
      if (!material.is_deleted && material.uploaded_at) {
        activityList.push({
          type: 'uploaded',
          material: material,
          timestamp: new Date(material.uploaded_at),
          description: `Uploaded ${material.filename}`
        });
      }
    });

    // Add material deletions (from trash)
    materials.forEach(material => {
      if (material.is_deleted && material.deleted_at) {
        activityList.push({
          type: 'deleted',
          material: material,
          timestamp: new Date(material.deleted_at),
          description: `Deleted ${material.filename}`
        });
      }
    });

    // Add share link creations
    shareLinks.forEach(link => {
      activityList.push({
        type: 'shared',
        link: link,
        timestamp: new Date(link.created_at),
        description: `Shared ${link.share_type === 'semester' ? link.semester_name : 'course'}`
      });
    });

    // Sort by timestamp (newest first)
    activityList.sort((a, b) => b.timestamp - a.timestamp);
    
    return activityList;
  }, [materials, shareLinks]);

  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * ACTIVITIES_PER_PAGE;
    const end = start + ACTIVITIES_PER_PAGE;
    return activities.slice(start, end);
  }, [activities, activityPage]);

  const totalActivityPages = Math.ceil(activities.length / ACTIVITIES_PER_PAGE);

  const handleDeleteMaterial = (materialId) => {
    setMaterialToDelete(materialId);
    setShowMaterialDeleteConfirm(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      await materialService.delete(materialToDelete);
      setShowMaterialDeleteConfirm(false);
      setMaterialToDelete(null);
      await loadMaterials();
      await loadShareLinks(); // Refresh to update activity
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? (course.code || course.title || 'Unknown Course') : 'Unknown Course';
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
              onClick={() => setActiveWorkspaceTab('material-manager')}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeWorkspaceTab === 'material-manager'
                  ? isDarkMode
                    ? 'text-sky-400 border-sky-400'
                    : 'text-sky-600 border-sky-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Material Manager
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
            <div className={`rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
              {/* Material Manager Sub-tabs */}
              <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex gap-1 px-4 pt-2">
                  <button
                    onClick={() => setActiveMaterialManagerTab('big-files')}
                    className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                      activeMaterialManagerTab === 'big-files'
                        ? isDarkMode
                          ? 'text-sky-400 border-sky-400'
                          : 'text-sky-600 border-sky-600'
                        : isDarkMode
                        ? 'text-gray-400 border-transparent hover:text-gray-300'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    Delete Big Files
                  </button>
                  <button
                    onClick={() => setActiveMaterialManagerTab('duplicates')}
                    className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 relative ${
                      activeMaterialManagerTab === 'duplicates'
                        ? isDarkMode
                          ? 'text-sky-400 border-sky-400'
                          : 'text-sky-600 border-sky-600'
                        : isDarkMode
                        ? 'text-gray-400 border-transparent hover:text-gray-300'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    Duplicate Detection
                    {totalDuplicateCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {totalDuplicateCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveMaterialManagerTab('activity')}
                    className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                      activeMaterialManagerTab === 'activity'
                        ? isDarkMode
                          ? 'text-sky-400 border-sky-400'
                          : 'text-sky-600 border-sky-600'
                        : isDarkMode
                        ? 'text-gray-400 border-transparent hover:text-gray-300'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    Recent Activity
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {materialsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    {/* Delete Big Files Tab */}
                    {activeMaterialManagerTab === 'big-files' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Large Files
                          </h3>
                          {bigFiles.length > 0 && (
                            <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              {bigFiles.length} suggested
                            </span>
                          )}
                        </div>
                        {bigFiles.length > 0 ? (
                          <div className="space-y-2">
                            {bigFiles.map((material) => (
                              <div
                                key={material.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {material.filename}
                                  </p>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {getCourseName(material.course)} • {formatBytes(material.size_bytes)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteMaterial(material.id)}
                                  className={`ml-4 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    isDarkMode
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }`}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No large files found.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Duplicate Detection Tab */}
                    {activeMaterialManagerTab === 'duplicates' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Duplicate Files
                          </h3>
                        </div>
                        {duplicates.length > 0 ? (
                          <div className="space-y-4">
                            {duplicates.map((group, idx) => {
                              // Check if duplicates are in same course or different courses
                              const courseIds = [...new Set(group.map(m => m.course))];
                              const isSameCourse = courseIds.length === 1;
                              
                              return (
                                <div key={idx} className={`rounded-lg p-4 border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {group.length} duplicate{group.length > 1 ? 's' : ''} found: <span className="font-normal text-xs">{group[0]?.filename || 'Unknown'}</span>
                                    </p>
                                    {!isSameCourse && (
                                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                                        Multiple locations
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {group.map((material) => (
                                      <div
                                        key={material.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {material.filename}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
                                              📁 {getCourseName(material.course)}
                                            </span>
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                              • {formatBytes(material.size_bytes)}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteMaterial(material.id)}
                                          className={`ml-3 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                            isDarkMode
                                              ? 'bg-red-600 hover:bg-red-700 text-white'
                                              : 'bg-red-500 hover:bg-red-600 text-white'
                                          }`}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No duplicate files found.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recent Activity Tab */}
                    {activeMaterialManagerTab === 'activity' && (
                      <div>
                        <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Recent Activity
                        </h3>
                        {paginatedActivities.length > 0 ? (
                          <>
                            <div className="space-y-2 mb-4">
                              {paginatedActivities.map((activity, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-start gap-3 p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    activity.type === 'uploaded'
                                      ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                                      : activity.type === 'deleted'
                                      ? isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                                      : isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {activity.type === 'uploaded' ? (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                    ) : activity.type === 'deleted' ? (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {activity.description}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {activity.timestamp.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {totalActivityPages > 1 && (
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                  disabled={activityPage === 1}
                                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    activityPage === 1
                                      ? isDarkMode
                                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : isDarkMode
                                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  }`}
                                >
                                  Previous
                                </button>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Page {activityPage} of {totalActivityPages}
                                </span>
                                <button
                                  onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                                  disabled={activityPage === totalActivityPages}
                                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    activityPage === totalActivityPages
                                      ? isDarkMode
                                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : isDarkMode
                                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  }`}
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No recent activity.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
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

      {/* Delete Share Link Confirmation */}
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

      {/* Delete Material Confirmation */}
      <ConfirmDialog
        isOpen={showMaterialDeleteConfirm}
        title="Move to Trash"
        message="Move this file to trash? You can restore it within 30 days from the Trash Bin."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteMaterial}
        onCancel={() => {
          setShowMaterialDeleteConfirm(false);
          setMaterialToDelete(null);
        }}
      />
    </div>
  );
}

