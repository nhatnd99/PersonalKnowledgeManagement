import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a secure recovery link
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Submitted Success View */}
        {isSubmitted ? (
          <div className="space-y-6 text-center py-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Check Your Inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists with <span className="font-semibold text-foreground">{email}</span>, a password reset link has been sent. The link expires in 30 minutes.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Sign In
            </Link>
          </div>
        ) : (
          /* Submission Form */
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@knowledge.app"
                  disabled={isLoading}
                  className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
