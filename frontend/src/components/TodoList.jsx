import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { todoService, todoCategoryService } from '../services';
import { FiPlus, FiTrash2, FiCheck, FiClock, FiAlertCircle, FiEdit2, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import DateTimePicker from './DateTimePicker';
import notificationService from '../services/notificationService';

const MyPlans = ({ isDarkMode }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const NOTIFICATION_PREF_KEY = 'todo_notifications_enabled';
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Initialize with default categories for unauthenticated users
  const defaultCategories = [
    { id: 1, name: 'Academic' },
    { id: 2, name: 'Personal' }
  ];
  
  // Check authentication from localStorage as fallback for initial state
  const hasToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const isInitiallyAuthenticated = hasToken !== null;
  
  const [categories, setCategories] = useState(() => {
    // Show default categories for unauthenticated users
    if (!isInitiallyAuthenticated) {
      return defaultCategories;
    }
    return [];
  });
  const [activeCategory, setActiveCategory] = useState(() => {
    // Set first default category as active for unauthenticated users
    if (!isInitiallyAuthenticated) {
      return 1; // Academic
    }
    return null;
  });
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: getTodayDate(),
    due_time: '',
    repeat: '',
  });
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: getTodayDate(),
    due_time: '',
    repeat: '',
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [mobileCategoryIndex, setMobileCategoryIndex] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationIntervalRef = useRef(null);
  const sliderRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const isDefaultCategory = (category) => ['Academic', 'Personal'].includes(category.name);

  useEffect(() => {
    // Restore notification preference if permission still granted
    const savedPref = typeof window !== 'undefined' ? localStorage.getItem(NOTIFICATION_PREF_KEY) : null;
    if (savedPref === 'true' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }

    loadData();
    return () => {
      notificationService.clearPeriodicCheck(notificationIntervalRef.current);
    };
  }, []);
  
  // Update categories when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      // Show default categories for unauthenticated users
      setCategories(defaultCategories);
      setActiveCategory(1); // Academic
      setTodos([]);
    } else {
      // Load real data for authenticated users
      loadData();
    }
  }, [isAuthenticated]);

  // Setup notification checking when todos change
  useEffect(() => {
    if (notificationsEnabled && todos.length > 0) {
      // Clear existing interval
      notificationService.clearPeriodicCheck(notificationIntervalRef.current);
      // Set up new interval to check every minute
      notificationIntervalRef.current = notificationService.setupPeriodicCheck(todos, 60);
    } else {
      notificationService.clearPeriodicCheck(notificationIntervalRef.current);
    }
  }, [notificationsEnabled, todos]);

  // Reset mobile category index when categories change or window resizes
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        // Reset to 0 when switching to desktop
        setMobileCategoryIndex(0);
      } else {
        // Ensure index doesn't exceed available categories
        const maxIndex = Math.max(0, categories.length - 2);
        setMobileCategoryIndex(prev => Math.min(prev, maxIndex));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories.length]);

  const toggleNotifications = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (notificationsEnabled) {
      notificationService.clearPeriodicCheck(notificationIntervalRef.current);
      setNotificationsEnabled(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(NOTIFICATION_PREF_KEY);
      }
      return;
    }

    const permission = await notificationService.requestPermission();
    if (permission) {
      setNotificationsEnabled(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(NOTIFICATION_PREF_KEY, 'true');
      }
      notificationService.show('Notifications Enabled', {
        body: 'You will receive notifications for due tasks',
      });
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(NOTIFICATION_PREF_KEY);
    }
  };

  const loadData = async () => {
    // For unauthenticated users, just set loading to false and show default UI
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      const [categoriesData, todosData] = await Promise.all([
        todoCategoryService.getAll(),
        todoService.getAll(),
      ]);
      
      // If authenticated user has no categories, use default categories
      if (categoriesData.length === 0) {
        setCategories(defaultCategories);
        setActiveCategory(1); // Academic
      } else {
        setCategories(categoriesData);
        // Set active category to first one if exists
        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      }
      
      setTodos(todosData);
    } catch (error) {
      console.error('Failed to load data:', error);
      // On error, show default categories for authenticated users too
      if (isAuthenticated) {
        setCategories(defaultCategories);
        setActiveCategory(1); // Academic
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTodos = async () => {
    try {
      const data = await todoService.getAll();
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const todoData = {
        title: newTodo.title,
        description: newTodo.description,
        priority: newTodo.priority,
        due_date: newTodo.due_date || null,
        due_time: newTodo.due_time || null,
        repeat: newTodo.repeat || null,
        category_id: activeCategory,
      };
      const created = await todoService.create(todoData);
      setTodos([created, ...todos]);
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: getTodayDate(), due_time: '', repeat: '' });
      setIsAddingTodo(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      const newCategory = await todoCategoryService.create({ name: newCategoryName });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setShowAddCategory(false);
      // On mobile, scroll to show the newly added category
      if (categories.length >= 2 && typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileCategoryIndex(Math.max(0, categories.length - 1));
      }
      // Scroll to the end to show the newly added category and Add button
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.scrollTo({
            left: sliderRef.current.scrollWidth,
            behavior: 'smooth',
          });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdateCategory = async (categoryId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const category = categories.find((c) => c.id === categoryId);
    if (!category || isDefaultCategory(category)) return;
    if (!editingCategoryName.trim()) return;
    try {
      const updated = await todoCategoryService.update(categoryId, { name: editingCategoryName });
      setCategories(categories.map(c => 
        c.id === categoryId ? updated : c
      ));
      setEditingCategory(null);
      setEditingCategoryName('');
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const category = categories.find((c) => c.id === categoryId);
    if (!category || isDefaultCategory(category)) return;
    try {
      // Remove all todos in this category
      const categoryTodosToDelete = todos.filter(t => t.category_id === categoryId);
      for (const todo of categoryTodosToDelete) {
        await todoService.delete(todo.id);
      }
      setTodos(todos.filter(t => t.category_id !== categoryId));
      
      // Delete the category
      await todoCategoryService.delete(categoryId);
      setCategories(categories.filter(c => c.id !== categoryId));
      
      // Switch to first category if deleted category was active
      if (activeCategory === categoryId) {
        const remainingCategories = categories.filter(c => c.id !== categoryId);
        setActiveCategory(remainingCategories.length > 0 ? remainingCategories[0].id : null);
      }
      setDeleteMode(false);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      if (direction === 'right') {
        // Scroll to the end to show the "Add Category" button
        sliderRef.current.scrollTo({
          left: sliderRef.current.scrollWidth,
          behavior: 'smooth',
        });
      } else {
        sliderRef.current.scrollBy({
          left: -200,
          behavior: 'smooth',
        });
      }
    }
  };

  const scrollMobileCategories = (direction) => {
    if (direction === 'right') {
      // Move to next set of 2 categories, but don't go beyond the end
      const maxIndex = Math.max(0, categories.length - 2);
      setMobileCategoryIndex(prev => Math.min(prev + 1, maxIndex));
    } else {
      // Move to previous set of 2 categories
      setMobileCategoryIndex(prev => Math.max(prev - 1, 0));
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - move to next categories
        scrollMobileCategories('right');
      } else {
        // Swipe right - move to previous categories
        scrollMobileCategories('left');
      }
    }
    
    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const toggleComplete = async (todo) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      const updated = await todoService.update(todo.id, {
        is_completed: !todo.is_completed,
      });
      setTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const deleteTodo = async (id) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await todoService.delete(id);
      setTodos(todos.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEditTodo = (todo) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setEditingTodo(todo.id);
    setEditFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date || '',
      due_time: todo.due_time || '',
      repeat: todo.repeat || '',
    });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      due_time: '',
    });
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!editFormData.title.trim()) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const updated = await todoService.update(editingTodo, {
        title: editFormData.title,
        description: editFormData.description,
        priority: editFormData.priority,
        due_date: editFormData.due_date || null,
        due_time: editFormData.due_time || null,
        repeat: editFormData.repeat || null,
      });
      setTodos(todos.map((t) => (t.id === editingTodo ? updated : t)));
      cancelEdit();
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return isDarkMode ? 'text-red-400 border-red-500' : 'text-red-600 border-red-600';
      case 'medium':
        return isDarkMode ? 'text-yellow-400 border-yellow-500' : 'text-yellow-600 border-yellow-600';
      case 'low':
        return isDarkMode ? 'text-green-400 border-green-500' : 'text-green-600 border-green-600';
      default:
        return isDarkMode ? 'text-gray-400 border-gray-500' : 'text-gray-600 border-gray-600';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FiAlertCircle className="w-4 h-4" />;
      case 'medium':
        return <FiClock className="w-4 h-4" />;
      case 'low':
        return <FiCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const getDueDateTime = (todo) => {
    if (!todo.due_date) return null;
    const [year, month, day] = todo.due_date.split('-').map((part) => parseInt(part, 10));
    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day);
    if (todo.due_time) {
      const [h, m] = todo.due_time.split(':').map((part) => parseInt(part, 10));
      date.setHours(h || 0, m || 0, 0, 0);
    } else {
      // Treat date-only deadlines as end-of-day
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const isOverdue = (todo) => {
    if (todo.is_completed) return false;
    const dueDateTime = getDueDateTime(todo);
    if (!dueDateTime) return false;
    return dueDateTime.getTime() < Date.now();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  // Show empty state only for unauthenticated users or if there's an error
  // For authenticated users with no categories, show the category slider with Add button
  if (categories.length === 0 && !isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3 md:py-4 lg:py-6 xl:py-8">
        <h1 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Plans
        </h1>
        <div className={`text-center py-6 sm:py-8 md:py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-base sm:text-lg mb-4">No categories yet. Create one to get started!</p>
        </div>
      </div>
    );
  }

  // Handle case when authenticated user has no categories yet
  const categoryTodos = (categories.length === 0 || !activeCategory) 
    ? [] 
    : todos.filter(t => t.category_id === activeCategory);
  const activeTodos = categoryTodos.filter((t) => !t.is_completed);
  const completedTodos = categoryTodos.filter((t) => t.is_completed);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3 md:py-4 lg:py-6 xl:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h1 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-1.5 md:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            My Plans
          </h1>
          <p className={`text-xs sm:text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {categories.length === 0 
              ? 'Create your first category to get started!'
              : `${activeTodos.length} active, ${completedTodos.length} completed${activeCategory ? ` in ${categories.find(c => c.id === activeCategory)?.name || ''}` : ''}`
            }
          </p>
        </div>
        <button
          onClick={toggleNotifications}
          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            notificationsEnabled
              ? isDarkMode
                ? 'bg-green-900/40 border border-green-500 text-green-300'
                : 'bg-green-50 border border-green-500 text-green-600'
              : isDarkMode
                ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 border border-gray-300 text-gray-700 hover:bg-gray-300'
          }`}
          title="Enable notifications for due tasks"
        >
          🔔 <span className="hidden sm:inline">{notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}</span>
          <span className="sm:hidden">{notificationsEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Category Slider */}
      <div className="mb-4 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Left scroll button - Hidden on mobile */}
          <button
            onClick={() => {
              scrollSlider('left');
            }}
            className={`hidden md:flex p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            ref={sliderRef}
            className="flex-1 overflow-hidden md:overflow-x-auto scrollbar-hide scroll-smooth min-w-0 relative"
            style={{ 
              scrollBehavior: 'smooth', 
              WebkitOverflowScrolling: 'touch',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mobile navigation buttons */}
            {typeof window !== 'undefined' && window.innerWidth < 768 && categories.length > 2 && (
              <>
                {mobileCategoryIndex > 0 && (
                  <button
                    onClick={() => scrollSlider('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {mobileCategoryIndex < categories.length - 2 && (
                  <button
                    onClick={() => scrollSlider('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <div 
              className="flex gap-1.5 sm:gap-2 md:gap-3 pb-2 pr-2 sm:pr-0 md:pr-0"
            >
              {categories.map((category, index) => {
                // On mobile, only show 2 categories at a time starting from mobileCategoryIndex
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const shouldShow = !isMobile || (index >= mobileCategoryIndex && index < mobileCategoryIndex + 2);
                
                // Don't render if not visible on mobile
                if (!shouldShow) return null;
                
                const isActive = activeCategory === category.id;
                const isDefault = isDefaultCategory(category);
                const baseClasses = isActive
                  ? (isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600')
                  : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300');

                const handleCategoryClick = () => {
                  if (deleteMode && !isDefault) {
                    handleDeleteCategory(category.id);
                  } else {
                    // Allow category switching for viewing, even for unauthenticated users
                    setActiveCategory(category.id);
                  }
                };

                return (
                  <div
                    key={category.id}
                    className={`flex flex-shrink-0 relative group overflow-hidden ${baseClasses} ${isDefault ? (isMobile ? 'px-1 py-0.5' : 'px-2 py-1') : (isMobile ? 'px-2 sm:px-2.5 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3' : 'px-2 sm:px-2.5 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3')} rounded-lg transition-all duration-200 ${isMobile ? '' : 'min-w-max'} ${deleteMode && !isDefault ? 'border-2 border-red-400/70' : ''}`}
                    onClick={handleCategoryClick}
                    style={{ 
                      cursor: deleteMode && !isDefault ? 'pointer' : 'default',
                      width: isMobile ? 'calc(50% - 0.375rem)' : (isDefault ? 'fit-content' : 'auto'),
                      minWidth: isMobile ? 'calc(50% - 0.375rem)' : (isDefault ? 'fit-content' : 'auto'),
                      maxWidth: isMobile ? 'calc(50% - 0.375rem)' : (isDefault ? 'fit-content' : 'none'),
                      flexShrink: isDefault ? 0 : 0
                    }}
                  >
                    {editingCategory === category.id && !isDefault ? (
                      <>
                        {/* Desktop: Inline editing */}
                        <div className="hidden md:flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            autoFocus
                            className={`px-2 py-1 rounded text-sm border-2 focus:outline-none ${
                              isDarkMode
                                ? 'bg-gray-900 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateCategory(category.id);
                            }}
                            className="text-green-500 hover:text-green-400"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(null);
                            }}
                            className="text-red-500 hover:text-red-400"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className={`flex items-center ${isDefault ? 'gap-0' : 'gap-2 sm:gap-3'} min-w-0 ${isDefault ? '' : 'flex-1'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCategory(category.id);
                          }}
                          className={`text-sm sm:text-base md:text-lg font-medium transition-all ${isDefault ? 'whitespace-nowrap' : 'truncate min-w-0 flex-1'} ${isDefault ? 'px-0' : ''} ${
                            isActive
                              ? 'text-white'
                              : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                          }`}
                          title={category.name}
                        >
                          <span className="hidden md:inline">{category.name}</span>
                          <span className="md:hidden">
                            {category.name.length > 10 
                              ? category.name.substring(0, 7) + '...' 
                              : category.name}
                          </span>
                        </button>

                        {/* Tiny rename control on hover (non-default only) */}
                        {!isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                navigate('/login');
                                return;
                              }
                              setEditingCategory(category.id);
                              setEditingCategoryName(category.name);
                            }}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded absolute top-1 right-1 text-[10px] leading-none border transition-all shadow ${
                              isDarkMode
                                ? 'bg-gray-900 border-gray-700 text-blue-300 hover:bg-blue-900/60'
                                : 'bg-white border-gray-300 text-blue-600 hover:bg-blue-50'
                            }`}
                            style={{ zIndex: 16 }}
                            title="Rename category"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add More Category Button - Show on mobile only if we're at the end */}
              {(() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const shouldShowAddButton = !isMobile || (mobileCategoryIndex + 2 >= categories.length);
                if (!shouldShowAddButton || showAddCategory) return null;
                return (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      setShowAddCategory(true);
                    }}
                    className={`flex-shrink-0 px-2 sm:px-2.5 md:px-3 lg:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 border-dashed transition-all text-xs sm:text-sm md:text-base ${
                      isDarkMode
                        ? 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                        : 'border-gray-400 hover:border-gray-500 text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                    } font-medium flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap`}
                    style={{ 
                      width: isMobile ? 'calc(50% - 0.375rem)' : 'fit-content',
                      minWidth: isMobile ? 'calc(50% - 0.375rem)' : 'fit-content'
                    }}
                  >
                    <FiPlus className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                    <span className="hidden md:inline">Add Category</span>
                    <span className="hidden sm:inline md:hidden">Add</span>
                  </button>
                );
              })()}
              {showAddCategory && (
                <>
                  {/* Desktop: Inline input */}
                  <div className={`hidden md:flex flex-shrink-0 items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg whitespace-nowrap ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      autoFocus
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded border-2 focus:outline-none text-sm sm:text-base ${
                        isDarkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <button
                      onClick={handleAddCategory}
                      className="text-green-500 hover:text-green-400"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      className="text-red-500 hover:text-red-400"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Right scroll button - Hidden on mobile */}
            <button
              onClick={() => {
                scrollSlider('right');
              }}
              className={`hidden md:flex p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Delete button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                setDeleteMode((prev) => !prev);
              }}
              className={`px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border whitespace-nowrap ${
                deleteMode
                  ? isDarkMode
                    ? 'bg-red-900/40 border-red-500 text-red-300'
                    : 'bg-red-50 border-red-500 text-red-600'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300'
              }`}
              title="Delete a category"
            >
              <span className="hidden sm:inline">{deleteMode ? 'Select category to delete' : 'Delete category'}</span>
              <span className="sm:hidden">{deleteMode ? 'Select' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Add Category Popup Modal */}
      {showAddCategory && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-xl border-2 p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New Category
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter a name for your new category
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                autoFocus
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  } else if (e.key === 'Escape') {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Rename Category Popup Modal */}
      {editingCategory && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-xl border-2 p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Rename Category
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter a new name for this category
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
                placeholder="Category name..."
                autoFocus
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUpdateCategory(editingCategory);
                  } else if (e.key === 'Escape') {
                    setEditingCategory(null);
                    setEditingCategoryName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateCategory(editingCategory)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setEditingCategoryName('');
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Todo Button */}
      {!isAddingTodo && (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login');
              return;
            }
            setIsAddingTodo(true);
          }}
          className={`w-full mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${
            isDarkMode
              ? 'border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400'
              : 'border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600'
          }`}
        >
          <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">Add New Todo</span>
        </button>
      )}

      {/* Add Todo Form */}
      {isAddingTodo && (
        <form
          onSubmit={handleAddTodo}
          className={`mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 md:p-6 rounded-xl border-2 animate-slideDown ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="space-y-3 sm:space-y-4">
            <div>
              <input
                type="text"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                placeholder="What needs to be done?"
                autoFocus
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div>
              <textarea
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                placeholder="Add description (optional)"
                rows={3}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <DateTimePicker
                value={{ date: newTodo.due_date, time: newTodo.due_time, repeat: newTodo.repeat }}
                onChange={({ date, time, repeat }) => setNewTodo({ ...newTodo, due_date: date, due_time: time, repeat: repeat || '' })}
                isDarkMode={isDarkMode}
                includeTime={true}
                onRepeatChange={(repeat) => setNewTodo({ ...newTodo, repeat: repeat || '' })}
              />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
            <button
              type="submit"
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Add Todo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingTodo(false);
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: '', due_time: '' });
              }}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active Todos */}
      {activeTodos.length > 0 && (
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <h2 className={`text-base sm:text-lg md:text-xl font-semibold mb-2.5 sm:mb-3 md:mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Active Tasks
          </h2>
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            {activeTodos.map((todo, index) => (
              <div
                key={todo.id}
                className={`${editingTodo === todo.id ? 'p-3 sm:p-4 md:p-5 mb-2' : 'p-2.5 sm:p-3 md:p-4'} rounded-xl border-2 transition-all duration-200 hover:shadow-lg animate-fadeIn relative ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } ${editingTodo === todo.id ? 'shadow-xl' : ''}`}
                style={{ 
                  animationDelay: `${index * 50}ms`, 
                  zIndex: editingTodo === todo.id ? 50 : 1,
                  marginBottom: editingTodo === todo.id ? '0.75rem' : '0'
                }}
              >
                {editingTodo === todo.id ? (
                  /* Edit Form */
                  <form onSubmit={handleUpdateTodo} className="space-y-3 relative z-10">
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="Task title"
                      autoFocus
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base ${
                        isDarkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Description (optional)"
                      rows={2}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base ${
                        isDarkMode
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <div className="space-y-3">
                      <select
                        value={editFormData.priority}
                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          isDarkMode
                            ? 'bg-gray-900 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <DateTimePicker
                        value={{ date: editFormData.due_date, time: editFormData.due_time, repeat: editFormData.repeat }}
                        onChange={({ date, time, repeat }) => setEditFormData({ ...editFormData, due_date: date, due_time: time, repeat: repeat || '' })}
                        isDarkMode={isDarkMode}
                        includeTime={true}
                        onRepeatChange={(repeat) => setEditFormData({ ...editFormData, repeat: repeat || '' })}
                      />
                    </div>
                    <div className={`flex gap-2 sm:gap-3 mt-4 pt-3 border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                      <button
                        type="submit"
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm sm:text-base relative z-20"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base relative z-20 ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Mode */
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                  <button
                    onClick={() => toggleComplete(todo)}
                    className={`mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      isDarkMode
                        ? 'border-gray-600 hover:border-blue-400'
                        : 'border-gray-400 hover:border-blue-600'
                    }`}
                  >
                    {todo.is_completed && <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1.5 sm:mb-2">
                      <h3 className={`text-sm sm:text-base md:text-lg font-medium flex-1 min-w-0 break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {todo.title}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 flex-wrap">
                        <span className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                          {getPriorityIcon(todo.priority)}
                          <span className="hidden sm:inline">{todo.priority}</span>
                        </span>
                        <button
                          onClick={() => startEditTodo(todo)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                            isDarkMode
                              ? 'hover:bg-blue-900/30 text-blue-400'
                              : 'hover:bg-blue-50 text-blue-600'
                          }`}
                          title="Edit task"
                        >
                          <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                            isDarkMode
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                          title="Delete task"
                        >
                          <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    {todo.description && (
                      <p className={`text-xs sm:text-sm mb-1.5 sm:mb-2 break-words ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {todo.description}
                      </p>
                    )}
                    {todo.due_date && (
                      <div
                        className={`flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-xs ${
                          isOverdue(todo)
                            ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                            : (isDarkMode ? 'text-gray-500' : 'text-gray-500')
                        }`}
                      >
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>
                            Due: {formatDate(todo.due_date)}
                            {todo.due_time && ` at ${formatTime(todo.due_time)}`}
                          </span>
                        </div>
                        {todo.repeat && (
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-[11px] font-semibold ${
                            isDarkMode
                              ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                              : 'bg-blue-100 border-blue-300 text-blue-700'
                          }`}>
                            {todo.repeat.charAt(0).toUpperCase() + todo.repeat.slice(1)}
                          </span>
                        )}
                        {isOverdue(todo) && (
                          <span className="px-2 py-1 rounded-full border text-[11px] font-semibold bg-red-500/10 border-red-500/50 text-red-400">
                            Overdue
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="mt-3 sm:mt-4 md:mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`w-full flex items-center justify-between px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 transition-all font-semibold text-xs sm:text-sm md:text-base ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-750'
                : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span>Completed Tasks ({completedTodos.length})</span>
            <span className={`text-[10px] sm:text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {showCompleted ? 'Hide' : 'Show'}
            </span>
          </button>

          {showCompleted && (
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mt-2.5 sm:mt-3 md:mt-4">
              {completedTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  className={`p-2.5 sm:p-3 md:p-4 rounded-xl border-2 transition-all duration-200 opacity-60 hover:opacity-100 animate-fadeIn ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    <button
                      onClick={() => toggleComplete(todo)}
                      className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    >
                      <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2">
                        <h3 className={`text-sm sm:text-base md:text-lg font-medium line-through break-words flex-1 min-w-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {todo.title}
                        </h3>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                            isDarkMode
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      {todo.description && (
                        <p className={`text-xs sm:text-sm line-through mb-1.5 sm:mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          {todo.description}
                        </p>
                      )}
                      {todo.due_date && (
                        <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                          <FiClock className="w-3 h-3" />
                          Due: {formatDate(todo.due_date)}
                          {todo.due_time && ` at ${formatTime(todo.due_time)}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {todos.length === 0 && (
        <div className={`text-center py-12 sm:py-16 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <FiCheck className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-20" />
          <p className="text-base sm:text-lg">No todos yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default MyPlans;
