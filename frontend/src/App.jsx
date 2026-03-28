import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivateRoute } from './components/PrivateRoute';
import { warmUpBackend } from './utils/backendWarmup';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TrashBinPage from './pages/TrashBinPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AboutPage from './pages/AboutPage';
import AP_Page from './pages/AP_Page';
import UpgradePage from './pages/UpgradePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import GoogleOAuthCallbackPage from './pages/GoogleOAuthCallbackPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import DeleteAccountConfirmPage from './pages/DeleteAccountConfirmPage';
import SharedContentPage from './pages/SharedContentPage';
import SharedCourseDetailPage from './pages/SharedCourseDetailPage';
import HelpSupportPage from './pages/HelpSupportPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  useEffect(() => {
    // Fire-and-forget warm-up request so initial render is never blocked.
    void warmUpBackend({ retries: 2, initialDelayMs: 600 });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/auth/google/callback" element={<GoogleOAuthCallbackPage />} />
          <Route path="/delete-account-confirm/:token" element={<DeleteAccountConfirmPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/course/:courseId"
            element={
              <PrivateRoute>
                <CourseDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/delete-account"
            element={
              <PrivateRoute>
                <DeleteAccountPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <PrivateRoute>
                <TrashBinPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/upgrade"
            element={
              <PrivateRoute>
                <UpgradePage />
              </PrivateRoute>
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help-support" element={<HelpSupportPage />} />
          <Route path="/admin" element={<AP_Page />} />
          <Route path="/shared/:token" element={<SharedContentPage />} />
          <Route path="/shared/:token/course/:courseId" element={<SharedCourseDetailPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
