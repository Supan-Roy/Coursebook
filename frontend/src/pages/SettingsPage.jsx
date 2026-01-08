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
    return localStorage.getItem('sidebarCollapsed') === 'true';
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
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header
          className={`border-b backdrop-blur-sm sticky top-0 z-30 shadow bg-gradient-to-r transition-colors ${
            isDarkMode
              ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
              : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                  title="Back to Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <img src="/coursebook.svg" alt="Coursebook" className="w-10 h-10 hover:opacity-80 transition-opacity" />
                <CoursebookTextLogo className="w-48 h-12 hover:opacity-80 transition-opacity" isDarkMode={isDarkMode} showUnderline={false} />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.first_name?.[0] || 'S'}
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <section className={`rounded-2xl p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Account</p>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your personal info and avatar from your profile page.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Signed in as</p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-colors"
              >
                Open profile
              </button>
            </div>
          </section>

          <section className={`rounded-2xl p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notifications</p>
                <h2 className="text-xl font-bold">Alerts & emails</h2>
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value ? e.target.checked : e.target.checked)} />
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Email updates about new summaries and reminders</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.value ? e.target.checked : e.target.checked)} />
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Browser push notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4" checked={storageAlerts} onChange={(e) => setStorageAlerts(e.target.value ? e.target.checked : e.target.checked)} />
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Storage limit alerts</span>
              </label>
            </div>
          </section>

          <section className={`rounded-2xl p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Danger zone</p>
                <h2 className="text-xl font-bold">Account deletion</h2>
              </div>
            </div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Permanently delete your account and data. This action cannot be undone. 
              You'll receive a confirmation email to complete the deletion.
            </p>
            <button
              type="button"
              onClick={() => navigate('/delete-account')}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
            >
              Delete account
            </button>
          </section>
        </main>

      </div>
    </div>
  );
}

