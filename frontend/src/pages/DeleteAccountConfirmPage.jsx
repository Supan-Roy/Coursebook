import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function DeleteAccountConfirmPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('confirming'); // confirming, deleting, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid deletion link.');
    }
  }, [token]);

  const handleConfirm = async () => {
    setStatus('deleting');
    setMessage('Deleting your account...');

    try {
      await authService.confirmAccountDeletion(token);
      setStatus('success');
      setMessage('Your account has been permanently deleted.');
      
      // Clear local storage and redirect after delay
      setTimeout(() => {
        localStorage.clear();
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to delete account. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <img src="/coursebook.svg" alt="Coursebook" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0" />
              <CoursebookTextLogo className="w-36 h-9 sm:w-40 sm:h-10 md:w-48 md:h-12 flex-shrink-0" isDarkMode={false} />
            </div>
            <p className="text-xs sm:text-sm text-gray-400">Confirm Account Deletion</p>
          </div>

          {status === 'confirming' && (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className={`rounded-lg p-3 sm:p-4 border-2 bg-red-50 border-red-200`}>
                <p className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-red-600">
                  ⚠️ Final Warning
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  This action will permanently delete your Coursebook account and all associated data. 
                  This cannot be undone.
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleConfirm}
                  className="w-full py-2 sm:py-2.5 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 sm:py-2.5 px-4 border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status === 'deleting' && (
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs sm:text-sm text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">Account Deleted</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{message}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Redirecting to login page...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">Deletion Failed</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{message}</p>
              </div>
              <Link
                to="/login"
                className="inline-block w-full py-2 sm:py-2.5 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

