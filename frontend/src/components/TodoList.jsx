import { useState, useEffect } from 'react';
import { todoService } from '../services';
import { FiPlus, FiTrash2, FiCheck, FiClock, FiAlertCircle, FiEdit2 } from 'react-icons/fi';
import DateTimePicker from './DateTimePicker';

const TodoList = ({ isDarkMode }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    due_time: '',
  });
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    due_time: '',
  });

  useEffect(() => {
    loadTodos();
  }, []);

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
      };
      const created = await todoService.create(todoData);
      setTodos([created, ...todos]);
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: '', due_time: '' });
      setIsAddingTodo(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  const activeTodos = todos.filter((t) => !t.is_completed);
  const completedTodos = todos.filter((t) => t.is_completed);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Todo List
        </h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {activeTodos.length} active, {completedTodos.length} completed
        </p>
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
                      <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <FiClock className="w-3 h-3" />
                        Due: {new Date(todo.due_date).toLocaleDateString()}
                        {todo.due_time && ` at ${formatTime(todo.due_time)}`}
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
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Completed
          </h2>
          <div className="space-y-3">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
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

export default TodoList;
