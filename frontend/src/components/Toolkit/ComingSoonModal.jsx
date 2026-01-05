import { FiX, FiClock } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

export default function ComingSoonModal({ title, description, onClose }) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isDarkMode ? 'bg-black/50' : 'bg-white/30'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <FiClock className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {title || 'Coming Soon'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {description || 'This feature is under development.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            We are polishing this tool to ensure it is fast, reliable, and easy to use. Stay tuned!
          </p>
          <ul className={`text-sm list-disc pl-5 space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>Built-in quality and performance safeguards</li>
            <li>Intuitive controls tailored for your workflow</li>
            <li>Secure processing with no surprises</li>
          </ul>
        </div>

        <div className={`flex justify-end gap-3 px-6 pb-6`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
