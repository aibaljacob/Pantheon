import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/auth/PasswordField';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../features/auth/services/authService';
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Must include uppercase, lowercase, number & special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');
  const passwordsMatch = watchedConfirmPassword && watchedPassword && watchedConfirmPassword === watchedPassword;
  const passwordsMismatch = watchedConfirmPassword && watchedPassword && watchedConfirmPassword !== watchedPassword;
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Reset token is missing from URL.');
      return;
    }
    setIsSubmitting(true);
    setServerError(null);
    try {
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset successfully. Please sign in with your new password.' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!token) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-left">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#ffffff]">
              Invalid Password Reset Link
            </h2>
            <p className="mt-1 font-sans text-xs text-red-400">
              No reset token found in the web link. Please request a new password reset.
            </p>
          </div>
          <Link to="/forgot-password" className="block w-full">
            <Button type="button" variant="primary" size="md" className="w-full justify-center text-xs font-semibold">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout>
      <div className="space-y-6 text-left">
        {/* Header Icon & Title */}
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#48473f] bg-[#1c1b1a] text-[#e6e2df]">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
              Create New Password
            </h2>
            <p className="mt-1 font-sans text-xs text-[#cac6bc] leading-relaxed">
              Your new password must be different from previously used passwords.
            </p>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <PasswordField
            label="New Password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrengthMeter password={watchedPassword} />
          <div className="space-y-1.5">
            <PasswordField
              label="Confirm New Password"
              placeholder="Re-enter your new password"
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
          {serverError && (
            <p className="text-xs font-mono text-red-400">{serverError}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            className="w-full justify-center py-3 text-sm font-semibold"
          >
            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
          </Button>
          <div className="pt-2 text-center text-xs font-sans text-[#8c887e]">
            <Link to="/login" className="font-mono text-[#e6e2df] hover:underline font-semibold">
              Cancel & Return to Sign In
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};