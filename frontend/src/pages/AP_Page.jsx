import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function AP_Page() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="w-full max-w-2xl">
        <div className={`rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg transition-colors text-center ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          {/* Logo */}
          <div className="flex justify-center items-center mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src="/coursebook.svg" alt="Coursebook" className="w-12 h-12" />
            <CoursebookTextLogo className="w-48 h-16 ml-3" isDarkMode={isDarkMode} />
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Lock Icon */}
            <div className="flex justify-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <svg className={`w-12 h-12 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Admin Access Required
            </h1>

            {/* Sarcastic Message */}
            <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <p className={`text-lg sm:text-xl mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Admin is fine, what about you?
              </p>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Looks like you're trying to access something you shouldn't. Nice try though!
              </p>
            </div>

            {/* Fun Messages */}
            <div className="space-y-3">
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                🔒 This area is restricted to authorized personnel only
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                👀 How did you even find this page?
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                🤷‍♂️ Maybe try the dashboard instead?
              </p>
            </div>

            {/* Back Button */}
            <div className="pt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isDarkMode
                    ? 'bg-sky-600 hover:bg-sky-700 text-white'
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
              >
                Go Back to Dashboard
              </button>
            </div>

            {/* Easter Egg */}
            <div className="pt-8">
              <p className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                P.S. You're not in trouble... yet 😉
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

