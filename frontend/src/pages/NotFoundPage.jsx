import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function NotFoundPage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-sm shadow bg-gradient-to-r transition-colors ${
          isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
            : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
              title="Go to Dashboard"
            >
              <img src="/coursebook.svg" alt="Coursebook" className="w-8 h-8 sm:w-9 sm:h-9" />
              <CoursebookTextLogo
                className="w-40 h-10 sm:w-44 sm:h-11"
                isDarkMode={isDarkMode}
                showUnderline={false}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className={`rounded-xl sm:rounded-2xl border p-8 sm:p-12 text-center transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-semibold tracking-wide mb-2 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>404</p>
          <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Page doesn&apos;t exist
          </h1>
          <p className={`text-sm sm:text-base mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The page you&apos;re looking for could not be found.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className={`px-5 py-2.5 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
