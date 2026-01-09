import { useState, useRef, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';

const AnalogTimePicker = ({ value, onChange, isDarkMode, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectingHours, setSelectingHours] = useState(true);
  const dropdownRef = useRef(null);
  const clockRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    // Don't sync from value prop if user is actively typing
    if (isTypingRef.current) return;
    
    if (value) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h, 10);
      const hour12 = hour24 % 12 || 12;
      // Only update if the value actually changed to avoid interfering with user typing
      const newHours = String(hour12).padStart(2, '0');
      const newMinutes = m;
      // Check if the current state matches what we would set
      // If user typed "4" and we're about to set "04", don't do it while they're typing
      const currentHourInt = parseInt(hours, 10) || 0;
      const currentMinuteInt = parseInt(minutes, 10) || 0;
      const newHourInt = parseInt(newHours, 10);
      const newMinuteInt = parseInt(newMinutes, 10);
      
      // Only update if values are actually different (not just formatting)
      if (currentHourInt !== newHourInt || currentMinuteInt !== newMinuteInt) {
        setHours(newHours);
        setMinutes(newMinutes);
        setPeriod(hour24 >= 12 ? 'PM' : 'AM');
      }
    } else if (value === '' && (hours !== '' || minutes !== '')) {
      // Only clear if value is explicitly empty and we have values
      setHours('12');
      setMinutes('00');
      setPeriod('AM');
    }
  }, [value, hours, minutes]);

  // Emit time changes automatically in inline mode after user interaction
  // Use a ref to track if we're currently typing to avoid interrupting user input
  useEffect(() => {
    if (!inline || !hasInteracted) return;
    
    // Don't emit if user is still typing (single digit that could become two digits)
    // Only emit when we have complete valid values or when both are empty
    if (hours === '' || minutes === '') {
      if (hours === '' && minutes === '') {
        onChange('');
      }
      return;
    }

    const hourInt = parseInt(hours, 10);
    const minuteInt = parseInt(minutes, 10);
    if (Number.isNaN(hourInt) || Number.isNaN(minuteInt)) return;

    // Only emit if we have valid complete values
    // This allows typing "4" then "5" to make "45" without interruption
    const hour24 = period === 'PM'
      ? (hourInt === 12 ? 12 : hourInt + 12)
      : (hourInt === 12 ? 0 : hourInt);
    const timeString = `${String(hour24).padStart(2, '0')}:${String(minuteInt).padStart(2, '0')}`;
    
    // Use a small delay to allow user to continue typing
    const timeoutId = setTimeout(() => {
      if (!isTypingRef.current) {
        onChange(timeString);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [hours, minutes, period, inline, hasInteracted, onChange]);

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

  const handleClockClick = (e) => {
    if (!clockRef.current) return;
    
    // Don't process if clicking on a number directly (they have their own handlers)
    if (e.target.closest('.clock-number')) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const angle = Math.atan2(y, x);
    const degrees = (angle * 180) / Math.PI + 90;
    const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;

    isTypingRef.current = false; // Clear typing flag immediately
    
    if (selectingHours) {
      const hour = Math.round(normalizedDegrees / 30) % 12 || 12;
      const hourStr = String(hour);
      setHours(hourStr);
      setSelectingHours(false);
      setHasInteracted(true);
      
      // Immediately emit time change
      setTimeout(() => {
        const hourInt = parseInt(hourStr, 10);
        const minuteInt = parseInt(minutes, 10) || 0;
        const hour24 = period === 'PM'
          ? (hourInt === 12 ? 12 : hourInt + 12)
          : (hourInt === 12 ? 0 : hourInt);
        const timeString = `${String(hour24).padStart(2, '0')}:${String(minuteInt).padStart(2, '0')}`;
        onChange(timeString);
      }, 0);
    } else {
      const minute = Math.round(normalizedDegrees / 6) % 60;
      const minuteStr = String(minute).padStart(2, '0');
      setMinutes(minuteStr);
      setHasInteracted(true);
      
      // Immediately emit time change
      setTimeout(() => {
        const hourInt = parseInt(hours, 10) || 12;
        const minuteInt = parseInt(minuteStr, 10);
        const hour24 = period === 'PM'
          ? (hourInt === 12 ? 12 : hourInt + 12)
          : (hourInt === 12 ? 0 : hourInt);
        const timeString = `${String(hour24).padStart(2, '0')}:${minuteStr}`;
        onChange(timeString);
      }, 0);
    }
  };

  const handleNumberClick = (num) => {
    isTypingRef.current = false; // Clear typing flag immediately
    
    if (selectingHours) {
      const hourStr = String(num);
      setHours(hourStr);
      setSelectingHours(false);
      setHasInteracted(true);
      
      // Immediately emit time change
      setTimeout(() => {
        const hourInt = parseInt(hourStr, 10);
        const minuteInt = parseInt(minutes, 10) || 0;
        const hour24 = period === 'PM'
          ? (hourInt === 12 ? 12 : hourInt + 12)
          : (hourInt === 12 ? 0 : hourInt);
        const timeString = `${String(hour24).padStart(2, '0')}:${String(minuteInt).padStart(2, '0')}`;
        onChange(timeString);
      }, 0);
    } else {
      const minuteStr = String(num).padStart(2, '0');
      setMinutes(minuteStr);
      setHasInteracted(true);
      
      // Immediately emit time change
      setTimeout(() => {
        const hourInt = parseInt(hours, 10) || 12;
        const minuteInt = parseInt(minuteStr, 10);
        const hour24 = period === 'PM'
          ? (hourInt === 12 ? 12 : hourInt + 12)
          : (hourInt === 12 ? 0 : hourInt);
        const timeString = `${String(hour24).padStart(2, '0')}:${minuteStr}`;
        onChange(timeString);
      }, 0);
    }
  };

  const handleDone = () => {
    const hour24 = period === 'PM' ? 
      (parseInt(hours) === 12 ? 12 : parseInt(hours) + 12) : 
      (parseInt(hours) === 12 ? 0 : parseInt(hours));
    const timeString = `${String(hour24).padStart(2, '0')}:${minutes}`;
    onChange(timeString);
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setHours('12');
    setMinutes('00');
    setPeriod('AM');
    onChange('');
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handleManualHourChange = (e) => {
    isTypingRef.current = true;
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      setHours('');
      setHasInteracted(false);
      setTimeout(() => { isTypingRef.current = false; }, 100);
      return;
    }
    // Allow typing without immediate padding - keep raw input until blur
    if (val.length <= 2) {
      let num = parseInt(val, 10);
      if (isNaN(num)) {
        setHours('');
        setTimeout(() => { isTypingRef.current = false; }, 100);
        return;
      }
      if (num > 12) {
        setHours('12');
      } else if (num < 1 && val.length === 2) {
        setHours('01');
      } else {
        // Keep the raw input value (e.g., "1" or "12") without padding
        setHours(val);
      }
    } else {
      // If more than 2 digits, take only first 2
      const twoDigits = val.slice(0, 2);
      const num = parseInt(twoDigits, 10);
      if (num > 12) {
        setHours('12');
      } else if (num < 1) {
        setHours('01');
      } else {
        setHours(twoDigits);
      }
    }

    setHasInteracted(true);
    // Reset typing flag after a short delay to allow continued typing
    setTimeout(() => { isTypingRef.current = false; }, 500);
  };

  const handleHourBlur = () => {
    if (hours === '') {
      setHours('12');
      return;
    }
    let num = parseInt(hours);
    if (num < 1 || num > 12) {
      setHours('12');
    } else {
      setHours(String(num).padStart(2, '0'));
    }
  };

  const handleManualMinuteChange = (e) => {
    isTypingRef.current = true;
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      setMinutes('');
      setHasInteracted(false);
      setTimeout(() => { isTypingRef.current = false; }, 100);
      return;
    }
    // Allow typing without immediate padding - keep raw input until blur
    if (val.length <= 2) {
      let num = parseInt(val, 10);
      if (isNaN(num)) {
        setMinutes('');
        setTimeout(() => { isTypingRef.current = false; }, 100);
        return;
      }
      if (num > 59) {
        // If user types something like "60", cap at 59
        setMinutes('59');
      } else {
        // Keep the raw input value (e.g., "4" or "45") without padding
        setMinutes(val);
      }
    } else {
      // If more than 2 digits, take only first 2
      const twoDigits = val.slice(0, 2);
      const num = parseInt(twoDigits, 10);
      if (num > 59) {
        setMinutes('59');
      } else {
        setMinutes(twoDigits);
      }
    }

    setHasInteracted(true);
    // Reset typing flag after a short delay to allow continued typing
    setTimeout(() => { isTypingRef.current = false; }, 500);
  };

  const handleMinuteBlur = () => {
    if (minutes === '') {
      setMinutes('00');
      return;
    }
    let num = parseInt(minutes);
    if (num > 59) {
      setMinutes('59');
    } else {
      setMinutes(String(num).padStart(2, '0'));
    }
  };

  const getClockHandStyle = () => {
    const value = selectingHours ? parseInt(hours) : parseInt(minutes);
    const degrees = selectingHours ? 
      (value % 12) * 30 - 90 : 
      value * 6 - 90;
    
    return {
      transform: `rotate(${degrees}deg)`,
      transformOrigin: '0% 50%',
    };
  };

  const renderClockNumbers = () => {
    const numbers = selectingHours ? 
      [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] :
      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    
    return numbers.map((num, index) => {
      const angle = (index * 30 - 90) * (Math.PI / 180);
      const radius = 60;
      const x = Math.cos(angle) * radius + 75;
      const y = Math.sin(angle) * radius + 75;
      
      const isSelected = selectingHours ? 
        parseInt(hours) === num || (num === 12 && parseInt(hours) === 12) :
        parseInt(minutes) === num;

      return (
        <div
          key={num}
          onClick={(e) => {
            e.stopPropagation();
            handleNumberClick(num);
          }}
          className={`clock-number absolute w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium transition-all cursor-pointer z-10 ${
            isSelected
              ? 'bg-blue-600 text-white scale-110'
              : isDarkMode
              ? 'text-gray-300 hover:bg-gray-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {selectingHours ? num : String(num).padStart(2, '0')}
        </div>
      );
    });
  };

  const formatDisplay = () => {
    if (!value) return 'Select time';
    const [h, m] = value.split(':');
    const hour24 = parseInt(h);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${ampm}`;
  };

  // Time picker content
  const timePickerContent = (
    <div>
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSelectingHours(true)}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            selectingHours
              ? 'bg-blue-600 text-white'
              : isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Hours
        </button>
        <button
          type="button"
          onClick={() => setSelectingHours(false)}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            !selectingHours
              ? 'bg-blue-600 text-white'
              : isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Minutes
        </button>
      </div>

      {/* Analog Clock */}
      <div
        ref={clockRef}
        className={`relative mx-auto mb-4 rounded-full cursor-pointer ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
        style={{ width: '150px', height: '150px' }}
        onClick={handleClockClick}
      >
        {/* Clock face border */}
        <div className={`absolute inset-0 rounded-full border-4 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"></div>
        
        {/* Clock hand */}
        <div
          className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-blue-600 rounded-full pointer-events-none"
          style={getClockHandStyle()}
        ></div>
        
        {/* Numbers */}
        {renderClockNumbers()}
      </div>

      {/* Manual Input */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={hours}
            onChange={handleManualHourChange}
            onBlur={handleHourBlur}
            placeholder="12"
            maxLength={2}
            className={`w-16 px-3 py-2 text-center rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>:</span>
          <input
            type="text"
            value={minutes}
            onChange={handleManualMinuteChange}
            onBlur={handleMinuteBlur}
            placeholder="00"
            maxLength={2}
            className={`w-16 px-3 py-2 text-center rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setPeriod('AM');
                setHasInteracted(true);
              }}
              className={`px-3 py-2 rounded-lg font-medium transition-all ${
                period === 'AM'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('PM');
                setHasInteracted(true);
              }}
              className={`px-3 py-2 rounded-lg font-medium transition-all ${
                period === 'PM'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only show when not inline */}
      {!inline && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );

  // If inline mode, render content directly
  if (inline) {
    return timePickerContent;
  }

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
        <span className={`flex items-center gap-2 ${!value && 'text-gray-500'}`}>
          <FiClock className="w-4 h-4" />
          {formatDisplay()}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-[100] p-6 rounded-xl shadow-2xl border-2 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{ width: '340px', right: 0 }}
        >
          {timePickerContent}
        </div>
      )}
    </div>
  );
};

export default AnalogTimePicker;
