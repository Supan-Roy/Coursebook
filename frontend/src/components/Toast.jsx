import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const { isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const colors = {
    success: {
      bg: isDarkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200',
      text: isDarkMode ? 'text-green-300' : 'text-green-700',
      icon: '✓'
    },
    error: {
      bg: isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200',
      text: isDarkMode ? 'text-red-300' : 'text-red-700',
      icon: '✕'
    },
    info: {
      bg: isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200',
      text: isDarkMode ? 'text-blue-300' : 'text-blue-700',
      icon: 'ℹ'
    },
    warning: {
      bg: isDarkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200',
      text: isDarkMode ? 'text-yellow-300' : 'text-yellow-700',
      icon: '⚠'
    }
  };

  const color = colors[type] || colors.info;

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm rounded-lg border p-4 ${color.bg} ${color.text} text-sm font-medium shadow-lg animate-fade-in-up z-40`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{color.icon}</span>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-auto text-xs hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
