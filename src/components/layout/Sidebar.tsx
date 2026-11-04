import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import pb from '../../api/client';
import { 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  CreditCard, 
  Settings, 
  LogOut, 
  Wrench,
  MessageSquare,
  FileText,
  Gavel,
  X
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
  const [hostelName, setHostelName] = useState('Hostel Admin');

  useEffect(() => {
    pb.collection('settings').getFirstListItem('')
      .then((record) => {
        if (record.hostelName) setHostelName(record.hostelName);
      })
      .catch(() => { /* ignore */ });
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Rooms & Beds', path: '/rooms', icon: BedDouble },
    { name: 'Residents', path: '/residents', icon: Users },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Notices', path: '/notices', icon: FileText },
    { name: 'Fines & Deposits', path: '/fines', icon: Gavel },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'WhatsApp', path: '/whatsapp', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
              <span className="text-white font-black text-base">{hostelName.charAt(0).toUpperCase()}</span>
            </div>
            <span
              className="font-bold text-sm sm:text-base leading-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate"
              title={hostelName}
            >
              {hostelName}
            </span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-400 border border-primary-500/25 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static persistent sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-shrink-0 flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Mobile Drawer Container */}
      <div
        className={`fixed inset-y-0 left-0 w-72 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
