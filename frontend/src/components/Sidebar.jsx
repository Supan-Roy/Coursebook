import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

export default function Sidebar({
  collapsed,
  onToggle,
  activeKey,
  onSelectTab,
  onHelp,
  isDarkMode = false,
}) {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const baseItem =
    'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all';

  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const hoverText = isDarkMode ? 'hover:text-white' : 'hover:text-gray-900';
  const hoverBg = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  const pillActive = (isActive) =>
    isActive
      ? isDarkMode
        ? 'bg-sky-500/20 text-sky-400'
        : 'bg-sky-50 text-sky-600'
      : `${textMuted} ${hoverBg} ${hoverText}`;

  const handleTab = (key) => {
    if (onSelectTab) {
      onSelectTab(key);
    } else {
      navigate('/dashboard');
    }
  };

  const handleHelp = () => {
    if (onHelp) return onHelp();
    alert('Need help? Contact support@coursebook.com');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen z-30 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${isDarkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'} ${
          collapsed ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Sidebar Header */}
      <div
        className={`h-16 flex items-center justify-between px-4 border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Menu
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors ${collapsed ? 'mx-auto' : ''} ${
            isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Sidebar Menu */}
      <nav className="p-3 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        {isAuthenticated && (
          <>
            <button
              onClick={() => handleTab('dashboard')}
              className={`${baseItem} ${pillActive(activeKey === 'dashboard')}`}
              title="Dashboard"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!collapsed && <span className="font-medium">Dashboard</span>}
            </button>

            <button
              onClick={() => handleTab('workspace')}
              className={`${baseItem} ${pillActive(activeKey === 'workspace')}`}
              title="Workspace"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {!collapsed && <span className="font-medium">Workspace</span>}
            </button>

            <button
              onClick={() => handleTab('todos')}
              className={`${baseItem} ${pillActive(activeKey === 'todos')}`}
              title="My Plans"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {!collapsed && <span className="font-medium">My Plans</span>}
            </button>
          </>
        )}

        <button
          onClick={() => handleTab('toolkit')}
          className={`${baseItem} ${pillActive(activeKey === 'toolkit')}`}
          title="PDF Toolkit"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          {!collapsed && <span className="font-medium">PDF Toolkit</span>}
        </button>

        {isAuthenticated && (
          <>
            <div className={`border-t my-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}></div>

            <button
              onClick={() => navigate('/trash')}
              className={`${baseItem} ${textMuted} ${hoverBg} ${hoverText}`}
              title="Trash Bin"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {!collapsed && <span className="font-medium">Trash Bin</span>}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className={`${baseItem} ${pillActive(activeKey === 'settings')}`}
              title="Settings"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!collapsed && <span className="font-medium">Settings</span>}
            </button>

            <div className={`border-t my-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}></div>

            <button
              onClick={() => navigate('/upgrade')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl ${
                !collapsed && 'justify-center'
              }`}
              title="Upgrade plan"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {!collapsed && <span className="font-bold">Upgrade</span>}
            </button>
          </>
        )}

        <button
          onClick={handleHelp}
          className={`${baseItem} ${textMuted} ${hoverBg} ${hoverText}`}
          title="Help & Support"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!collapsed && <span className="font-medium">Help & Support</span>}
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300"
            title="Logout"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        )}
        
        {!isAuthenticated && (
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'} ${!collapsed && 'justify-center'}`}
              title="Sign In"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {!collapsed && <span className="font-medium">Sign In</span>}
            </button>
            <button
              onClick={() => navigate('/register')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl ${!collapsed && 'justify-center'}`}
              title="Sign Up"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {!collapsed && <span className="font-bold">Sign Up</span>}
            </button>
          </div>
        )}
      </nav>

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
    </aside>
    </>
  );
}

