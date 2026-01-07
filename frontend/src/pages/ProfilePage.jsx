import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const DOB_STORAGE_KEY = 'user_dob';
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    university: '',
  });
  const [dob, setDob] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        university: user.university || '',
      });
      const savedDob = typeof window !== 'undefined' ? localStorage.getItem(DOB_STORAGE_KEY) : '';
      setDob(savedDob || '');
    }
  }, [user]);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getGreeting = () => {
    const name = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || 'Student';

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const key = `${day}-${month}`;

    const specialDays = {
      '01-01': 'Happy New Year',
      '14-04': 'শুভ নববর্ষ',
      '21-02': 'আন্তর্জাতিক মাতৃভাষা দিবসের শুভেচ্ছা',
      '26-03': 'Happy Independence Day',
      '16-12': 'Happy Victory Day',
    };

    if (specialDays[key]) {
      return `${specialDays[key]}, ${name}!`;
    }

    if (dob) {
      const [year, monthStr, dayStr] = dob.split('-');
      if (monthStr && dayStr && dayStr.padStart(2, '0') === day && monthStr.padStart(2, '0') === month) {
        return `Happy Birthday, ${name}!`;
      }
    }

    return `Welcome, ${name}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authService.updateProfile(formData);
      await refreshUser();
      if (typeof window !== 'undefined') {
        if (dob) {
          localStorage.setItem(DOB_STORAGE_KEY, dob);
        } else {
          localStorage.removeItem(DOB_STORAGE_KEY);
        }
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey="settings"
        isDarkMode={isDarkMode}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-sm shadow bg-gradient-to-r transition-colors ${
          isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700'
            : 'from-gray-100 via-gray-200 to-gray-100 border-gray-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <img src="/coursebook.svg" alt="Coursebook" className="w-10 h-10" />
              <CoursebookTextLogo className="w-48 h-12" isDarkMode={isDarkMode} showUnderline={false} />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-900 border border-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {(() => {
                  const greeting = getGreeting();
                  const name = user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.first_name || 'Student';
                  if (greeting.includes(', ')) {
                    const parts = greeting.split(', ');
                    const message = parts.slice(0, -1).join(', ');
                    return (
                      <>
                        {message}, <span className={`font-semibold ${isDarkMode ? 'text-sky-300' : 'text-sky-600'}`}>{name}</span>{greeting.endsWith('!') ? '!' : ''}
                      </>
                    );
                  }
                  return greeting;
                })()}
              </span>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-sky-500/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-sky-500/50'}`}
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
              
              {/* Profile Dropdown */}
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

                {/* Dropdown Menu */}
                {showProfileMenu && (
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
                      <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-2xl p-8 border transition-colors ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200'}`}>
          {/* Profile Header */}
          <div className={`flex items-center gap-6 mb-8 pb-8 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-4xl">
              {user?.first_name?.[0] || 'S'}
            </div>
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your personal information</p>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`rounded-lg p-3 mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-2 border-green-500' 
                : 'bg-red-500/10 border-2 border-red-500'
            }`}>
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>{message.text}</p>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 text-sm border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 text-sm border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled
                value={formData.email}
                className={`block w-full px-4 py-3 text-sm border rounded-lg opacity-50 cursor-not-allowed ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email cannot be changed</p>
            </div>

            {/* Date of Birth (local only) */}
            <div>
              <label htmlFor="dob" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                disabled={!isEditing}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`block w-full px-4 py-3 text-sm border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Stored on this device only; used for birthday greetings.
              </p>
            </div>

            {/* University */}
            <div>
              <label htmlFor="university" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                University
              </label>
              <input
                id="university"
                name="university"
                type="text"
                disabled={!isEditing}
                value={formData.university}
                onChange={handleChange}
                placeholder="Enter your university name"
                className={`block w-full px-4 py-3 text-sm border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            {/* Account Info */}
            <div className={`pt-6 border-t ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Plan</span>
                  <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.plan || 'Free'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Storage Quota</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.quota_mb || 500} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Member Since</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                    setMessage({ type: '', text: '' });
                  }}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user?.first_name || '',
                        last_name: user?.last_name || '',
                        email: user?.email || '',
                        university: user?.university || '',
                      });
                      setMessage({ type: '', text: '' });
                    }}
                    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all border ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-900 border-gray-700 hover:border-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-gray-400'}`}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </main>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out of Coursebook?"
        confirmText="Log out"
        type="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/login');
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      </div>
    </div>
  );
}
