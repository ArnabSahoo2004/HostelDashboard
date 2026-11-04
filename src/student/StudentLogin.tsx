import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from './useStudentAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Smartphone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const { checkPhone, setupFirstLoginPassword, loginWithPhone } = useStudentAuth();
  const { theme, toggleTheme } = useTheme();

  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'phone' | 'password' | 'first_login'>('phone');

  // First Login State
  const [residentName, setResidentName] = useState('');
  const [residentId, setResidentId] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-generate a readable memorable password
  const generateRandomPassword = (name: string, phoneNumber: string) => {
    const cleanName = name.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Hostel';
    const lastDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-4) || '2026';
    return `${cleanName}@${lastDigits}`;
  };

  // Step 1: Submit Phone Number
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const clean = phone.replace(/[^0-9]/g, '').replace(/^91/, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await checkPhone(clean);

      if (!res.exists || !res.resident) {
        setError(res.error || 'Mobile number not found in hostel records.');
        return;
      }

      setResidentName(res.resident.fullName);
      setResidentId(res.resident.id);

      if (res.isFirstLogin) {
        const autoPass = generateRandomPassword(res.resident.fullName, clean);
        setGeneratedPassword(autoPass);
        setPassword(autoPass);
        setStep('first_login');
      } else {
        setStep('password');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2A: Complete First Login Setup
  const handleCompleteFirstLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.trim().length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    try {
      setLoading(true);
      await setupFirstLoginPassword(residentId, password);
      setSuccessMsg('Password created successfully! Logging you in...');
      setTimeout(() => {
        navigate('/student');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save password.');
      setLoading(false);
    }
  };

  // Step 2B: Returning Student Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await loginWithPhone(phone, password);
      setSuccessMsg('Login successful!');
      setTimeout(() => {
        navigate('/student');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header with Theme Switcher */}
      <div className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-700 dark:text-slate-300">
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
          
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-3 border border-emerald-200/60 dark:border-emerald-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Student Resident Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your mobile number to view room details, pay dues & apply for leave
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* ========================================================
              STEP 1: ENTER PHONE NUMBER
             ======================================================== */}
          {step === 'phone' && (
            <form onSubmit={handleCheckPhone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-sm border-r border-slate-300 dark:border-slate-700 pr-2.5">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-16 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base font-medium tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <Smartphone className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Use the phone number recorded during hostel admission.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Resident Record...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Resident App</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================
              STEP 2A: FIRST LOGIN PASSWORD SETUP
             ======================================================== */}
          {step === 'first_login' && (
            <form onSubmit={handleCompleteFirstLogin} className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    First-Time Login Setup
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Welcome, {residentName}!</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                  Set up your security password now. You can change this anytime from your profile.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode('auto');
                    setPassword(generatedPassword);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    passwordMode === 'auto'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Auto-Generated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode('custom');
                    setPassword('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    passwordMode === 'custom'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Custom Password
                </button>
              </div>

              {passwordMode === 'auto' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Your Generated Password
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                    <input
                      type="text"
                      readOnly
                      value={password}
                      className="bg-transparent text-slate-900 dark:text-emerald-300 font-mono text-base font-bold flex-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="Copy Password"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Please take a screenshot or copy this password for future logins.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Choose Your Password / 4-Digit PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 4 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-11 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || password.length < 4}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Password & Enter App</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setPassword('');
                }}
                className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 pt-1"
              >
                ← Use a different mobile number
              </button>
            </form>
          )}

          {/* ========================================================
              STEP 2B: RETURNING STUDENT PASSWORD LOGIN
             ======================================================== */}
          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back,</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{residentName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setPassword('');
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  Change No.
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Enter Password / PIN
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Secure Session
                </span>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Forgot password?\nPlease contact your hostel warden or admin (+91 78488 01864). They can reset your password instantly from the admin dashboard.'
                    )
                  }
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to Hostel App</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer & Admin Switch */}
      <div className="w-full max-w-md mx-auto pb-3 text-center space-y-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Warden Office Helpline: +91 78488 01864
        </div>
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <span>Hostel Admin / Warden Staff Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
