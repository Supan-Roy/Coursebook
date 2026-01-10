import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return window.innerWidth < 1024 ? true : localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [storageAlerts, setStorageAlerts] = useState(true);
  const profileMenuRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);


  return (
    <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey="settings"
        isDarkMode={isDarkMode}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16 ml-0' : 'lg:ml-64 ml-0'}`}>
        <header
          className={`border-b sticky top-0 z-20 backdrop-blur-sm shadow bg-gradient-to-r transition-colors ${
            isDarkMode
              ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
              : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
          }`}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
            <div className="flex justify-between items-center h-16 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0 overflow-hidden">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  aria-label="Toggle menu"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-[1px] sm:gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Go to Dashboard"
                >
                  <img src="/coursebook.svg" alt="Coursebook" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                  <CoursebookTextLogo className="w-36 h-9 sm:w-28 sm:h-7 md:w-40 md:h-10 lg:w-48 lg:h-12 flex-shrink-0" isDarkMode={isDarkMode} showUnderline={false} />
                </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
                {/* Mobile greeting - Welcome, First Name */}
                <span className={`text-[10px] sm:text-xs md:text-sm lg:hidden truncate max-w-[80px] sm:max-w-[100px] ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                  {(() => {
                    const firstName = user?.first_name || 'User';
                    return <><span className={`font-semibold ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>Welcome, {firstName}</span></>;
                  })()}
                </span>
                <div className="hidden lg:flex flex-col items-end">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.first_name || 'Student'}
                  </span>
                </div>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg transition-all border flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                
                {/* Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-2 rounded-lg transition-all border flex-shrink-0 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                  >
                    {user?.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt="Profile"
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-sky-500/50"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg">
                        {user?.first_name?.[0] || 'S'}
                      </div>
                    )}
                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                      <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.first_name} {user?.last_name}</p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                        </div>
                        <div className="p-2">
                          <button
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/profile');
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </button>
                          <button
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/settings');
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 lg:py-6 space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
          <section className={`rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1.5 sm:gap-2">
              <div>
                <p className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Account</p>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">Profile</h1>
                <p className={`mt-0.5 text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your personal info and avatar from your profile page.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Signed in as</p>
                <p className={`text-xs sm:text-sm md:text-base font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p className={`text-[9px] sm:text-[10px] md:text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-base rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Open profile
              </button>
            </div>
          </section>

          <section className={`rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <div>
                <p className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notifications</p>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">Alerts & emails</h2>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              <label className="flex items-start sm:items-center gap-1.5 sm:gap-2">
                <input type="checkbox" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mt-0.5 sm:mt-0 flex-shrink-0" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value ? e.target.checked : e.target.checked)} />
                <span className={`text-xs sm:text-sm md:text-base break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Email updates about new summaries and reminders</span>
              </label>
              <label className="flex items-start sm:items-center gap-1.5 sm:gap-2">
                <input type="checkbox" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mt-0.5 sm:mt-0 flex-shrink-0" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.value ? e.target.checked : e.target.checked)} />
                <span className={`text-xs sm:text-sm md:text-base break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Browser push notifications</span>
              </label>
              <label className="flex items-start sm:items-center gap-1.5 sm:gap-2">
                <input type="checkbox" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mt-0.5 sm:mt-0 flex-shrink-0" checked={storageAlerts} onChange={(e) => setStorageAlerts(e.target.value ? e.target.checked : e.target.checked)} />
                <span className={`text-xs sm:text-sm md:text-base break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Storage limit alerts</span>
              </label>
            </div>
          </section>

          <section className={`rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div>
                <p className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Danger zone</p>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">Account deletion</h2>
              </div>
            </div>
            <p className={`text-xs sm:text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 sm:mb-3`}>
              Permanently delete your account and data. This action cannot be undone. 
              You'll receive a confirmation email to complete the deletion.
            </p>
            <button
              type="button"
              onClick={() => navigate('/delete-account')}
              className="w-full sm:w-auto px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-base rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
            >
              Delete account
            </button>
          </section>
        </main>

      </div>
    </div>
  );
}

