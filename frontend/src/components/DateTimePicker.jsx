import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';
import AnalogTimePicker from './AnalogTimePicker';

const DateTimePicker = ({ value, onChange, isDarkMode, includeTime = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value?.date || '');
  const [selectedTime, setSelectedTime] = useState(value?.time || '');
  const [viewDate, setViewDate] = useState(new Date());
  const dropdownRef = useRef(null);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateSelect = (day) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    setSelectedDate(dateStr);
    onChange({ date: dateStr, time: selectedTime });
    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    onChange({ date: selectedDate, time });
  };

  const handleClear = () => {
    setSelectedDate('');
    setSelectedTime('');
    onChange({ date: '', time: '' });
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const formatDisplay = () => {
    if (!selectedDate) return 'Select date & time';
    const date = new Date(selectedDate);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (includeTime && selectedTime) {
      return `${dateStr} at ${selectedTime}`;
    }
    return dateStr;
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate);
    const firstDay = firstDayOfMonth(viewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
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
          className={`h-8 rounded-lg text-xs font-medium transition-all ${
            isPast
              ? isDarkMode
                ? 'text-gray-600 cursor-not-allowed opacity-40'
                : 'text-gray-400 cursor-not-allowed opacity-40'
              : isSelected
              ? 'bg-blue-600 text-white shadow-lg scale-105'
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-lg border-2 text-left flex items-center justify-between gap-2 transition-all ${
          isDarkMode
            ? 'bg-gray-900 border-gray-700 text-white hover:border-blue-500'
            : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'
        }`}
      >
        <span className={`flex items-center gap-2 ${!selectedDate && 'text-gray-500'}`}>
          <FiCalendar className="w-4 h-4" />
          {formatDisplay()}
        </span>
        {selectedDate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className={`p-1 rounded hover:bg-gray-700 transition-colors`}
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full right-0 mb-2 z-[100] p-4 rounded-lg shadow-2xl border-2 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{ width: includeTime ? '600px' : '240px' }}
        >
          <div className="flex gap-4">
            {/* Calendar Section */}
            <div className="flex-shrink-0" style={{ width: '240px' }}>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-semibold py-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {renderCalendar()}
              </div>
            </div>

            {/* Time Picker Section */}
            {includeTime && (
              <div className="border-l pl-4 flex-shrink-0" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb', width: '300px' }}>
                <div className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Time (optional)
                </div>
                <AnalogTimePicker
                  value={selectedTime}
                  onChange={handleTimeChange}
                  isDarkMode={isDarkMode}
                  inline={true}
                />
              </div>
            )}
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
