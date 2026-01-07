import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services';
import { initFloatingElementInteraction } from '../utils/floatingElementInteraction';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    initFloatingElementInteraction();
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const result = await authService.verifyEmail(verificationToken);
      setStatus('success');
      setMessage(result.detail || 'Email verified successfully!');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to verify email. The link may have expired.');
    }
  };

  const handleResend = () => {
    navigate('/resend-verification');
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
              <p className="text-sm text-gray-400">Email Verification</p>
            </div>

            {status === 'verifying' && (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Verified!</h3>
                  <p className="text-sm text-gray-600 mb-4">{message}</p>
                </div>
                <Link
                  to="/login"
                  className="inline-block w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Continue to Login
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
                  <p className="text-sm text-gray-600 mb-4">{message}</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleResend}
                    className="w-full py-2.5 px-4 border border-primary-600 rounded-lg text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    Resend Verification Email
                  </button>
                  <Link
                    to="/login"
                    className="block w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

