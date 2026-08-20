import React from 'react';
import type { Admin } from '../../types';
import { User, Bell, ChevronDown } from 'lucide-react';

interface NavbarProps {
  admin: Admin | null;
}

const Navbar: React.FC<NavbarProps> = ({ admin }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Overview</h1>
        <p className="text-xs text-slate-400">Welcome back, Admin</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-500 border-2 border-slate-900 rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-slate-800"></div>

        {/* Admin profile drop-down */}
        <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-full px-4 py-1.5 hover:bg-slate-800/80 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-sky-400 flex items-center justify-center text-white font-medium text-xs shadow-md">
            {admin?.email ? admin.email.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200">Hostel Admin</span>
            <span className="text-[10px] text-slate-400">{admin?.email}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
