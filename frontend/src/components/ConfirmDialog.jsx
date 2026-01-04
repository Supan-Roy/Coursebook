import { useTheme } from '../context/ThemeContext';

export default function ConfirmDialog({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning', onConfirm, onCancel }) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          buttonColor: 'bg-red-500 hover:bg-red-600',
        };
      case 'success':
        return {
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          buttonColor: 'bg-green-500 hover:bg-green-600',
        };
      case 'info':
        return {
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
        };
      default: // warning
        return {
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
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
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${styles.bgColor} ${styles.borderColor} ${styles.textColor}`}>
            {styles.icon}
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

        {/* Buttons */}
        <div className={`flex gap-3 px-6 pb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onCancel}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors text-white ${styles.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
