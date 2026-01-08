import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { initFloatingElementInteraction } from '../utils/floatingElementInteraction';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    initFloatingElementInteraction();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const result = await authService.resendVerificationEmail(email);
      setStatus('success');
      setMessage(result.detail || 'Verification email sent. Please check your inbox (or console in development).');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to send verification email. Please try again.');
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
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center items-center mb-4 relative">
                <img src="/coursebook.svg" alt="Coursebook" className="absolute w-12 h-12" style={{ left: '20px' }} />
                <CoursebookTextLogo className="w-64 h-16" />
              </div>
              <p className="text-sm text-gray-400">Resend verification OTP</p>
            </div>

            {status === 'success' ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Sent!</h3>
                  <p className="text-sm text-gray-600 mb-2">{message}</p>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/verify-email"
                    state={{ email }}
                    className="inline-block w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Go to Verification Page
                  </Link>
                  <Link
                    to="/login"
                    className="inline-block w-full py-2.5 px-4 border border-primary-600 rounded-lg text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="rounded-lg bg-red-500/10 border-2 border-red-500 p-3">
                    <p className="text-sm text-red-400 font-medium">{message}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Enter your email address and we'll send you a new verification OTP code.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {status === 'loading' ? 'Sending...' : 'Resend Verification OTP'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

