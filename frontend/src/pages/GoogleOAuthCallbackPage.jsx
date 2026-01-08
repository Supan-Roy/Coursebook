import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleLogin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google authentication was cancelled or failed.');
      setLoading(false);
      localStorage.removeItem('oauth_state');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code || !state) {
      setError('Missing authorization code or state.');
      setLoading(false);
      localStorage.removeItem('oauth_state');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Verify state matches what we stored
    const storedState = localStorage.getItem('oauth_state');
    if (storedState && storedState !== state) {
      setError('Invalid state parameter. Security check failed.');
      setLoading(false);
      localStorage.removeItem('oauth_state');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Handle Google OAuth callback
    const handleCallback = async () => {
      // Start the login process (don't wait for it to complete)
      const loginPromise = handleGoogleLogin(code, state).catch(() => {
        // Silently catch - we'll check tokens anyway
        return { success: false };
      });
      
      // Clear stored state
      localStorage.removeItem('oauth_state');
      
      // Check for tokens immediately and multiple times
      // This is the definitive success indicator - tokens are set synchronously
      const checkTokens = () => localStorage.getItem('access_token');
      
      const navigateToDashboard = () => {
        if (isNavigatingRef.current) return; // Already navigating
        isNavigatingRef.current = true;
        setIsNavigating(true);
        setLoading(false);
        navigate('/dashboard', { replace: true });
      };
      
      // Check immediately
      if (checkTokens()) {
        navigateToDashboard();
        return;
      }
      
      // Wait a tiny bit for async token setting (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      if (checkTokens()) {
        navigateToDashboard();
        return;
      }
      
      // Wait for login promise to complete
      const result = await loginPromise;
      
      // Check tokens again after login completes
      if (checkTokens() || result?.success === true) {
        navigateToDashboard();
        return;
      }
      
      // Give multiple final checks with increasing delays
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (checkTokens()) {
          navigateToDashboard();
          return;
        }
      }
      
      // Only show error if we've confirmed no tokens exist after ALL checks AND we're not navigating
      if (!isNavigatingRef.current) {
        setError('Failed to authenticate. Please try again.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, handleGoogleLogin]);

  return (
    <>
      <div className="space-bg"></div>
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className={`glass-card rounded-2xl p-8 text-center ${isDarkMode ? 'bg-gray-900/90 border border-gray-800' : ''}`}>
            <div className="flex justify-center items-center mb-6">
              <img src="/coursebook.svg" alt="Coursebook" className="absolute w-12 h-12" style={{ left: '20px' }} />
              <CoursebookTextLogo className="w-64 h-16" isDarkMode={isDarkMode} />
            </div>
            
            {/* Always show loading spinner while processing - hide error until we're sure it failed */}
            {loading && (
              <>
                <div className="flex justify-center mb-4">
                  <svg className="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-400'}>Completing Google sign-in...</p>
              </>
            )}
            {/* Only show error if explicitly set, loading is false, and we're not navigating */}
            {error && !loading && !isNavigating && (
              <div className="mt-4 rounded-lg bg-red-500/10 border-2 border-red-500 p-4">
                <p className="text-sm text-red-400 font-medium">{error}</p>
                <p className="text-xs text-red-300 mt-2">Redirecting to login...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

