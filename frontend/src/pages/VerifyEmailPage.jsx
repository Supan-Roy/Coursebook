import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function VerifyEmailPage() {
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle, verifying, success, error
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Set up countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        // Focus last filled input
        const lastIndex = Math.min(digits.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setStatus('error');
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage('Please enter the complete 6-digit OTP');
      setStatus('error');
      return;
    }

    setStatus('verifying');
    setMessage('');

    try {
      const result = await authService.verifyEmail(email, otpString);
      
      // If tokens are returned, auto-login the user
      if (result.access && result.refresh) {
        // Store tokens
        localStorage.setItem('access_token', result.access);
        localStorage.setItem('refresh_token', result.refresh);
        
        // Update auth context by reloading the page or using a refresh
        // The AuthContext will detect the tokens on next render
        setStatus('success');
        setMessage(result.detail || 'Email verified successfully! Redirecting to dashboard...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        // Fallback if tokens aren't returned (shouldn't happen with new backend)
        setStatus('success');
        setMessage(result.detail || 'Email verified successfully!');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to verify email. Please check your OTP and try again.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendMessage('Please enter your email address first');
      return;
    }

    setResendLoading(true);
    setResendMessage('');
    
    try {
      const response = await authService.resendVerificationEmail(email);
      setResendMessage(response.detail || 'Verification OTP sent! Please check your inbox.');
      setCountdown(60); // 60 second cooldown
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setResendMessage(
        err.response?.data?.detail || 
        'If an account with this email exists, a verification OTP has been sent.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 transition-colors ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="w-full max-w-md">
        <div className={`rounded-2xl p-8 shadow-lg transition-colors ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          <div className="text-center mb-6">
            <Link to="/dashboard" className="block">
              <div className="flex justify-center items-center mb-4 relative cursor-pointer hover:opacity-80 transition-opacity">
                <img src="/coursebook.svg" alt="Coursebook" className="absolute w-12 h-12" style={{ left: '20px' }} />
                <CoursebookTextLogo className="w-64 h-16" isDarkMode={isDarkMode} />
              </div>
            </Link>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Email Verification</p>
          </div>

          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Verified!</h3>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                {message.includes('Redirecting') && (
                  <div className="flex justify-center">
                    <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              {!message.includes('Redirecting') && (
                <Link
                  to="/login"
                  className="inline-block w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Continue to Login
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  EMAIL ADDRESS
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'verifying'}
                  className={`block w-full px-3.5 py-2.5 text-sm border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 disabled:bg-gray-800/50' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 disabled:bg-gray-100'
                  }`}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  ENTER VERIFICATION CODE
                </label>
                <div className="flex justify-center gap-2 mb-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={status === 'verifying'}
                      className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:cursor-not-allowed ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-white disabled:bg-gray-800/50' 
                          : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {message && (
                <div className={`rounded-lg p-3 ${
                  status === 'error' 
                    ? 'bg-red-500/10 border-2 border-red-500' 
                    : 'bg-blue-500/10 border-2 border-blue-500'
                }`}>
                  <p className={`text-sm font-medium ${
                    status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'verifying' || otp.join('').length !== 6 || !email}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {status === 'verifying' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || countdown > 0 || !email}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-primary-600 rounded-lg text-sm font-semibold text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend OTP (${countdown}s)`
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Resend Verification OTP
                    </>
                  )}
                </button>
                {resendMessage && (
                  <p className={`text-xs text-center ${
                    resendMessage.includes('sent') || resendMessage.includes('OTP') 
                      ? 'text-green-500' 
                      : 'text-gray-500'
                  }`}>
                    {resendMessage}
                  </p>
                )}
              </div>

              <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Link
                  to="/login"
                  className="block text-center text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Back to Sign In →
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
