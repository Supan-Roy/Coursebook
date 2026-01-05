import { useState, useEffect, useRef } from 'react';
import { todoService, todoCategoryService } from '../services';
import { FiPlus, FiTrash2, FiCheck, FiClock, FiAlertCircle, FiEdit2, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import DateTimePicker from './DateTimePicker';
import notificationService from '../services/notificationService';

const MyPlans = ({ isDarkMode }) => {
  const NOTIFICATION_PREF_KEY = 'todo_notifications_enabled';
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: getTodayDate(),
    due_time: '',
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
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationIntervalRef = useRef(null);
  const sliderRef = useRef(null);
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

  const toggleNotifications = async () => {
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
    try {
      const [categoriesData, todosData] = await Promise.all([
        todoCategoryService.getAll(),
        todoService.getAll(),
      ]);
      
      setCategories(categoriesData);
      setTodos(todosData);
      
      // Set active category to first one if exists
      if (categoriesData.length > 0) {
        setActiveCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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

    try {
      const todoData = {
        title: newTodo.title,
        description: newTodo.description,
        priority: newTodo.priority,
        due_date: newTodo.due_date || null,
        due_time: newTodo.due_time || null,
        category_id: activeCategory,
      };
      const created = await todoService.create(todoData);
      setTodos([created, ...todos]);
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: getTodayDate(), due_time: '' });
      setIsAddingTodo(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await todoCategoryService.create({ name: newCategoryName });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdateCategory = async (categoryId) => {
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
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const toggleComplete = async (todo) => {
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
    try {
      await todoService.delete(id);
      setTodos(todos.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodo(todo.id);
    setEditFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date || '',
      due_time: todo.due_time || '',
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

    try {
      const updated = await todoService.update(editingTodo, {
        title: editFormData.title,
        description: editFormData.description,
        priority: editFormData.priority,
        due_date: editFormData.due_date || null,
        due_time: editFormData.due_time || null,
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

  if (categories.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Plans
        </h1>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-lg mb-4">No categories yet. Create one to get started!</p>
        </div>
      </div>
    );
  }

  const categoryTodos = todos.filter(t => t.category_id === activeCategory);
  const activeTodos = categoryTodos.filter((t) => !t.is_completed);
  const completedTodos = categoryTodos.filter((t) => t.is_completed);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            My Plans
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {activeTodos.length} active, {completedTodos.length} completed in {categories.find(c => c.id === activeCategory)?.name}
          </p>
        </div>
        <button
          onClick={toggleNotifications}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
          🔔 {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
        </button>
      </div>

      {/* Category Slider */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollSlider('left')}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={sliderRef}
            className="flex-1 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-3 pb-2">
              {categories.map(category => {
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
                    setActiveCategory(category.id);
                  }
                };

                return (
                  <div
                    key={category.id}
                    className={`flex-shrink-0 relative group overflow-visible ${baseClasses} px-6 py-3 rounded-lg transition-all duration-200 min-w-max ${deleteMode && !isDefault ? 'border-2 border-red-400/70' : ''}`}
                    onClick={handleCategoryClick}
                    style={{ cursor: deleteMode && !isDefault ? 'pointer' : 'default' }}
                  >
                    {editingCategory === category.id && !isDefault ? (
                      <div className="flex items-center gap-2">
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
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCategory(category.id);
                          }}
                          className={`text-lg font-medium transition-all ${
                            isActive
                              ? 'text-white'
                              : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                          }`}
                        >
                          {category.name}
                        </button>

                        {/* Tiny rename control on hover (non-default only) */}
                        {!isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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

              {/* Add More Category Button */}
              {!showAddCategory ? (
                <button
                  onClick={() => setShowAddCategory(true)}
                  className={`flex-shrink-0 px-6 py-3 rounded-lg border-2 border-dashed transition-all ${
                    isDarkMode
                      ? 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'border-gray-400 hover:border-gray-500 text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                  } min-w-max font-medium flex items-center gap-2`}
                >
                  <FiPlus className="w-4 h-4" />
                  Add Category
                </button>
              ) : (
                <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg min-w-max ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name..."
                    autoFocus
                    className={`px-3 py-1 rounded border-2 focus:outline-none text-sm ${
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
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollSlider('right')}
              className={`p-2 rounded-lg transition-all ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDeleteMode((prev) => !prev)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
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
              {deleteMode ? 'Select category to delete' : 'Delete category'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Todo Button */}
      {!isAddingTodo && (
        <button
          onClick={() => setIsAddingTodo(true)}
          className={`w-full mb-6 p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 ${
            isDarkMode
              ? 'border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400'
              : 'border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600'
          }`}
        >
          <FiPlus className="w-5 h-5" />
          <span className="font-medium">Add New Todo</span>
        </button>
      )}

      {/* Add Todo Form */}
      {isAddingTodo && (
        <form
          onSubmit={handleAddTodo}
          className={`mb-6 p-6 rounded-xl border-2 animate-slideDown ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                placeholder="What needs to be done?"
                autoFocus
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
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
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div className="space-y-4">
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
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
                value={{ date: newTodo.due_date, time: newTodo.due_time }}
                onChange={({ date, time }) => setNewTodo({ ...newTodo, due_date: date, due_time: time })}
                isDarkMode={isDarkMode}
                includeTime={true}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add Todo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingTodo(false);
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: '', due_time: '' });
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
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
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Active Tasks
          </h2>
          <div className="space-y-3">
            {activeTodos.map((todo, index) => (
              <div
                key={todo.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg animate-fadeIn ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {editingTodo === todo.id ? (
                  /* Edit Form */
                  <form onSubmit={handleUpdateTodo} className="space-y-3">
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="Task title"
                      autoFocus
                      className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
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
                      className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
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
                        value={{ date: editFormData.due_date, time: editFormData.due_time }}
                        onChange={({ date, time }) => setEditFormData({ ...editFormData, due_date: date, due_time: time })}
                        isDarkMode={isDarkMode}
                        includeTime={true}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleComplete(todo)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isDarkMode
                        ? 'border-gray-600 hover:border-blue-400'
                        : 'border-gray-400 hover:border-blue-600'
                    }`}
                  >
                    {todo.is_completed && <FiCheck className="w-4 h-4 text-blue-500" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {todo.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                          {getPriorityIcon(todo.priority)}
                          {todo.priority}
                        </span>
                        <button
                          onClick={() => startEditTodo(todo)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isDarkMode
                              ? 'hover:bg-blue-900/30 text-blue-400'
                              : 'hover:bg-blue-50 text-blue-600'
                          }`}
                          title="Edit task"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isDarkMode
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                          title="Delete task"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {todo.description && (
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {todo.description}
                      </p>
                    )}
                    {todo.due_date && (
                      <div
                        className={`flex items-center gap-2 flex-wrap text-xs ${
                          isOverdue(todo)
                            ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                            : (isDarkMode ? 'text-gray-500' : 'text-gray-500')
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>
                            Due: {formatDate(todo.due_date)}
                            {todo.due_time && ` at ${formatTime(todo.due_time)}`}
                          </span>
                        </div>
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
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all font-semibold ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-750'
                : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span>Completed Tasks ({completedTodos.length})</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {showCompleted ? 'Hide' : 'Show'}
            </span>
          </button>

          {showCompleted && (
            <div className="space-y-3 mt-4">
              {completedTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 opacity-60 hover:opacity-100 animate-fadeIn ${
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleComplete(todo)}
                      className="mt-1 w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center transition-all duration-200"
                    >
                      <FiCheck className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={`text-lg font-medium line-through ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {todo.title}
                        </h3>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isDarkMode
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {todo.description && (
                        <p className={`text-sm line-through ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          {todo.description}
                        </p>
                      )}
                      {todo.due_date && (
                        <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
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
        <div className={`text-center py-16 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <FiCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No todos yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default MyPlans;
