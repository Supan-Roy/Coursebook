import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function PlanBuilder({ courseCode, onSave }) {
  const { isDarkMode } = useTheme();
  const [planType, setPlanType] = useState('study');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const templates = {
    study: {
      name: '📚 Study Plan',
      description: 'Comprehensive study plan with milestones',
      defaultTasks: [
        'Review course syllabus and objectives',
        'Study core concepts',
        'Work through examples and practice problems',
        'Take practice quiz',
        'Review weak areas'
      ]
    },
    revision: {
      name: '🔄 Revision Plan',
      description: 'Quick revision checklist',
      defaultTasks: [
        'Quick review of key concepts',
        'Review important formulas/definitions',
        'Solve practice problems',
        'Review weak points',
        'Final self-assessment'
      ]
    },
    quiz_prep: {
      name: '✏️ Quiz Preparation',
      description: 'Targeted quiz preparation',
      defaultTasks: [
        'Identify quiz topics',
        'Review related materials',
        'Solve sample questions',
        'Time yourself on practice quiz',
        'Review mistakes'
      ]
    }
  };

  const loadTemplate = (type) => {
    setPlanType(type);
    setTasks(templates[type].defaultTasks.map(t => ({
      id: Date.now() + Math.random(),
      text: t,
      completed: false
    })));
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        completed: false
      }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a plan title');
      return;
    }
    if (tasks.length === 0) {
      alert('Please add at least one task');
      return;
    }

    onSave({
      title,
      planType,
      startDate,
      endDate,
      tasks,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className={`rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`border-b p-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Create Study Plan
        </h3>

        {/* Plan Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => loadTemplate(key)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                planType === key
                  ? isDarkMode
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-sky-400 bg-sky-50'
                  : isDarkMode
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-300 hover:border-gray-200'
              }`}
            >
              <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {template.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Plan Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${courseCode} - ${templates[planType].name}`}
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500'
            }`}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-sky-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-sky-500'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Target Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-sky-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-sky-500'
              }`}
            />
          </div>
        </div>

        {/* Tasks */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Study Tasks
          </label>

          {/* Add Task */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a new task..."
              className={`flex-1 px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500'
              }`}
            />
            <button
              onClick={addTask}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors font-medium"
            >
              + Add
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No tasks yet. Select a template or add your own.
              </p>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-sky-500 border-sky-500'
                        : isDarkMode
                          ? 'border-gray-600 bg-gray-700'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 ${task.completed ? (isDarkMode ? 'line-through text-gray-500' : 'line-through text-gray-400') : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {index + 1}. {task.text}
                  </span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      isDarkMode
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Progress */}
        {tasks.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Progress
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {tasks.filter(t => t.completed).length} / {tasks.length}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all"
                style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`border-t p-4 flex gap-3 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors"
        >
          Save Plan
        </button>
        <button
          onClick={() => {
            setTitle('');
            setStartDate('');
            setEndDate('');
            setTasks([]);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
