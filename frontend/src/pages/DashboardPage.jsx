import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { courseService, materialService, usageService, semesterService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import UploadModal from '../components/UploadModal';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import Sidebar from '../components/Sidebar';
import MyPlans from '../components/TodoList';
import WorkspacePage from './WorkspacePage';
import ProgressPage from './ProgressPage';
import DocumentToPDF from '../components/Toolkit/DocumentToPDF';
import AddPageNumbers from '../components/Toolkit/AddPageNumbers';
import MergePDFs from '../components/Toolkit/MergePDFs';
import { SplitPDF } from '../components/Toolkit/SplitPDF';
import SecurePDF from '../components/Toolkit/SecurePDF';
import CompressPDF from '../components/Toolkit/CompressPDF';
import ImagesToPDF from '../components/Toolkit/ImagesToPDF';
import WatermarkPDF from '../components/Toolkit/WatermarkPDF';
import EditPDF from '../components/Toolkit/EditPDF';
import { FaFileImport, FaHashtag, FaObjectGroup, FaCut, FaLock, FaCompress, FaImages, FaTint, FaEdit } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);``
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
  const [showImagesToPDF, setShowImagesToPDF] = useState(false);
  const [showWatermarkPDF, setShowWatermarkPDF] = useState(false);
  const [showEditPDF, setShowEditPDF] = useState(false);
  const profileMenuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const semesterInputRef = useRef(null);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const deletionTimeoutRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // On mobile, always start with sidebar hidden (collapsed=true)
    // On desktop, use localStorage value
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile) {
        return true; // Hidden on mobile by default
      }
    }
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const { logout, user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    // Load active tab from localStorage
    const saved = localStorage.getItem('dashboardActiveTab');
    if (saved) return saved;
    // Default to semesters for everyone
    return 'semesters';
  });
  
  // Update active tab when authentication changes (only if needed)
  useEffect(() => {
    // Keep current tab, don't force change
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);
  const [semesterOrder, setSemesterOrder] = useState(() => {
    // Load semester order from localStorage
    return JSON.parse(localStorage.getItem('semesterOrder') || '[]');
  });
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Persist active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);

  // Persist sidebar state to localStorage (only on desktop)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (!isMobile) {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
      }
    }
  }, [sidebarCollapsed]);

  // Close profile menu on outside click
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

  // Close search modal on ESC key
  useEffect(() => {
    if (!showSearchModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showSearchModal]);

  // Cleanup deletion timeout on unmount
  useEffect(() => {
    return () => {
      if (deletionTimeoutRef.current) {
        clearTimeout(deletionTimeoutRef.current);
      }
    };
  }, []);

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
  }, [isAuthenticated]); // Reload data when authentication changes


  const loadData = async () => {
    // For unauthenticated users, just set loading to false
    // They can view the dashboard but can't interact with protected features
    if (!isAuthenticated) {
      setLoading(false);
      setCourses([]);
      setMaterials([]);
      setSemesters([]);
      setUsage(null);
      return;
    }
    
    try {
      setError(null);
      
      // Make all API calls in parallel instead of sequentially
      // This reduces total load time from ~2-3s to ~500-800ms (longest call)
      const [coursesData, materialsData, usageData, semestersResult] = await Promise.allSettled([
        courseService.getAll(),
        materialService.getAll(),
        usageService.get(),
        semesterService.getAll().catch(err => {
          // Don't fail dashboard if semesters fail
          console.warn('Failed to load semesters:', err);
          return [];
        })
      ]);
      
      // Handle courses
      if (coursesData.status === 'fulfilled') {
        console.log('Courses loaded:', coursesData.value);
        setCourses(coursesData.value);
      } else {
        console.error('Failed to load courses:', coursesData.reason);
        setCourses([]);
      }
      
      // Handle materials
      if (materialsData.status === 'fulfilled') {
        console.log('Materials loaded:', materialsData.value);
        setMaterials(materialsData.value);
      } else {
        console.error('Failed to load materials:', materialsData.reason);
        setMaterials([]);
      }
      
      // Handle usage
      if (usageData.status === 'fulfilled') {
        console.log('Usage loaded:', usageData.value);
        setUsage(usageData.value);
      } else {
        console.error('Failed to load usage:', usageData.reason);
        setUsage(null);
      }
      
      // Handle semesters (already handled error in Promise.allSettled)
      if (semestersResult.status === 'fulfilled') {
        console.log('Semesters loaded:', semestersResult.value);
        setSemesters(semestersResult.value);
        
        // Load semester order from backend
        if (semestersResult.value && semestersResult.value.length > 0) {
          // Sort semesters by order field, then extract names
          const sortedSemesters = [...semestersResult.value].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return 0;
          });
          const backendOrder = sortedSemesters.map(s => s.name);
          
          // Merge with course-based semesters
          const courseSemesters = new Set();
          courses.forEach(course => {
            if (course.semester) courseSemesters.add(course.semester);
          });
          
          // Combine backend order with course semesters not in backend
          const allSemesters = new Set([...backendOrder, ...courseSemesters]);
          const finalOrder = [...backendOrder];
          courseSemesters.forEach(sem => {
            if (!backendOrder.includes(sem)) {
              finalOrder.push(sem);
            }
          });
          
          if (finalOrder.length > 0) {
            setSemesterOrder(finalOrder);
          }
        }
      } else {
        setSemesters([]);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const name = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || 'Student';

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const key = `${day}-${month}`;

    const specialDays = {
      '01-01': 'Happy New Year',
      '14-04': 'শুভ নববর্ষ',
      '21-02': 'আন্তর্জাতিক মাতৃভাষা দিবসের শুভেচ্ছা',
      '26-03': 'Happy Independence Day',
      '16-12': 'Happy Victory Day',
    };

    if (specialDays[key]) {
      return `${specialDays[key]}, ${name}!`;
    }

    if (user?.date_of_birth) {
      const [year, monthStr, dayStr] = user.date_of_birth.split('-');
      if (monthStr && dayStr && dayStr.padStart(2, '0') === day && monthStr.padStart(2, '0') === month) {
        return `Happy Birthday, ${name}!`;
      }
    }

    return `Welcome, ${name}`;
  };

  const getFormattedDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    return `${day} ${month}, ${year}`;
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
  // Create a map of semester names to their created_at dates
  const semesterMap = new Map();
  
  // Add semesters from database with their created_at dates
  semesters.forEach(sem => {
    semesterMap.set(sem.name, sem.created_at);
  });
  
  // Add semesters from courses (use the earliest course created_at if not in database)
  Object.keys(groupedBySemester).forEach(semName => {
    if (!semesterMap.has(semName)) {
      // Find the earliest created_at from courses in this semester
      const coursesInSemester = groupedBySemester[semName];
      if (coursesInSemester && coursesInSemester.length > 0) {
        const earliestCourse = coursesInSemester.reduce((earliest, course) => {
          if (!earliest || !course.created_at) return course;
          return new Date(course.created_at) < new Date(earliest.created_at) ? course : earliest;
        }, null);
        if (earliestCourse && earliestCourse.created_at) {
          semesterMap.set(semName, earliestCourse.created_at);
        }
      }
    }
  });
  
  // Create semester list with custom ordering
  let semesterList = Array.from(semesterMap.keys());
  
  // Sort by custom order if available, otherwise use newest first by created_at
  if (semesterOrder.length > 0) {
    semesterList.sort((a, b) => {
      const indexA = semesterOrder.indexOf(a);
      const indexB = semesterOrder.indexOf(b);
      if (indexA === -1) return 1; // Unknown items go to end
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } else {
    // Sort by created_at (newest first), fallback to alphabetical reverse
    semesterList.sort((a, b) => {
      const dateA = semesterMap.get(a);
      const dateB = semesterMap.get(b);
      
      // If both have dates, sort by date (newest first)
      if (dateA && dateB) {
        return new Date(dateB) - new Date(dateA);
      }
      // If only one has a date, prioritize it
      if (dateA && !dateB) return -1;
      if (dateB && !dateA) return 1;
      // If neither has a date, sort alphabetically reverse
      return b.localeCompare(a);
    });
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
        ? `Are you sure you want to delete ${semesterName} and all ${courseCount} course${courseCount === 1 ? '' : 's'}?`
        : `Are you sure you want to delete ${semesterName}?`,
      onConfirm: async () => {
        try {
          // Store semester data for potential undo
          const semesterData = {
            name: semesterName,
            courses: (groupedBySemester[semesterName] || []).map(course => ({
              id: course.id,
              code: course.code,
              title: course.title,
              semester: course.semester,
              folder_slug: course.folder_slug
            })),
            semesterRecord: semesters.find(s => s.name === semesterName)
          };

          // Hide semester from UI immediately
          setPendingDeletion(semesterData);

          // Clear any existing timeout
          if (deletionTimeoutRef.current) {
            clearTimeout(deletionTimeoutRef.current);
          }

          // Delete after 5 seconds if not undone
          deletionTimeoutRef.current = setTimeout(async () => {
            try {
          await semesterService.delete(semesterName);
              setPendingDeletion(null);
          loadData();
        } catch (error) {
          console.error('Failed to delete semester:', error);
              setPendingDeletion(null);
              setAlertDialog({
                isOpen: true,
                title: 'Error',
                message: 'Failed to delete semester',
                type: 'error'
              });
            }
          }, 5000);
        } catch (error) {
          console.error('Failed to prepare deletion:', error);
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

  const handleUndoDelete = () => {
    if (!pendingDeletion) return;

    // Clear the deletion timeout - this prevents the actual deletion
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current);
      deletionTimeoutRef.current = null;
    }

    // Since we haven't actually deleted from backend yet, just clear the pending state
    // The semester will reappear when we reload data
    setPendingDeletion(null);
    
    // Update semester order to restore the semester's position
    if (!semesterOrder.includes(pendingDeletion.name)) {
      // Restore to original position if possible, or add to beginning
      setSemesterOrder(prev => {
        const index = prev.indexOf(pendingDeletion.name);
        if (index === -1) {
          // Wasn't in order, add to beginning
          return [pendingDeletion.name, ...prev];
        }
        return prev;
      });
    }
  };

  const syncSemesterOrderToBackend = async (orderArray) => {
    if (!isAuthenticated || !orderArray || orderArray.length === 0) return;
    
    try {
      // Convert order array to format expected by backend
      const semesterOrders = orderArray.map((name, index) => ({
        name: name,
        order: index
      }));
      
      await semesterService.updateOrder(semesterOrders);
    } catch (error) {
      console.error('Failed to sync semester order to backend:', error);
      // Don't show error to user, just log it
    }
  };

  const handleMoveSemesterUp = async (semesterName) => {
    const currentIndex = semesterOrder.indexOf(semesterName);
    if (currentIndex > 0) {
      const newOrder = [...semesterOrder];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      setSemesterOrder(newOrder);
      // Sync to backend
      await syncSemesterOrderToBackend(newOrder);
    }
  };

  const handleMoveSemesterDown = async (semesterName) => {
    const currentIndex = semesterOrder.indexOf(semesterName);
    if (currentIndex < semesterOrder.length - 1) {
      const newOrder = [...semesterOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setSemesterOrder(newOrder);
      // Sync to backend
      await syncSemesterOrderToBackend(newOrder);
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

  // Generate default semester name (Semester 1, Semester 2, etc.)
  const generateDefaultSemesterName = () => {
    try {
      // Get all existing semester names
      const semesterNames = new Set();
      
      // Add semesters from courses
      if (groupedBySemester && typeof groupedBySemester === 'object') {
        Object.keys(groupedBySemester).forEach(sem => {
          if (sem && sem.trim()) {
            semesterNames.add(sem.trim());
          }
        });
      }
      
      // Add semesters from database
      if (Array.isArray(semesters)) {
        semesters.forEach(sem => {
          if (sem && sem.name && sem.name.trim()) {
            semesterNames.add(sem.name.trim());
          }
        });
      }
      
      const allSemesterNames = Array.from(semesterNames);
      
      // Pattern to match "Semester X" where X is a number (case insensitive)
      const semesterPattern = /^Semester\s+(\d+)$/i;
      const existingNumbers = allSemesterNames
        .map(name => {
          const match = String(name).match(semesterPattern);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);
      
      // Find the next available number
      let nextNumber = 1;
      if (existingNumbers.length > 0) {
        nextNumber = Math.max(...existingNumbers) + 1;
      }
      
      const generatedName = `Semester ${nextNumber}`;
      console.log('Generated semester name:', generatedName, 'from existing:', allSemesterNames, 'existing numbers:', existingNumbers);
      return generatedName;
    } catch (error) {
      console.error('Error generating semester name:', error);
      // Fallback to Semester 1 if there's any error
      return 'Semester 1';
    }
  };

  const handleCreateNewSemester = async () => {
    const defaultName = generateDefaultSemesterName();
    console.log('Creating semester with name:', defaultName);

    try {
      // Create a blank semester without any courses
      await semesterService.create({
        name: defaultName,
      });
      setCreatingNewSemester(false);
      setNewSemesterName('');
      
      // Add new semester to the beginning of the order
      setSemesterOrder([defaultName, ...semesterOrder]);
      
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
    // At least one field (code or title) must be filled
    if (!newCourseData.code.trim() && !newCourseData.title.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter either a course code or course title',
        type: 'warning'
      });
      return;
    }

    try {
      const coursePayload = {
        code: newCourseData.code.trim() ? newCourseData.code.toUpperCase().trim() : '',
        title: newCourseData.title.trim() || '',
        semester: semesterName,
      };
      console.log('Creating course with payload:', coursePayload);
      const result = await courseService.create(coursePayload);
      console.log('Course created successfully:', result);
      // Close the form after adding course
      setAddingCourseToSemester(null);
      setNewCourseData({ code: '', title: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create course:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.code?.[0] ||
                          error.response?.data?.title?.[0] ||
                          error.response?.data?.non_field_errors?.[0] ||
                          (typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : null) ||
                          error.message || 
                          'Failed to create course';
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleUpdateSemesterName = async (oldName) => {
    if (!editingSemesterName.trim()) {
      setEditingSemester(null);
      return;
    }
    
    const newName = editingSemesterName.trim();
    
    try {
      const response = await fetch(`${API_BASE_URL}/courses/update-semester/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          old_semester: oldName,
          new_semester: newName,
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
      
      // Update semesterOrder to replace old name with new name in the same position
      setSemesterOrder(prevOrder => {
        const index = prevOrder.indexOf(oldName);
        if (index !== -1) {
          const newOrder = [...prevOrder];
          newOrder[index] = newName;
          return newOrder;
        }
        return prevOrder;
      });
      
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

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Search functionality
  const getSearchResults = () => {
    if (!searchQuery.trim()) return { courses: [], materials: [] };

    const query = searchQuery.toLowerCase().trim();
    const filteredCourses = courses.filter(course => {
      const codeMatch = course.code?.toLowerCase().includes(query);
      const titleMatch = course.title?.toLowerCase().includes(query);
      return codeMatch || titleMatch;
    });

    const filteredMaterials = materials.filter(material => {
      const filenameMatch = material.filename?.toLowerCase().includes(query);
      const course = courses.find(c => c.id === material.course);
      const courseCodeMatch = course?.code?.toLowerCase().includes(query);
      const courseTitleMatch = course?.title?.toLowerCase().includes(query);
      return filenameMatch || courseCodeMatch || courseTitleMatch;
    });

    return { courses: filteredCourses, materials: filteredMaterials };
  };

  const searchResults = getSearchResults();

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
    <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey={activeTab}
        onSelectTab={(key) => {
          if (key === 'dashboard') setActiveTab('semesters');
          else setActiveTab(key);
        }}
        onHelp={() => navigate('/help-support')}
        isDarkMode={isDarkMode}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16 ml-0' : 'lg:ml-64 ml-0'}`}>
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-sm shadow bg-gradient-to-r transition-colors ${
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
                onClick={() => {
                  window.scrollTo(0, 0);
                  loadData();
                }}
                className="flex items-center gap-1.5 sm:gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                title="Reload Dashboard"
              >
                <img src="/coursebook.svg" alt="Coursebook" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <CoursebookTextLogo className="w-36 h-9 sm:w-28 sm:h-7 md:w-40 md:h-10 lg:w-48 lg:h-12 flex-shrink-0" isDarkMode={isDarkMode} showUnderline={false} />
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="hidden lg:flex flex-col items-end">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                {(() => {
                  const greeting = getGreeting();
                  const name = user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.first_name || 'Student';
                  // Desktop: All greetings stay on same line, but make name blue
                  if (greeting.includes(', ')) {
                    const parts = greeting.split(', ');
                    const message = parts.slice(0, -1).join(', ');
                    const hasExclamation = greeting.endsWith('!');
                    return (
                      <>
                        {message}, <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{name}</span>{hasExclamation ? '!' : ''}
                      </>
                    );
                  }
                  // For "Welcome, name" format
                  if (greeting.startsWith('Welcome,')) {
                    return (
                      <>
                        Welcome, <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{name}</span>
                      </>
                    );
                  }
                  return greeting;
                      })()}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {getFormattedDate()}
                    </span>
                  </div>
                  {/* Mobile greeting - Welcome, First Name */}
                  <div className={`text-[10px] sm:text-xs md:text-sm lg:hidden text-right max-w-[80px] sm:max-w-[100px] ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                {(() => {
                  const greeting = getGreeting();
                  const firstName = user?.first_name || 'User';
                  // Mobile: Only split special greetings (not "Welcome")
                  if (greeting.includes(', ') && !greeting.startsWith('Welcome,')) {
                    const parts = greeting.split(', ');
                    const message = parts.slice(0, -1).join(', ');
                    return (
                      <>
                        <div className="leading-tight">
                          <div className="truncate">{message}{greeting.endsWith('!') ? '!' : ''}</div>
                          <div className={`font-semibold truncate ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{firstName}</div>
                        </div>
                      </>
                    );
                  }
                  // Mobile: "Welcome, [name]" stays on same line
                  return <><span>Welcome, <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{firstName}</span></span></>;
                })()}
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
                )}
              </div>
                </>
              ) : (
                <>
                  {/* Theme Toggle for unauthenticated */}
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
                  
                  {/* Login/Signup buttons for unauthenticated users */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => navigate('/login')}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-all"
                    >
                      Sign Up
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation */}
      <div className={`border-b sticky top-16 z-10 backdrop-blur-sm transition-colors ${isDarkMode ? 'border-gray-800 bg-black/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex gap-0.5 sm:gap-1 items-center overflow-x-auto scrollbar-hide -mx-2 sm:-mx-3 md:mx-0 px-2 sm:px-3 md:px-0">
            <button
              onClick={() => setActiveTab('semesters')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-sm md:text-base transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'semesters'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="hidden md:inline">Semesters</span>
                <span className="md:hidden">{activeTab === 'semesters' && 'Semesters'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-sm md:text-base transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'workspace'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden md:inline">Workspace</span>
                <span className="md:hidden">{activeTab === 'workspace' && 'Workspace'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-sm md:text-base transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'todos'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="hidden md:inline">My Plans</span>
                <span className="md:hidden">{activeTab === 'todos' && 'My Plans'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-sm md:text-base transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'progress'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden md:inline">Progress</span>
                <span className="md:hidden">{activeTab === 'progress' && 'Progress'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('toolkit')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-sm md:text-base transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'toolkit'
                  ? isDarkMode
                    ? 'text-blue-400 border-blue-400'
                    : 'text-blue-600 border-blue-600'
                  : isDarkMode
                  ? 'text-gray-400 border-transparent hover:text-gray-300'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="hidden md:inline">PDF Toolkit</span>
                <span className="md:hidden">{activeTab === 'toolkit' && 'PDF Toolkit'}</span>
              </div>
            </button>
            {/* Search Button - Only visible when Semesters tab is active */}
            {activeTab === 'semesters' && (
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className={`ml-auto mr-1 sm:mr-2 md:mr-3 lg:mr-4 px-2 sm:px-2.5 md:px-3 lg:px-4 py-1 sm:py-1.5 font-medium text-[10px] sm:text-xs md:text-sm transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 ${
                  isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800 border-[0.5px] border-gray-700 hover:border-sky-500/50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-[0.5px] border-gray-300 hover:border-sky-500/50'
                }`}
                title="Search courses and materials"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3 md:py-4 lg:py-6 xl:py-8 w-full overflow-x-hidden">
        {activeTab === 'todos' ? (
          <MyPlans isDarkMode={isDarkMode} />
        ) : activeTab === 'workspace' ? (
          <WorkspacePage isDarkMode={isDarkMode} />
        ) : activeTab === 'progress' ? (
          <ProgressPage isDarkMode={isDarkMode} />
        ) : activeTab === 'semesters' ? (
          <>
        {/* Create New Semester Section */}
            <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8 border-2 border-dashed transition-colors ${isDarkMode ? 'border-gray-700/50 hover:border-sky-500/50 bg-gray-900/30' : 'border-gray-300 hover:border-sky-400 bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
            {/* Create Semester Button */}
                  <button
                    onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    handleCreateNewSemester();
                  }}
                  className={`border-2 rounded-xl p-3 sm:p-4 md:p-5 transition-all flex flex-col items-center justify-center hover:shadow-xl hover:scale-[1.02] active:scale-95 min-h-[95px] sm:min-h-[110px] md:min-h-[130px] ${isDarkMode ? 'bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500' : 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-400'}`}
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1.5 sm:mb-2 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                  <p className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow-md text-center">
                  Create New Semester
                </p>
                  <p className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1 text-white/90 text-center">
                    Create your semester manually
                </p>
              </button>

            {/* Upload Routine Button */}
            <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setShowUploadModal(true);
                  }}
                  className={`border-2 rounded-xl p-3 sm:p-4 md:p-5 transition-all flex flex-col items-center justify-center hover:shadow-xl hover:scale-[1.02] active:scale-95 min-h-[95px] sm:min-h-[110px] md:min-h-[130px] ${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500' : 'bg-gradient-to-br from-purple-400 to-purple-500 border-purple-400'}`}
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1.5 sm:mb-2 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
                  <p className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow-md text-center">
                Upload Routine
              </p>
                  <p className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1 text-white/90 text-center">
                Extract courses from PDF or Image
              </p>
            </button>
          </div>
        </div>

        {/* Semesters Section */}
        {semesterList.length === 0 ? (
              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
                <div className={`text-center py-8 sm:py-12 lg:py-16 border-2 border-dashed rounded-lg sm:rounded-xl ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <svg
                    className={`mx-auto h-8 w-8 sm:h-12 sm:w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
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
                  <h3 className={`mt-3 sm:mt-4 text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No semesters yet</h3>
                  <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm px-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Create or Upload a routine to create your first semester</p>
            </div>
          </div>
        ) : (
          semesterList
            .filter(semesterName => !pendingDeletion || pendingDeletion.name !== semesterName)
            .map((semesterName) => (
            <div 
              key={semesterName}
                  className={`rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-6 mb-2.5 sm:mb-3 md:mb-4 lg:mb-6 border transition-all hover:shadow-lg w-full ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                      {editingSemester === semesterName ? (
                        <div className="flex items-center gap-2">
                          <div className="relative inline-block">
                            <span
                              className={`text-lg sm:text-xl lg:text-2xl font-bold px-2 py-1 invisible whitespace-pre absolute ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}
                              aria-hidden="true"
                            >
                              {editingSemesterName || semesterName || ' '}
                            </span>
                        <input
                              ref={semesterInputRef}
                          type="text"
                          value={editingSemesterName}
                          onChange={(e) => setEditingSemesterName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            handleUpdateSemesterName(semesterName);
                          } else if (e.key === 'Escape') {
                            setEditingSemester(null);
                                  setEditingSemesterName('');
                          }
                        }}
                        autoFocus
                              className={`text-lg sm:text-xl lg:text-2xl font-bold px-2 py-1 rounded border-2 border-sky-500 relative ${
                          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                        }`}
                              style={{
                                width: `${Math.max((editingSemesterName || semesterName || '').length * 0.65, 15)}ch`,
                                minWidth: '15ch'
                              }}
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateSemesterName(semesterName);
                            }}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 ${
                              isDarkMode
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title="Save"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSemester(null);
                              setEditingSemesterName('');
                            }}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 ${
                              isDarkMode
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title="Cancel"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                    ) : (
                          <>
                            <h2 
                              className={`text-lg sm:text-lg md:text-xl lg:text-2xl font-bold break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        <span className="hidden md:inline">{semesterName}</span>
                        <span className="md:hidden" title={semesterName}>
                          {truncateText(semesterName, 20)}
                        </span>
                      </h2>
                            {isAuthenticated && (
                    <button
                                onClick={(e) => {
                                  e.stopPropagation();
                        setEditingSemester(semesterName);
                        setEditingSemesterName(semesterName);
                      }}
                                className={`p-1 sm:p-1.5 rounded-lg transition-all flex-shrink-0 ${
                                  isDarkMode
                                    ? 'hover:bg-blue-500/20 text-gray-400 hover:text-blue-400'
                                    : 'hover:bg-blue-100 text-gray-500 hover:text-blue-600'
                                }`}
                      title="Edit semester name"
                    >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                            )}
                          </>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {(groupedBySemester[semesterName] || []).length} {(groupedBySemester[semesterName] || []).length === 1 ? 'course' : 'courses'}
                      </p>
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              navigate('/login');
                              return;
                            }
                            handleMoveSemesterUp(semesterName);
                          }}
                      disabled={semesterOrder.indexOf(semesterName) === 0}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                            semesterOrder.indexOf(semesterName) === 0
                              ? 'opacity-30 cursor-not-allowed'
                              : isDarkMode
                              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}
                      title="Move semester up"
                    >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              navigate('/login');
                              return;
                            }
                            handleMoveSemesterDown(semesterName);
                          }}
                      disabled={semesterOrder.indexOf(semesterName) === semesterOrder.length - 1}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                            semesterOrder.indexOf(semesterName) === semesterOrder.length - 1
                              ? 'opacity-30 cursor-not-allowed'
                              : isDarkMode
                              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}
                      title="Move semester down"
                    >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              navigate('/login');
                              return;
                            }
                            handleDeleteAllCourses(semesterName);
                          }}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                            isDarkMode
                              ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                              : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                          }`}
                          title="Delete semester"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                    )}
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 w-full">
                    {(groupedBySemester[semesterName] || []).map((course) => (
                  <div
                    key={course.id}
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate('/login');
                            return;
                          }
                          if (editingCourse !== course.id) {
                            navigate(`/course/${course.id}`);
                          }
                        }}
                        className={`group border-2 rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-5 transition-all duration-200 relative shadow-lg ${isAuthenticated ? 'hover:shadow-xl hover:scale-[1.02] active:scale-95 cursor-pointer' : 'cursor-not-allowed opacity-60'} min-h-[105px] sm:min-h-[115px] md:min-h-[130px] lg:min-h-[150px] flex flex-col ${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500' : 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500'}`}
                      >
                        {/* Edit/Delete buttons - top right */}
                        {isAuthenticated && (
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                                if (!isAuthenticated) {
                                  navigate('/login');
                                  return;
                                }
                          startEditCourse(course);
                        }}
                              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                        title="Edit course"
                      >
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                                if (!isAuthenticated) {
                                  navigate('/login');
                                  return;
                                }
                          handleDeleteCourse(course.id);
                        }}
                              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-red-500/50 transition-all"
                        title="Delete course"
                      >
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}

                        {/* Course content */}
                  {editingCourse === course.id ? (
                          <div className="flex-1 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editFormData.code}
                        onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                              placeholder="Course code"
                              className="w-full px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-2 border-white/30 focus:border-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                              placeholder="Course title"
                              className="w-full px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-2 border-white/30 focus:border-white focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateCourse(course.id);
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/30 hover:bg-white/40 text-white font-semibold transition-all"
                        >
                          Save
                        </button>
                        <button
                                onClick={(e) => {
                                  e.stopPropagation();
                            setEditingCourse(null);
                            setEditFormData({ code: '', title: '' });
                          }}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                            <h3 className="font-bold text-base sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-1 sm:mb-1.5 md:mb-2 text-white drop-shadow-md break-words" title={course.code}>
                              <span className="hidden md:inline">{course.code}</span>
                              <span className="md:hidden">{truncateText(course.code, 10)}</span>
                            </h3>
                          {course.title && (
                              <p className="text-xs sm:text-xs md:text-sm lg:text-base line-clamp-2 leading-relaxed text-white/90 break-words" title={course.title}>
                                <span className="hidden md:inline">{course.title}</span>
                                <span className="md:hidden">{truncateText(course.title, 50)}</span>
                              </p>
                            )}
                             <div className="flex items-center justify-between pt-2 sm:pt-2.5 md:pt-3 lg:pt-4 border-t border-white/20 mt-auto">
                               <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-medium text-white/80">
                          {materials.filter((m) => m.course === course.id).length} {materials.filter((m) => m.course === course.id).length === 1 ? 'file' : 'files'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                ))}

                    {isAuthenticated && (
                      <div
                        className={`border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 transition-all flex flex-col justify-center items-center gap-3 ${
                          isDarkMode ? 'border-dashed border-gray-700 bg-gray-900/40 hover:border-sky-500/60' : 'border-dashed border-gray-300 bg-gray-50 hover:border-sky-400/60'
                        }`}
                      >
                {addingCourseToSemester === semesterName ? (
                          <div className="w-full space-y-3">
                      <input
                        type="text"
                        value={newCourseData.code}
                        onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value })}
                              placeholder="Course code"
                              className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                          isDarkMode
                                  ? 'bg-gray-900 border-sky-500 text-white placeholder-gray-400'
                                  : 'bg-white border-sky-400 text-gray-900 placeholder-gray-400'
                        }`}
                              autoFocus
                      />
                      <input
                        type="text"
                        value={newCourseData.title}
                        onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                              placeholder="Course title"
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${
                          isDarkMode
                                  ? 'bg-gray-900 border-sky-500 text-white placeholder-gray-400'
                                  : 'bg-white border-sky-400 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddNewCourse(semesterName)}
                                className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors text-white bg-sky-500 hover:bg-sky-600"
                              >
                                Done
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
                ) : (
                  <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                navigate('/login');
                                return;
                              }
                              setAddingCourseToSemester(semesterName);
                              setNewCourseData({ code: '', title: '' });
                            }}
                            className="w-full flex flex-col items-center justify-center gap-2 text-center"
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-600'}`}>
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                            </div>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Course</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add multiple courses quickly</p>
                  </button>
                        )}
                      </div>
                )}
              </div>
            </div>
          ))
        )}
          </>
        ) : activeTab === 'toolkit' ? (
          <div>
            {/* Toolkit Section */}
            <div className="mb-6 sm:mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Toolkit</h1>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Convert files and secure your documents with our powerful tools.</p>
            </div>

            {/* Toolkit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* PDF Converter */}
              <div 
                onClick={() => setShowDocumentToPDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <FaFileImport className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-base sm:text-lg mb-1.5 sm:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Document to PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Convert Word, Excel, PowerPoint and more to PDF</p>
              </div>

              {/* Images to PDF */}
              <div 
                onClick={() => setShowImagesToPDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <FaImages className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Images to PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Combine multiple images into a PDF without extra margins</p>
              </div>

              {/* Add Page Numbers */}
              <div 
                onClick={() => setShowAddPageNumbers(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <FaHashtag className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Page Numbers</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add customizable page numbers to your PDF</p>
              </div>

              {/* PDF Merger */}
              <div 
                onClick={() => setShowMergePDFs(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FaObjectGroup className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Merge PDFs</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Combine multiple PDF files into one</p>
              </div>

              {/* Password Protect PDF */}
              <div 
                onClick={() => setShowSecurePDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <FaLock className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Secure PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Lock your PDFs with password protection</p>
              </div>

              {/* PDF Splitter */}
              <div 
                onClick={() => setShowSplitPDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <FaCut className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Split PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Extract specific pages from your PDF</p>
              </div>

              {/* PDF Compressor */}
              <div 
                onClick={() => setShowCompressPDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <FaCompress className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Compress PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reduce PDF file size while maintaining quality</p>
              </div>

              {/* Watermark PDF */}
              <div 
                onClick={() => setShowWatermarkPDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <FaTint className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Watermark PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add text or image watermarks to protect your documents</p>
              </div>

              {/* Edit / Annotate PDF */}
              <div 
                onClick={() => setShowEditPDF(true)}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all hover:shadow-lg cursor-pointer active:scale-95 hover:border-sky-400 ${isDarkMode ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <FaEdit className="w-6 h-6 text-white" />
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edit PDF</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Annotate, add text, and highlight content</p>
              </div>
            </div>

            {/* Coming Soon Message */}
            <div className={`mt-8 sm:mt-12 p-6 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'border-gray-700/50 bg-gray-900/30' : 'border-gray-300 bg-gray-50'}`}>
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>More Toolkit Features Coming Soon</h3>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Click on any tool above to explore its features when available</p>
            </div>
          </div>
        ) : null}

        {/* Recent Materials & Storage - Only on Semesters tab for authenticated users */}
        {activeTab === 'semesters' && isAuthenticated && (
          <>
            <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-base sm:text-lg font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Files</h2>

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
              {materials
                .filter((m) => {
                  const course = courses.find((c) => c.id === m.course);
                return course && course.code !== 'ROUTINE';
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .map((material) => (
                  <a
                  key={material.id}
                    href={`${BACKEND_BASE_URL}/materials/files/${material.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all group cursor-pointer no-underline ${isDarkMode ? 'border-gray-700/30 hover:border-sky-500/30 bg-gray-900/30 hover:bg-gray-900/50' : 'border-gray-200 hover:border-sky-500/30 bg-gray-50 hover:bg-gray-100'}`}
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
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={material.filename}>
                        <span className="hidden sm:inline truncate">{material.filename}</span>
                        <span className="sm:hidden">{truncateFileName(material.filename, 25)}</span>
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{formatBytes(material.size_bytes)}</p>
                    </div>
                  </div>
                    <span className="ml-3 px-3 py-1.5 text-xs font-semibold text-sky-300 group-hover:text-sky-200 rounded-lg transition-all border border-sky-500/20 group-hover:border-sky-500/50 bg-sky-500/5">
                      View
                    </span>
                  </a>
              ))}
            </div>
          )}
        </div>

        {/* Storage Usage Card */}
        {usage && (
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 mt-4 sm:mt-6 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div>
                <h2 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Storage Usage</h2>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your account storage capacity</p>
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

        {/* Online Compiler CTA - Only in Semesters tab */}
        {activeTab === 'semesters' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className={`rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-95 ${isDarkMode ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 border-emerald-500' : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-emerald-400'}`}>
          <a 
            href="https://compiler.supanroy.com" 
            target="_blank" 
            rel="noopener noreferrer"
                className="block p-4 sm:p-6 lg:p-8 relative group"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/20 text-3xl sm:text-4xl lg:text-6xl font-mono">&lt;/&gt;</div>
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-white/20 text-2xl sm:text-3xl lg:text-4xl font-mono">{ }</div>
            </div>

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              {/* Left Content */}
              <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg">Try Our Online Compiler</h2>
                </div>
                    <p className="text-white/90 text-sm sm:text-base mb-2 drop-shadow">
                  Write, compile, and execute code in multiple languages - C++, Python, Java, JavaScript & more!
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">Interactive Terminal</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">Real-time Output</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">Multi-Language</span>
                </div>
              </div>

              {/* Right CTA Button */}
                  <div className="flex-shrink-0 w-full md:w-auto">
                    <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-white text-emerald-600 font-bold text-sm sm:text-base lg:text-lg shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all flex items-center justify-center gap-2 sm:gap-3">
                  <span>Launch Compiler</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>

          </a>
        </div>
          </div>
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
                © {new Date().getFullYear()} Coursebook. All rights reserved.
              </div>
            </div>

            {/* Quick Links and Connect - Side by side on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-1 md:contents gap-8 md:gap-0">
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
                    onClick={() => navigate('/about')}
                    className={`text-sm hover:text-sky-400 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    About
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

      {/* Images to PDF Modal */}
      {showImagesToPDF && (
        <ImagesToPDF onClose={() => setShowImagesToPDF(false)} />
      )}

      {/* Watermark PDF Modal */}
      {showWatermarkPDF && (
        <WatermarkPDF onClose={() => setShowWatermarkPDF(false)} />
      )}

      {/* Edit PDF Modal */}
      {showEditPDF && (
        <EditPDF onClose={() => setShowEditPDF(false)} />
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out of Coursebook?"
        confirmText="Log out"
        type="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-28 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSearchModal(false);
              setSearchQuery('');
            }
          }}
        >
          <div
            className={`w-full max-w-lg mx-6 sm:mx-8 rounded-lg sm:rounded-xl shadow-2xl border transition-all ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses and materials..."
                  className={`flex-1 bg-transparent outline-none text-sm sm:text-base ${
                    isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearchModal(false);
                      setSearchQuery('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
      </div>
    </div>

            {/* Search Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {!searchQuery.trim() ? (
                <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm">Type to search for courses and materials</p>
                </div>
              ) : searchResults.courses.length === 0 && searchResults.materials.length === 0 ? (
                <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {/* Courses Section */}
                  {searchResults.courses.length > 0 && (
                    <div>
                      <h3 className={`text-xs font-semibold uppercase mb-2 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Courses ({searchResults.courses.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.courses.map((course) => {
                          const courseMaterials = materials.filter(m => m.course === course.id);
                          return (
                            <button
                              key={course.id}
                              onClick={() => {
                                setShowSearchModal(false);
                                setSearchQuery('');
                                navigate(`/course/${course.id}`);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg transition-all ${
                                isDarkMode
                                  ? 'hover:bg-gray-800 border border-gray-700 hover:border-sky-500/50'
                                  : 'hover:bg-gray-50 border border-gray-200 hover:border-sky-500/50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-semibold text-sm ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} title={course.code}>
                                      <span className="hidden md:inline">{course.code}</span>
                                      <span className="md:hidden">{truncateText(course.code, 10)}</span>
                                    </span>
                                    {course.title && (
                                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} title={course.title}>
                                        <span className="hidden md:inline">{course.title}</span>
                                        <span className="md:hidden">{truncateText(course.title, 50)}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {courseMaterials.length} {courseMaterials.length === 1 ? 'file' : 'files'} • {course.semester || 'Unnamed Semester'}
                                  </div>
                                </div>
                                <svg className={`w-5 h-5 flex-shrink-0 ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Materials Section */}
                  {searchResults.materials.length > 0 && (
                    <div>
                      <h3 className={`text-xs font-semibold uppercase mb-2 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Materials ({searchResults.materials.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.materials.map((material) => {
                          const course = courses.find(c => c.id === material.course);
                          return (
                            <button
                              key={material.id}
                              onClick={() => {
                                setShowSearchModal(false);
                                setSearchQuery('');
                                if (course) {
                                  navigate(`/course/${course.id}`);
                                }
                              }}
                              className={`w-full text-left p-2.5 rounded-lg transition-all ${
                                isDarkMode
                                  ? 'hover:bg-gray-800 border border-gray-700 hover:border-sky-500/50'
                                  : 'hover:bg-gray-50 border border-gray-200 hover:border-sky-500/50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={material.filename}>
                                      <span className="hidden sm:inline truncate">{material.filename}</span>
                                      <span className="sm:hidden">{truncateFileName(material.filename, 25)}</span>
                                    </span>
                                  </div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {formatBytes(material.size_bytes)} • {course?.code || 'Unknown Course'}
                                  </div>
                                </div>
                                <svg className={`w-5 h-5 flex-shrink-0 ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Undo Delete Toast */}
      {pendingDeletion && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm rounded-lg border p-4 shadow-lg z-50 ${
            isDarkMode
              ? 'bg-gray-900 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">
                Semester "{pendingDeletion.name}" deleted
              </p>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                You can undo this action
              </p>
            </div>
            <button
              onClick={handleUndoDelete}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-sky-500 text-white hover:bg-sky-600'
                  : 'bg-sky-600 text-white hover:bg-sky-700'
              }`}
            >
              Undo
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}