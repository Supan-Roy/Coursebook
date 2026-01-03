import { useTheme } from '../context/ThemeContext';

export default function AlertDialog({ isOpen, title, message, type = 'info', onClose }) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m9-3a9 9 0 11-18 0 9 9 0 0118 0z',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          buttonColor: 'bg-red-500 hover:bg-red-600',
        };
      case 'success':
        return {
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          buttonColor: 'bg-green-500 hover:bg-green-600',
        };
      case 'warning':
        return {
          icon: 'M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
        };
      default: // info
        return {
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-sm rounded-2xl border shadow-2xl transition-colors ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center pt-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${styles.bgColor}`}>
            <svg className={`w-8 h-8 ${styles.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.icon} />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center">
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </p>
        </div>

        {/* Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors text-white ${styles.buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
