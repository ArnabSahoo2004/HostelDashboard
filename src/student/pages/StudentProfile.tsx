import React, { useState } from 'react';
import { useStudentAuth } from '../useStudentAuth';
import { useTheme } from '../../context/ThemeContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  PhoneCall,
  Key,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { student, changePassword, logout } = useStudentAuth();
  const { theme, toggleTheme } = useTheme();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const booking = student?.expand?.bookings_via_resident?.[0];
  const room = booking?.expand?.bed?.expand?.room;
  const bed = booking?.expand?.bed;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(oldPassword, newPassword);
      setSuccess('Password updated successfully! Please use it for future logins.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordForm(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Resident Account & Security
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal information, keys issued, app security PIN & preferences
        </p>
      </div>

      {/* Responsive Grid: 2 columns on laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Profile Info & Keys & Preferences */}
        <div className="space-y-4">
          
          {/* Main Profile Info Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xl font-black shadow-xs">
                {student?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{student?.fullName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {room ? `Room ${room.roomNumber}` : 'Hostel Resident'} • Bed {bed?.bedLabel || 'A'}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                  Active Resident
                </span>
              </div>
            </div>

            {/* Detailed Attributes */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{student?.phone}</span>
              </div>

              {student?.email && (
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900 dark:text-white ml-auto truncate max-w-[200px]">
                    {student.email}
                  </span>
                </div>
              )}

              {student?.address && (
                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-500">Address:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 ml-auto text-right max-w-[220px]">
                    {student.address}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Guardian:</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">
                  {student?.emergencyContactName || student?.fatherName || 'Not recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Issued Items / Keys */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs transition-colors">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Keys & Amenities Issued</h4>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Room Key</span>
                <span className={`font-bold ${student?.hasRoomKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {student?.hasRoomKey ? '✓ Issued' : 'No'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Almirah Key</span>
                <span className={`font-bold ${student?.hasAlmirahKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {student?.hasAlmirahKey ? '✓ Issued' : 'No'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Punch Card</span>
                <span className={`font-bold ${student?.hasPunchcard ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {student?.hasPunchcard ? '✓ Issued' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Theme Mode Preference Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between shadow-xs transition-colors">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">App Appearance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current theme: <span className="font-bold capitalize">{theme} Mode</span>
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Security, Password Change, Helpline, Logout */}
        <div className="space-y-4">
          
          {/* Security & Password Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Security & Password</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Change your student login password</p>
                </div>
              </div>

              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-3 pt-3 text-xs border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    New Password *
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Minimum 4 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Warden Emergency Box */}
          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                Warden Help Desk Hotline
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">+91 78488 01864</span>
            </div>
            <a
              href="tel:+917848801864"
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline</span>
            </a>
          </div>

          {/* Logout Action */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to log out of the student app?')) {
                logout();
              }
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-500/10 border border-slate-200/90 hover:border-rose-300 dark:border-slate-800 dark:hover:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Student App</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
