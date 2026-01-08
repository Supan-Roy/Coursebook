import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const DatePicker = ({ value, onChange, disabled = false, maxDate = null, minDate = null }) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date();
  });
  const dropdownRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDisplay = () => {
    if (!value) return 'Select date';
    const date = new Date(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDateSelect = (day) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const changeYear = (delta) => {
    setViewDate(new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1));
  };

  const isDateDisabled = (year, month, day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (date > max) return true;
    }
    
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    
    return false;
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate);
    const firstDay = firstDayOfMonth(viewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const selectedDateStr = value ? value.split('T')[0] : '';

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Calendar days
    for (let day = 1; day <= totalDays; day++) {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);
      
      const isDisabled = isDateDisabled(year, month, day);
      const isSelected = selectedDateStr === dateStr;
      const isToday = todayStr === dateStr;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all ${
            isDisabled
              ? isDarkMode
                ? 'text-gray-600 cursor-not-allowed opacity-30'
                : 'text-gray-400 cursor-not-allowed opacity-30'
              : isSelected
              ? 'bg-sky-500 text-white shadow-lg scale-105 font-semibold'
              : isToday
              ? isDarkMode
                ? 'bg-sky-500/20 text-sky-400 border-2 border-sky-500'
                : 'bg-sky-100 text-sky-700 border-2 border-sky-500'
              : isDarkMode
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-sm border rounded-lg text-left flex items-center justify-between gap-2 transition-all ${
          disabled
            ? isDarkMode
              ? 'bg-gray-900/30 border-gray-700 text-white cursor-not-allowed'
              : 'bg-gray-100 border-gray-300 text-gray-900 cursor-not-allowed'
            : isDarkMode
            ? 'bg-gray-900/50 border-gray-700 text-white hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500'
            : 'bg-white border-gray-300 text-gray-900 hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500'
        }`}
      >
        <span className={`flex items-center gap-2 ${!value && (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDisplay()}
        </span>
        {isOpen && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
        {!isOpen && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute top-full left-0 mt-2 z-50 p-4 rounded-xl shadow-2xl border-2 ${
            isDarkMode
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{ width: '320px' }}
        >
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeYear(-1)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <select
                value={currentMonth}
                onChange={(e) => setViewDate(new Date(currentYear, parseInt(e.target.value), 1))}
                className={`text-sm font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), currentMonth, 1))}
                className={`text-sm font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {Array.from({ length: 100 }, (_, i) => {
                  const year = new Date().getFullYear() - 80 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => changeYear(1)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className={`h-8 flex items-center justify-center text-xs font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Clear Button */}
          {value && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Clear Date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;

