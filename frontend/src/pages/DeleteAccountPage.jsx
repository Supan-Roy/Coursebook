import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import { authService } from '../services';

const DELETION_REASONS = [
  'I no longer need this account',
  'I found a better alternative',
  'Privacy concerns',
  'Too expensive',
  'Too complicated to use',
  'I\'m not using it enough',
  'Technical issues',
  'Other'
];

export default function DeleteAccountPage() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [selectedReasons, setSelectedReasons] = useState({});
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReasonChange = (reason) => {
    setSelectedReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare deletion reasons
      const deletionReasons = { ...selectedReasons };
      if (otherReason.trim()) {
        deletionReasons['Other'] = true;
        deletionReasons['OtherText'] = otherReason.trim();
      }

      await authService.requestAccountDeletion(
        Object.keys(deletionReasons).length > 0 ? deletionReasons : undefined
      );
      
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send deletion confirmation email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeKey="settings"
          isDarkMode={isDarkMode}
        />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16 ml-0' : 'lg:ml-64 ml-0'}`}>
          <div className="p-4 sm:p-6 lg:p-8">
            <div className={`max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Check Your Email</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  We've sent a confirmation email to <strong>{user?.email}</strong>. 
                  Please click the link in the email to confirm account deletion.
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  The confirmation link will expire in 24 hours.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => navigate('/settings')}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      isDarkMode 
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Back to Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 flex ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeKey="settings"
        isDarkMode={isDarkMode}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className={`max-w-2xl mx-auto rounded-2xl p-6 sm:p-8 border ${isDarkMode ? 'glass-card border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Delete Account</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We're sorry to see you go. Your feedback helps us improve.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Why are you deleting your account? (Optional)
                </label>
                <div className="space-y-2">
                  {DELETION_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        isDarkMode
                          ? selectedReasons[reason]
                            ? 'bg-red-500/20 border-2 border-red-500/50'
                            : 'bg-gray-800/50 border-2 border-gray-700 hover:bg-gray-800'
                          : selectedReasons[reason]
                            ? 'bg-red-50 border-2 border-red-200'
                            : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReasons[reason] || false}
                        onChange={() => handleReasonChange(reason)}
                        className="mr-3 w-4 h-4 text-red-600 focus:ring-red-500 rounded"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>
                
                {selectedReasons['Other'] && (
                  <div className="mt-3">
                    <textarea
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Please tell us more..."
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                )}
              </div>

              <div className={`rounded-lg p-4 border-2 ${isDarkMode ? 'bg-red-500/10 border-red-500/50' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  ⚠️ Warning: This action cannot be undone
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Once you confirm deletion via email, all your data including courses, materials, todos, and settings will be permanently deleted. This action is irreversible.
                </p>
              </div>

              {error && (
                <div className={`rounded-lg p-3 border-2 ${isDarkMode ? 'bg-red-500/10 border-red-500' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    isDarkMode
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  } transition-colors`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Request Account Deletion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

