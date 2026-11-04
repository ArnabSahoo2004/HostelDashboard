import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff, Smartphone, Building2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LoginProps {
  login: (email: string, password: string) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const Login: React.FC<LoginProps> = ({ login, error, clearError }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors duration-200">
      {/* Top Bar with Theme Toggle */}
      <div className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Satabdi Girls' Hostel
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl transition-colors">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs mb-3">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Hostel Admin Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with management credentials to access hostel operations
            </p>
          </div>

          {/* Errors */}
          {(validationError || error) && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@hostel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Student Mobile Portal Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Are you a hostel resident student?</p>
            <Link
              to="/student/login"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all text-xs font-bold border border-slate-200 dark:border-slate-700"
            >
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Open Student Mobile App →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Satabdi Girls' Hostel Management System • 2026-27
      </div>
    </div>
  );
};

export default Login;
