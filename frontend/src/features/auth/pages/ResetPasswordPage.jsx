import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Policy Checks
  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumberOrSymbol;
  const doPasswordsMatch = newPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new link.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please ensure your new password satisfies all strength requirements.');
      return;
    }

    if (!doPasswordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. The link may be expired or already used.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border border-border text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Invalid Reset Link</h2>
          <p className="text-xs text-muted-foreground">
            No valid reset token was detected in your link. Reset tokens are single-use and expire in 30 minutes.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              to="/forgot-password"
              className="w-full py-2.5 px-4 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 text-center"
            >
              Request New Reset Link
            </Link>
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:underline text-center pt-2"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Set New Password</h2>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your Knowledge workspace
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Success View */}
        {isSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Password Reset Complete</h3>
              <p className="text-xs text-muted-foreground">
                Your password has been successfully updated. All previous active sessions have been revoked for your security.
              </p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Sign In With New Password
            </button>
          </div>
        ) : (
          /* Reset Form */
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-10 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Requirements Guidance */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Password Policy:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasMinLength ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>12+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasUpper ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasLower ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasNumberOrSymbol ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>Number / symbol</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              className="w-full flex items-center justify-center rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
