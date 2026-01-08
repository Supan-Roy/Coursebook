import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { initFloatingElementInteraction } from '../utils/floatingElementInteraction';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    initFloatingElementInteraction();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const result = await authService.requestPasswordReset(email);
      setStatus('success');
      setMessage(result.detail || 'Password reset link sent. Please check your email.');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to send password reset email. Please try again.');
    }
  };

  return (
    <>
      <div className="space-bg"></div>
      <div className="floating-element eq1">∑∫∂∇</div>
      <div className="floating-element eq2">E=mc²</div>
      <div className="floating-element eq3">λ = h/p</div>
      <div className="floating-element eq4">f(x) = y</div>
      <div className="floating-element eq5">π ≈ 3.14</div>
      <div className="particles">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className={`glass-card rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/90 border border-gray-800' : ''}`}>
            <div className="text-center mb-8">
              <div className="flex justify-center items-center mb-4 relative">
                <img src="/coursebook.svg" alt="Coursebook" className="absolute w-10 h-10 sm:w-12 sm:h-12" style={{ left: '10px' }} />
                <CoursebookTextLogo className="w-48 h-12 sm:w-64 sm:h-16" isDarkMode={isDarkMode} />
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Reset your password</p>
            </div>

            {status === 'success' ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Check Your Email</h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                </div>
                <Link
                  to="/login"
                  className="inline-block w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="rounded-lg bg-red-500/10 border-2 border-red-500 p-3">
                    <p className="text-sm text-red-400 font-medium">{message}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full px-3.5 py-2.5 text-sm border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="you@example.com"
                  />
                  <p className={`mt-1.5 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Remember your password?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

