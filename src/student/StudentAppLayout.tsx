import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from './useStudentAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
  CreditCard,
  ClipboardList,
  QrCode,
  User,
  PhoneCall,
  Building2,
  BedSingle,
  Sun,
  Moon
} from 'lucide-react';

export const StudentAppLayout: React.FC = () => {
  const { student, loading } = useStudentAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading Resident Portal...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to student login
  if (!student) {
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }

  const booking = student.expand?.bookings_via_resident?.[0];
  const room = booking?.expand?.bed?.expand?.room;
  const bed = booking?.expand?.bed;
  const firstName = student.fullName.split(' ')[0] || student.fullName;

  const navItems = [
    { label: 'Home', path: '/student', icon: Home, end: true },
    { label: 'Dues', path: '/student/dues', icon: CreditCard },
    { label: 'Services', path: '/student/services', icon: ClipboardList },
    { label: 'Hostel ID', path: '/student/id', icon: QrCode },
    { label: 'Profile', path: '/student/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Responsive Container: Fluid on desktop (max-w-6xl), edge-to-edge on mobile */}
      <div className="w-full max-w-6xl mx-auto min-h-screen flex flex-col relative">
        {/* ========================================================
            TOP APP BAR / NAVBAR
            Responsive: Compact on phone, spacious toolbar on laptop
           ======================================================== */}
        <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors duration-200 safe-area-top shadow-xs">
          <div className="flex items-center justify-between gap-4">
            {/* Brand / Resident Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    Hi, {firstName}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Account" />
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  Satabdi Girls' Hostel
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Visible on lg: screens) */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Actions: Room Chip, Theme Toggle, Emergency Call */}
            <div className="flex items-center gap-2 shrink-0">
              {room && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                  <BedSingle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Room {room.roomNumber}</span>
                  {bed && <span className="text-slate-400 dark:text-slate-500">({bed.bedLabel})</span>}
                </div>
              )}

              {/* Light / Dark Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all duration-150"
                title={theme === 'dark' ? 'Switch to Clean Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 transition-transform -rotate-12" />
                )}
              </button>

              {/* Emergency Call */}
              <a
                href="tel:+917848801864"
                title="Warden Helpline (+91 78488 01864)"
                className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 flex items-center justify-center transition-all duration-150"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content: Multi-column on Laptop, Single-column on Mobile */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 safe-area-bottom-spacer">
          <Outlet />
        </main>

        {/* ========================================================
            FLOATING CAPSULE / ISLAND BOTTOM NAVIGATION (Mobile Only)
            Hidden on lg: screens where top navigation is used
           ======================================================== */}
        <nav className="fixed left-0 right-0 z-50 pointer-events-none floating-nav-position px-3 sm:px-4 lg:hidden">
          <div className="w-full max-w-sm mx-auto pointer-events-auto">
            <div className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl rounded-full p-1.5 floating-nav-shadow flex items-center justify-around border border-slate-200/80 dark:border-white/10 transition-colors duration-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 select-none ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs scale-105'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium active:scale-95'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isActive ? 'scale-110 text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <span
                          className={`text-[9.5px] tracking-tight mt-0.5 ${
                            isActive ? 'text-white dark:text-slate-950 font-bold' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default StudentAppLayout;
