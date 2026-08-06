import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { PasswordField } from './PasswordField';
import { SocialLoginButtons } from './SocialLoginButtons';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/authStore';
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});
type LoginFormData = z.infer<typeof loginSchema>;
export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginWithCredentials = useAuthStore((state) => state.loginWithCredentials);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  useEffect(() => {
    clearError();
  }, [clearError]);
  const locationState = location.state as { message?: string } | null;
  const onSubmit = async (data: LoginFormData) => {
    clearErrors();
    try {
      await loginWithCredentials({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe ?? false,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      setError('root', { type: 'server', message });
    }
  };
  return (
    <div className="space-y-6 text-left">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
          Welcome Back
        </h2>
        <p className="font-sans text-xs text-[#cac6bc]">
          Continue building incredible games with your team.
        </p>
        {locationState?.message ? (
          <p className="rounded-md border border-[#48473f] bg-[#141312] px-3 py-2 text-xs font-mono text-[#e6e2df]">
            {locationState.message}
          </p>
        ) : null}
      </div>
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c887e]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              placeholder="name@studio.com"
              className={`w-full pl-10 pr-4 py-2.5 bg-[#141312] border text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner transition-all placeholder:text-[#8c887e]/60 focus:outline-none focus:ring-2 focus:ring-[#939188]/40 ${
                errors.email
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-[#48473f] focus:border-[#e6e2df]'
              }`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="text-xs font-mono text-red-400 pt-0.5">
              {errors.email.message}
            </p>
          )}
        </div>
        {/* Password Field */}
        <PasswordField
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded bg-[#141312] border-[#48473f] text-[#e6e2df] focus:ring-1 focus:ring-[#939188] focus:ring-offset-0 accent-[#48473f]"
              {...register('rememberMe')}
            />
            <span className="text-xs font-mono text-[#cac6bc] group-hover:text-[#e6e2df] transition-colors">
              Remember Me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-mono text-[#cac6bc] hover:text-[#e6e2df] hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        {/* Primary Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isAuthenticating}
          icon={isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          className="w-full justify-center mt-2 py-3 text-sm font-semibold"
        >
          {isAuthenticating ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      {errors.root?.message || authError ? (
        <p className="text-sm text-red-400">{errors.root?.message ?? authError}</p>
      ) : null}
      {/* Divider */}
      <div className="relative py-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2b2a29]" />
        </div>
        <span className="relative z-10 px-3 bg-[#1c1b1a] text-[10px] font-mono text-[#8c887e] uppercase tracking-widest">
          OR
        </span>
      </div>
      {/* Social Logins */}
      <SocialLoginButtons />
      {/* Bottom Switch Link */}
      <div className="pt-2 text-center text-xs font-sans text-[#8c887e]">
        <span>Don't have an account? </span>
        <Link
          to="/register"
          className="font-mono text-[#e6e2df] hover:underline font-semibold transition-colors"
        >
          Create one
        </Link>
      </div>
    </div>
  );
};