import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiClock, FiRefreshCw, FiX } from 'react-icons/fi';
import AnalogTimePicker from './AnalogTimePicker';

const DateTimePicker = ({ value, onChange, isDarkMode, includeTime = true, onRepeatChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value?.date || '');
  const [selectedTime, setSelectedTime] = useState(value?.time || '');
  const [repeatPattern, setRepeatPattern] = useState(value?.repeat || '');
  const [viewDate, setViewDate] = useState(new Date());
  const dropdownRef = useRef(null);
  const timePickerRef = useRef(null);
  const repeatPickerRef = useRef(null);

  // Keep internal state in sync with external value
  useEffect(() => {
    setSelectedDate(value?.date || '');
    setSelectedTime(value?.time || '');
    setRepeatPattern(value?.repeat || '');
  }, [value?.date, value?.time, value?.repeat]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          (!timePickerRef.current || !timePickerRef.current.contains(event.target)) &&
          (!repeatPickerRef.current || !repeatPickerRef.current.contains(event.target))) {
        setIsOpen(false);
        setShowTimePicker(false);
        setShowRepeatPicker(false);
      }
    };

    if (isOpen || showTimePicker || showRepeatPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showTimePicker, showRepeatPicker]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handleDateSelect = (day) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    setSelectedDate(dateStr);
    onChange({ date: dateStr, time: selectedTime, repeat: repeatPattern });
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    onChange({ date: selectedDate, time, repeat: repeatPattern });
    // Don't auto-close, let user click Done button
  };

  const handleTimeDone = () => {
    // Time is already saved via handleTimeChange when user interacts with AnalogTimePicker
    // Just close the modal
    setShowTimePicker(false);
  };

  const handleRepeatSelect = (pattern) => {
    setRepeatPattern(pattern);
    if (onRepeatChange) {
      onRepeatChange(pattern);
    }
    onChange({ date: selectedDate, time: selectedTime, repeat: pattern });
    setShowRepeatPicker(false);
  };

  const handleClear = () => {
    setSelectedDate('');
    setSelectedTime('');
    setRepeatPattern('');
    onChange({ date: '', time: '', repeat: '' });
    if (onRepeatChange) {
      onRepeatChange('');
    }
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const formatDisplay = () => {
    if (!selectedDate) return 'Select date & time';
    const date = new Date(selectedDate);
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (includeTime && selectedTime) {
      return `${dateStr} at ${selectedTime}`;
    }
    return dateStr;
  };

  const formatTimeDisplay = () => {
    if (!selectedTime) return 'Set time';
    return selectedTime;
  };

  const formatRepeatDisplay = () => {
    if (!repeatPattern) return 'Repeat';
    const repeatOptions = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'weekdays': 'Weekdays',
      'weekends': 'Weekends'
    };
    return repeatOptions[repeatPattern] || repeatPattern;
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate);
    const firstDay = firstDayOfMonth(viewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 sm:h-10"></div>);
    }

    // Calendar days
    for (let day = 1; day <= totalDays; day++) {
      const year = viewDate.getFullYear();
      const month = String(viewDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const dateObj = new Date(year, viewDate.getMonth(), day);
      dateObj.setHours(0, 0, 0, 0);
      const isPast = dateObj < today;
      const isSelected = selectedDate === dateStr;
      const isToday = todayStr === dateStr;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isPast && handleDateSelect(day)}
          disabled={isPast}
          className={`h-8 sm:h-10 rounded-full text-sm font-medium transition-all ${
            isPast
              ? isDarkMode
                ? 'text-gray-600 cursor-not-allowed opacity-40'
                : 'text-gray-400 cursor-not-allowed opacity-40'
              : isSelected
              ? 'bg-blue-500 text-white shadow-md'
              : isToday
              ? isDarkMode
                ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                : 'bg-blue-100 text-blue-700 border-2 border-blue-500'
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

  const repeatOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 text-left flex items-center justify-between gap-1.5 sm:gap-2 transition-all text-xs sm:text-sm md:text-base ${
          isDarkMode
            ? 'bg-gray-900 border-gray-700 text-white hover:border-blue-500'
            : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'
        }`}
      >
        <span className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 ${!selectedDate && 'text-gray-500'}`}>
          <FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">{formatDisplay()}</span>
        </span>
        {selectedDate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className={`p-0.5 sm:p-1 rounded hover:bg-gray-700 transition-colors flex-shrink-0`}
          >
            <FiX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
          <div
            className={`w-full sm:w-auto sm:rounded-lg rounded-t-2xl shadow-2xl border-2 border-b-0 sm:border-b-2 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
            style={{ 
              maxWidth: 'min(95vw, 500px)',
              width: 'min(95vw, 500px)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="p-4 sm:p-5">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day, index) => (
                <div
                  key={index}
                  className={`text-center text-xs font-semibold py-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {renderCalendar()}
            </div>

            {/* Set Time Button */}
            {includeTime && (
              <button
                type="button"
                onClick={() => {
                  setShowTimePicker(true);
                  setShowRepeatPicker(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all mb-2 ${
                  isDarkMode
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiClock className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatTimeDisplay()}
                  </span>
                </div>
                {selectedTime && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimeChange('');
                    }}
                    className={`p-1 rounded-full hover:bg-gray-700 transition-colors`}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </button>
            )}

            {/* Repeat Button */}
            {onRepeatChange && (
              <button
                type="button"
                onClick={() => {
                  setShowRepeatPicker(true);
                  setShowTimePicker(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                  isDarkMode
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiRefreshCw className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatRepeatDisplay()}
                  </span>
                </div>
                {repeatPattern && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRepeatSelect('');
                    }}
                    className={`p-1 rounded-full hover:bg-gray-700 transition-colors`}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </button>
            )}
            </div>

            {/* Action Buttons */}
            <div className={`flex gap-2 p-4 border-t-2 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowTimePicker(false);
                  setShowRepeatPicker(false);
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowTimePicker(false);
                  setShowRepeatPicker(false);
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <div className="fixed inset-0 bg-black/50 z-[101] flex items-end sm:items-center justify-center">
          <div
            ref={timePickerRef}
            className={`w-full sm:w-auto sm:rounded-lg rounded-t-2xl shadow-2xl border-2 border-b-0 sm:border-b-2 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
            style={{ maxWidth: '400px' }}
          >
            <div className="p-4 sm:p-6">
              <div className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Set time
              </div>
              <AnalogTimePicker
                value={selectedTime}
                onChange={handleTimeChange}
                isDarkMode={isDarkMode}
                inline={true}
              />
            </div>
            <div className={`flex gap-2 p-4 border-t-2 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => setShowTimePicker(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTimeDone}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Picker Modal */}
      {showRepeatPicker && (
        <div className="fixed inset-0 bg-black/50 z-[101] flex items-end sm:items-center justify-center">
          <div
            ref={repeatPickerRef}
            className={`w-full sm:w-auto sm:rounded-lg rounded-t-2xl shadow-2xl border-2 border-b-0 sm:border-b-2 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
            style={{ maxWidth: '400px' }}
          >
            <div className="p-4 sm:p-6">
              <div className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Repeat
              </div>
              <div className="space-y-2">
                {repeatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleRepeatSelect(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      repeatPattern === option.value
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleRepeatSelect('')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  Don't repeat
                </button>
              </div>
            </div>
            <div className={`flex gap-2 p-4 border-t-2 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => setShowRepeatPicker(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
