import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../features/auth/services/authService';
const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });
  const submittedEmail = watch('email');
  const onSubmit = async (data: ForgotPasswordData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to request password reset.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AuthLayout>
      <div className="space-y-6 text-left">
        {/* Header Icon & Title */}
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#48473f] bg-[#1c1b1a] text-[#e6e2df]">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#ffffff] tracking-tight">
              Reset Your Password
            </h2>
            <p className="mt-1 font-sans text-xs text-[#cac6bc] leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>
        {isSubmitted ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-[#363433] bg-[#141312] p-4 text-xs font-mono text-[#cac6bc] space-y-2">
              <p className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Reset Link Sent
              </p>
              <p className="text-[11px] leading-relaxed text-[#939188]">
                If an account exists for <span className="text-[#e6e2df] font-semibold">{submittedEmail}</span>, you will receive password reset instructions shortly.
              </p>
            </div>
            <Link to="/login" className="block w-full">
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center text-xs font-semibold"
              >
                Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="block text-xs font-mono font-medium text-[#cac6bc] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c887e]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="name@studio.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#141312] border text-sm font-mono text-[#e6e2df] rounded-lg shadow-inner transition-all placeholder:text-[#8c887e]/60 focus:outline-none focus:ring-2 focus:ring-[#939188]/40 ${
                    errors.email ? 'border-red-500/80 focus:border-red-500' : 'border-[#48473f] focus:border-[#e6e2df]'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-mono text-red-400 pt-0.5">{errors.email.message}</p>
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
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </Button>
            <div className="pt-2 text-center text-xs font-sans text-[#8c887e]">
              <span>Remembered your password? </span>
              <Link to="/login" className="font-mono text-[#e6e2df] hover:underline font-semibold">
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};