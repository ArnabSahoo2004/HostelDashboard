import React from 'react';
import type { Admin } from '../../types';
import { Bell, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  admin: Admin | null;
  onToggleMobileMenu?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ admin, onToggleMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button (visible on mobile / tablet < lg) */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">Hostel Portal</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Welcome back, Administrator</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* Notifications Button */}
        <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        {/* Admin Profile Dropdown Pill */}
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-full px-2.5 sm:px-3.5 py-1 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            {admin?.email ? admin.email.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Admin</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{admin?.email || 'admin@hostel.com'}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
