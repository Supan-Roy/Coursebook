import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleLogin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
      try {
        await handleGoogleLogin(code, state);
      } catch (err) {
        // Silently catch - we'll check tokens anyway
      }
      
      // Clear stored state
      localStorage.removeItem('oauth_state');
      
      // ALWAYS check for tokens FIRST - this is the definitive success indicator
      // Give a moment for tokens to be set
      await new Promise(resolve => setTimeout(resolve, 150));
      const hasToken = localStorage.getItem('access_token');
      
      if (hasToken) {
        // Tokens exist - SUCCESS! Navigate immediately, never set error
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // No tokens - check one more time after a brief delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const stillNoToken = !localStorage.getItem('access_token');
      
      if (stillNoToken) {
        // Really no tokens - show generic error (don't show communication errors)
        setError('Failed to authenticate. Please try again.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // Tokens appeared - navigate
        navigate('/dashboard', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, handleGoogleLogin]);

  return (
    <>
      <div className="space-bg"></div>
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="flex justify-center items-center mb-6">
              <img src="/coursebook.svg" alt="Coursebook" className="absolute w-12 h-12" style={{ left: '20px' }} />
              <CoursebookTextLogo className="w-64 h-16" />
            </div>
            
            {/* Always show loading spinner - never show error on this page if login succeeds */}
            {/* Error will only show if we explicitly set it AND navigation hasn't happened */}
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-400">Completing Google sign-in...</p>
            {/* Only show error if explicitly set and we're not navigating */}
            {error && !loading && (
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

