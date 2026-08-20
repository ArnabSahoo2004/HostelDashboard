import React, { useState } from 'react';
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  login: (email: string, password: string) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const Login: React.FC<LoginProps> = ({ login, error, clearError }) => {
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
    const _success = await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center shadow-xl shadow-primary-500/25 mb-4 animate-pulse">
            <LogIn className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage your hostel</p>
        </div>

        {/* Errors */}
        {(validationError || error) && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@hostel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/35 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-10 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/35 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-500 hover:to-sky-400 text-white font-medium rounded-xl text-sm shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
