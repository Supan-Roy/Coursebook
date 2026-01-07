import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initFloatingElementInteraction } from '../utils/floatingElementInteraction';
import CoursebookTextLogo from '../components/CoursebookTextLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initFloatingElementInteraction();
    // Check for message from registration or other pages
    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError(result.error);
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
      <div className="floating-element code1">const x = 42</div>
      <div className="floating-element code2">def learn():</div>
      <div className="floating-element symbol1">⚛</div>
      <div className="floating-element symbol2">∞</div>
      <div className="floating-element small1">α β γ δ</div>
      <div className="floating-element small2">∂²f/∂x²</div>
      <div className="floating-element small3">Σ(i=1)</div>
      <div className="floating-element large1">∑</div>
      <div className="floating-element large2">∫</div>
      <div className="floating-element medium1">⚘</div>
      <div className="floating-element medium2">◆</div>
      <div className="floating-element medium3">✦</div>
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
              <p className="text-sm text-gray-400">Sign in to your account</p>
            </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {infoMessage && (
            <div className="rounded-lg bg-blue-500/10 border-2 border-blue-500 p-3">
              <p className="text-sm text-blue-400 font-medium">{infoMessage}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/10 border-2 border-red-500 p-3">
              <p className="text-sm text-red-400 font-medium">{error}</p>
              {error.includes('verify') && (
                <p className="text-xs text-red-300 mt-2">
                  <Link to="/resend-verification" className="underline hover:text-red-200">
                    Resend verification email
                  </Link>
                  {' '}or check your backend console in development mode.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
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
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create account
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </p>
        </div>
          </div>
        </div>
      </div>
    </>
  );
}
