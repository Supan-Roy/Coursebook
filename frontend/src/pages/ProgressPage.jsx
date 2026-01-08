import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { courseService, materialService, preparationService } from '../services';

export default function ProgressPage({ isDarkMode: propIsDarkMode }) {
  const { isAuthenticated, user } = useAuth();
  const { isDarkMode: themeIsDarkMode } = useTheme();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : themeIsDarkMode;
  
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [quizSessions, setQuizSessions] = useState([]);
  const [fileAccessData, setFileAccessData] = useState({}); // Track file opens from localStorage

  useEffect(() => {
    if (isAuthenticated) {
      loadProgressData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const [coursesData, materialsData] = await Promise.all([
        courseService.getAll(),
        materialService.getAll(),
      ]);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      
      // Load file access data from localStorage
      const accessData = JSON.parse(localStorage.getItem('fileAccessData') || '{}');
      setFileAccessData(accessData);
      
      // Load quiz sessions
      try {
        const quizzesData = await preparationService.listQuizzes();
        setQuizSessions(Array.isArray(quizzesData) ? quizzesData : []);
      } catch (err) {
        console.error('Failed to load quiz sessions:', err);
        setQuizSessions([]);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate quiz performance
  const quizStats = useMemo(() => {
    if (!quizSessions || quizSessions.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
      };
    }

    const completed = quizSessions.filter(q => q.completed_at);
    const scores = completed.map(q => parseFloat(q.score) || 0);
    const totalQuestions = completed.reduce((sum, q) => sum + (q.num_questions || 0), 0);
    const correctAnswers = completed.reduce((sum, q) => {
      const score = parseFloat(q.score) || 0;
      const questions = q.num_questions || 0;
      return sum + Math.round((score / 100) * questions);
    }, 0);

    return {
      totalQuizzes: completed.length,
      averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
      bestScore: scores.length > 0 ? Math.max(...scores).toFixed(1) : 0,
      totalQuestions,
      correctAnswers,
    };
  }, [quizSessions]);

  // Calculate study hours and file access
  const studyStats = useMemo(() => {
    const courseAccessCount = {};
    const courseAccessTime = {};
    
    // Count file opens per course
    Object.keys(fileAccessData).forEach(materialId => {
      const material = materials.find(m => m.id === materialId);
      if (material && material.course) {
        const courseId = material.course;
        courseAccessCount[courseId] = (courseAccessCount[courseId] || 0) + (fileAccessData[materialId]?.count || 0);
        courseAccessTime[courseId] = (courseAccessTime[courseId] || 0) + (fileAccessData[materialId]?.totalTime || 0);
      }
    });

    // Convert to hours (assuming time is in seconds)
    const totalHours = Object.values(courseAccessTime).reduce((sum, time) => sum + time, 0) / 3600;
    
    return {
      courseAccessCount,
      courseAccessTime,
      totalHours: totalHours.toFixed(1),
      totalFileOpens: Object.values(courseAccessCount).reduce((sum, count) => sum + count, 0),
    };
  }, [fileAccessData, materials]);

  // Most studied courses for pie chart
  const mostStudiedCourses = useMemo(() => {
    const courseStats = courses.map(course => {
      const accessCount = studyStats.courseAccessCount[course.id] || 0;
      const accessTime = studyStats.courseAccessTime[course.id] || 0;
      return {
        course,
        accessCount,
        accessTimeHours: (accessTime / 3600).toFixed(1),
        materialsCount: materials.filter(m => m.course === course.id && !m.is_deleted).length,
      };
    }).filter(stat => stat.accessCount > 0 || stat.materialsCount > 0)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);

    return courseStats;
  }, [courses, studyStats, materials]);

  const hasActivity = quizStats.totalQuizzes > 0 || studyStats.totalFileOpens > 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
      </div>
    );
  }

  // Empty state for non-users or users with no activity
  if (!isAuthenticated || !hasActivity) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          No Progress Data Yet
        </h2>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {!isAuthenticated 
            ? 'Sign in to track your study progress and quiz performance.'
            : 'Study your course materials and take quizzes to see your progress here.'}
        </p>
        {!isAuthenticated && (
          <button
            onClick={() => window.location.href = '/login'}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            }`}
          >
            Sign In
          </button>
        )}
      </div>
    );
  }

  // Pie chart colors
  const chartColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Progress
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Track your study progress and quiz performance
        </p>
      </div>

      {/* Quiz Performance */}
      {quizStats.totalQuizzes > 0 && (
        <div className={`rounded-2xl p-6 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quiz Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Quizzes</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {quizStats.totalQuizzes}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Score</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {quizStats.averageScore}%
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best Score</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {quizStats.bestScore}%
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Correct Answers</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {quizStats.correctAnswers}/{quizStats.totalQuestions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Study Statistics */}
      {studyStats.totalFileOpens > 0 && (
        <div className={`rounded-2xl p-6 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Study Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Study Hours</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {studyStats.totalHours}h
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Files Opened</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {studyStats.totalFileOpens}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Courses</p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {mostStudiedCourses.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Most Studied Courses - Pie Chart */}
      {mostStudiedCourses.length > 0 && (
        <div className={`rounded-2xl p-6 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Most Studied Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simple Pie Chart Visualization */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {(() => {
                    const total = mostStudiedCourses.reduce((sum, stat) => sum + stat.accessCount, 0);
                    let currentAngle = 0;
                    return mostStudiedCourses.map((stat, idx) => {
                      const percentage = (stat.accessCount / total) * 100;
                      const angle = (percentage / 100) * 360;
                      const startAngle = currentAngle;
                      currentAngle += angle;
                      const largeArc = angle > 180 ? 1 : 0;
                      const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
                      const y2 = 50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
                      return (
                        <path
                          key={stat.course.id}
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={chartColors[idx % chartColors.length]}
                          opacity={0.8}
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3">
              {mostStudiedCourses.map((stat, idx) => (
                <div key={stat.course.id} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.course.code || stat.course.title || 'Untitled Course'}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.accessCount} opens • {stat.accessTimeHours}h studied
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

