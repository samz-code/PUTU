import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const selectedExperience = (location.state as { selectedExperience?: any })?.selectedExperience;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    // Fetch the updated session directly to inspect user role immediately
    const { data: { session } } = await supabase.auth.getSession();

    let userRole = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role;

    // Fallback: check the customers database table if role is not in JWT metadata
    if (!userRole && session?.user?.id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .or(`id.eq.${session.user.id},user_id.eq.${session.user.id}`)
        .maybeSingle();
      userRole = customer?.role;
    }

    setLoading(false);

    // Dynamic redirect target: respect explicit state redirect, otherwise route based on role
    const explicitRedirect =
      (location.state as { from?: string })?.from ||
      (location.state as { redirectTo?: string })?.redirectTo;

    const defaultRoute = userRole === 'admin' ? '/admin' : '/portal';
    const targetPath = explicitRedirect || defaultRoute;

    navigate(targetPath, { replace: true, state: { selectedExperience } });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    setResetLoading(true);

    // Trigger Supabase Password Reset Link
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccessMsg('A password reset link has been sent to your email address.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
      } else {
        throw new Error('Google Sign-In is not configured in Auth Provider.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="sm:min-h-[calc(100vh-80px)] flex items-start sm:items-center justify-center bg-sand-50 pt-6 pb-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-3 sm:space-y-6">

        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-block group transition-transform duration-200 hover:scale-105">
            <img
              src="/putu_mark.png"
              alt="Logo"
              className="h-16 sm:h-20 w-auto object-contain mx-auto"
            />
          </Link>
          <h2 className="mt-1.5 sm:mt-4 text-xl sm:text-3xl font-serif font-bold text-cocoa-900 tracking-tight">
            {isForgotMode ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {isForgotMode
              ? 'Enter your email and we will send you a reset link'
              : 'Sign in to access your personal concierge portal'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl shadow-slate-200/50 border border-slate-100 space-y-3 sm:space-y-6">

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200/60 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {!isForgotMode ? (
            <>
              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200/90 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-1.5 sm:my-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] sm:text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  Or with email
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-cocoa-700 uppercase tracking-wider mb-1" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] sm:text-xs font-bold text-cocoa-700 uppercase tracking-wider" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setIsForgotMode(true);
                      }}
                      className="text-xs font-semibold text-coral-600 hover:text-coral-700 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 sm:py-3.5 px-4 bg-cocoa-800 hover:bg-cocoa-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-60 mt-1.5 sm:mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-cocoa-700 uppercase tracking-wider mb-1" htmlFor="reset-email">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 focus:bg-white transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 sm:py-3.5 px-4 bg-cocoa-800 hover:bg-cocoa-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-60"
              >
                {resetLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Email...
                  </span>
                ) : (
                  'Send Reset Email'
                )}
              </button>

              <div className="text-center pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setIsForgotMode(false);
                  }}
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Footer link */}
          <div className="text-center pt-1.5 sm:pt-3 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Don’t have an account?{' '}
              <Link to="/register" state={location.state} className="font-semibold text-coral-600 hover:text-coral-700 transition-colors">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}