import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { GoogleAuthCallbackPage } from './pages/GoogleAuthCallbackPage';
import { VerificationSentPage } from './pages/VerificationSentPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { EmailVerifiedPage } from './pages/EmailVerifiedPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AuthBootstrap } from './features/auth/components/AuthBootstrap';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { PublicRoute } from './features/auth/components/PublicRoute';

export function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
          {/* Verification & Password Reset standalone pages */}
          <Route path="/verification-sent" element={<VerificationSentPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/email-verified" element={<EmailVerifiedPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          {/* Canonical Public User Profile Route */}
          <Route path="/u/:username" element={<ProfilePage />} />
          {/* Canonical Project Details Route */}
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
export default App;