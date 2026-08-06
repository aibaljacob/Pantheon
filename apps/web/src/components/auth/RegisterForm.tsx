import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { PasswordField } from './PasswordField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SocialLoginButtons } from './SocialLoginButtons';
import { Mail, User, AtSign, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/authStore';
import { checkEmailAvailability, checkUsernameAvailability } from '../../features/auth/services/authService';
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(50, 'Full name must be at most 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/, 'Only lowercase letters, numbers, dots, hyphens and underscores allowed'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Must include uppercase, lowercase, number & special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service & Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type RegisterFormData = z.infer<typeof registerSchema>;
export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const registerWithCredentials = useAuthStore((state) => state.registerWithCredentials);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [usernameStatus, setUsernameStatus] = useState<{ loading: boolean; available?: boolean; message?: string }>({ loading: false });
  const [emailStatus, setEmailStatus] = useState<{ loading: boolean; available?: boolean; message?: string }>({ loading: false });
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: true,
    },
  });
  const watchedFullName = watch('fullName');
  const watchedUsername = watch('username');
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');
  useEffect(() => {
    clearError();
  }, [clearError]);
  // Debounced Username availability check
  useEffect(() => {
    const usernameTrimmed = (watchedUsername || '').trim().toLowerCase();
    if (!usernameTrimmed || usernameTrimmed.length < 3 || !/^[a-z0-9._-]+$/.test(usernameTrimmed)) {
      setUsernameStatus({ loading: false });
      return;
    }
    setUsernameStatus({ loading: true });
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(usernameTrimmed);
        setUsernameStatus({ loading: false, available: res.data.available, message: res.message });
      } catch {
        setUsernameStatus({ loading: false });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [watchedUsername]);
  // Debounced Email availability check
  useEffect(() => {
    const emailTrimmed = (watchedEmail || '').trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      setEmailStatus({ loading: false });
      return;
    }
    setEmailStatus({ loading: true });
    const timer = setTimeout(async () => {
      try {
        const res = await checkEmailAvailability(emailTrimmed);
        setEmailStatus({ loading: false, available: res.data.available, message: res.message });
      } catch {
        setEmailStatus({ loading: false });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [watchedEmail]);
  function splitFullName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' ') || parts[0] || '',
    };
  }
  const onSubmit = async (data: RegisterFormData) => {
    clearErrors();
    if (usernameStatus.available === false) {
      setError('username', { type: 'manual', message: 'That username is already taken.' });
      return;
    }
    if (emailStatus.available === false) {
      setError('email', { type: 'manual', message: 'An account with this email already exists.' });
      return;
    }
    const { firstName, lastName } = splitFullName(data.fullName);
    try {
      await registerWithCredentials({
        firstName,
        lastName,
        username: data.username.toLowerCase().trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.terms,
      });
      navigate('/verification-sent', {
        replace: true,
        state: { email: data.email },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed.';
      setError('root', { type: 'server', message });
    }
  };
  const isFullNameValid = watchedFullName && !errors.fullName;
  const passwordsMatch = watchedConfirmPassword && watchedPassword && watchedConfirmPassword === watchedPassword;
  const passwordsMismatch = watchedConfirmPassword && watchedPassword && watchedConfirmPassword !== watchedPassword;
  return (
    <div className="space-y-6 text-left">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
          Create Your Account
        </h2>
        <p className="font-sans text-xs text-[#cac6bc]">
          Join the next generation of game creators.
        </p>
      </div>
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="reg-fullname" className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c887e]">
              <User className="w-4 h-4" />
            </div>
            <input
              id="reg-fullname"
              type="text"
              placeholder="Elena Rostova"
              className={`w-full pl-10 pr-10 py-2.5 bg-[#141312] border text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner transition-all placeholder:text-[#8c887e]/60 focus:outline-none focus:ring-2 focus:ring-[#939188]/40 ${
                errors.fullName
                  ? 'border-red-500/80 focus:border-red-500'
                  : isFullNameValid
                  ? 'border-emerald-500/80 focus:border-emerald-500'
                  : 'border-[#48473f] focus:border-[#e6e2df]'
              }`}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'reg-fullname-error' : undefined}
              {...register('fullName')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {isFullNameValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {errors.fullName && <AlertCircle className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          {errors.fullName && (
            <p id="reg-fullname-error" className="text-xs font-mono text-red-400 pt-0.5">
              {errors.fullName.message}
            </p>
          )}
        </div>
        {/* Username Field */}
        <div className="space-y-1.5">
          <label htmlFor="reg-username" className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c887e]">
              <AtSign className="w-4 h-4" />
            </div>
            <input
              id="reg-username"
              type="text"
              placeholder="elena.rostova"
              className={`w-full pl-10 pr-10 py-2.5 bg-[#141312] border text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner transition-all placeholder:text-[#8c887e]/60 focus:outline-none focus:ring-2 focus:ring-[#939188]/40 ${
                errors.username || usernameStatus.available === false
                  ? 'border-red-500/80 focus:border-red-500'
                  : usernameStatus.available === true
                  ? 'border-emerald-500/80 focus:border-emerald-500'
                  : 'border-[#48473f] focus:border-[#e6e2df]'
              }`}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'reg-username-error' : undefined}
              {...register('username')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {usernameStatus.loading && <Loader2 className="w-4 h-4 text-[#8c887e] animate-spin" />}
              {!usernameStatus.loading && usernameStatus.available === true && !errors.username && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {(!usernameStatus.loading && usernameStatus.available === false) || errors.username ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
                ) : null}
            </div>
          </div>
          {errors.username ? (
            <p id="reg-username-error" className="text-xs font-mono text-red-400 pt-0.5">
              {errors.username.message}
            </p>
          ) : usernameStatus.available === false ? (
            <p className="text-xs font-mono text-red-400 pt-0.5">{usernameStatus.message}</p>
          ) : usernameStatus.available === true ? (
            <p className="text-xs font-mono text-emerald-400 pt-0.5">{usernameStatus.message}</p>
          ) : null}
        </div>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c887e]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="reg-email"
              type="email"
              placeholder="elena@studio.com"
              className={`w-full pl-10 pr-10 py-2.5 bg-[#141312] border text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner transition-all placeholder:text-[#8c887e]/60 focus:outline-none focus:ring-2 focus:ring-[#939188]/40 ${
                errors.email || emailStatus.available === false
                  ? 'border-red-500/80 focus:border-red-500'
                  : emailStatus.available === true
                  ? 'border-emerald-500/80 focus:border-emerald-500'
                  : 'border-[#48473f] focus:border-[#e6e2df]'
              }`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
              {...register('email')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {emailStatus.loading && <Loader2 className="w-4 h-4 text-[#8c887e] animate-spin" />}
              {!emailStatus.loading && emailStatus.available === true && !errors.email && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {(!emailStatus.loading && emailStatus.available === false) || errors.email ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : null}
            </div>
          </div>
          {errors.email ? (
            <p id="reg-email-error" className="text-xs font-mono text-red-400 pt-0.5">
              {errors.email.message}
            </p>
          ) : emailStatus.available === false ? (
            <p className="text-xs font-mono text-red-400 pt-0.5">{emailStatus.message}</p>
          ) : emailStatus.available === true ? (
            <p className="text-xs font-mono text-emerald-400 pt-0.5">{emailStatus.message}</p>
          ) : null}
        </div>
        {/* Password Field */}
        <PasswordField
          label="Password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        {/* Password Strength Meter */}
        <PasswordStrengthMeter password={watchedPassword} />
        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <PasswordField
            label="Confirm Password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {passwordsMatch && (
            <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passwords match
            </p>
          )}
          {passwordsMismatch && touchedFields.confirmPassword && (
            <p className="text-xs font-mono text-red-400 flex items-center gap-1.5 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Passwords do not match
            </p>
          )}
        </div>
        {/* Terms Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded bg-[#141312] border-[#48473f] text-[#e6e2df] focus:ring-1 focus:ring-[#939188] focus:ring-offset-0 accent-[#48473f]"
              {...register('terms')}
            />
            <span className="text-xs font-sans text-[#cac6bc] leading-tight">
              I agree to the{' '}
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service dialog'); }} className="text-[#e6e2df] hover:underline font-mono">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy dialog'); }} className="text-[#e6e2df] hover:underline font-mono">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs font-mono text-red-400 pl-6">
              {errors.terms.message}
            </p>
          )}
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
          {isAuthenticating ? 'Creating Account...' : 'Create Account'}
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
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="font-mono text-[#e6e2df] hover:underline font-semibold transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};