import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Settings as SettingsIcon, 
  CreditCard, 
  ShieldCheck, 
  MessageSquare,
  Save,
  CheckCircle,
  Bell,
  Smartphone,
  Mail,
  MapPin
} from 'lucide-react';
import pb from '../api/client';
import type { Settings as SettingsType } from '../types';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'security' | 'notifications'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    hostelName: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    rentDueDate: "5",
    lateFeeAmount: "50",
    whatsappApiKey: "",
    whatsappPhoneNumberId: "",
    adminEmail: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const records = await pb.collection('settings').getFullList();
        if (records.length > 0) {
          const s = records[0] as unknown as SettingsType;
          setSettingsId(s.id);
          setSettings({
            hostelName: s.hostelName,
            tagline: s.tagline,
            address: s.address,
            phone: s.phone,
            email: s.email,
            rentDueDate: s.rentDueDate,
            lateFeeAmount: s.lateFeeAmount,
            whatsappApiKey: s.whatsappApiKey,
            whatsappPhoneNumberId: s.whatsappPhoneNumberId || "",
            adminEmail: s.adminEmail,
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (settingsId) {
        await pb.collection('settings').update(settingsId, settings);
      } else {
        const record = await pb.collection('settings').create(settings);
        setSettingsId(record.id);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: Building2 },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Admin', icon: ShieldCheck },
  ] as const;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in relative">
      
      {/* Success Toast */}
      <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xl backdrop-blur-md transition-all duration-300 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle className="w-6 h-6 text-emerald-400" />
        <div>
          <h4 className="text-emerald-400 font-bold text-sm">Settings Saved</h4>
          <p className="text-emerald-400/80 text-xs">Your configurations have been updated successfully.</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400 flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-primary-400" />
          Dashboard Settings
        </h1>
        <p className="text-slate-400 mt-2 text-lg">Configure your hostel's core operations, billing preferences, and security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-500/5 translate-x-2' 
                  : 'bg-transparent text-slate-400 border border-transparent hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <form onSubmit={handleSave} className="relative z-10 space-y-8">
            
            {/* ── GENERAL SETTINGS ── */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-slide-up">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                    Hostel Information
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">These details appear on official receipts and resident communications.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Hostel Name</label>
                    <input 
                      type="text" 
                      name="hostelName"
                      value={settings.hostelName}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tagline / Sub-heading</label>
                    <input 
                      type="text" 
                      name="tagline"
                      value={settings.tagline}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Full Address
                    </label>
                    <textarea 
                      name="address"
                      value={settings.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5" /> Support Phone
                    </label>
                    <input 
                      type="text" 
                      name="phone"
                      value={settings.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> Support Email
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={settings.email}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── BILLING SETTINGS ── */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-slide-up">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                    Billing & Payments
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Configure automated invoice generation rules and penalty fees.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Monthly Due Date */}
                  <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/20"></div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Default Rent Due Date</label>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-black text-slate-200 bg-slate-900 border border-slate-700 w-16 h-16 rounded-xl flex items-center justify-center shadow-inner">
                        {settings.rentDueDate}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="range" 
                          name="rentDueDate"
                          min="1" max="28" 
                          value={settings.rentDueDate}
                          onChange={handleChange}
                          className="w-full accent-emerald-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">Rent is due on the {settings.rentDueDate}th of every month.</p>
                      </div>
                    </div>
                  </div>

                  {/* Late Fee */}
                  <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-rose-500/20"></div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Daily Late Fee Fine (₹)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-slate-500">₹</span>
                      <input 
                        type="number" 
                        name="lateFeeAmount"
                        value={settings.lateFeeAmount}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xl font-black text-rose-400 focus:outline-none focus:border-rose-500 transition-all shadow-inner"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Applied automatically after the due date grace period.</p>
                  </div>

                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-slide-up">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-amber-400" />
                    WhatsApp & Communcations
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage API integrations for resident reminders.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta API Permanent Access Token</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        name="whatsappApiKey"
                        value={settings.whatsappApiKey}
                        onChange={handleChange}
                        placeholder="EAAB..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner font-mono text-sm"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-400">ENCRYPTED</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta Phone Number ID</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        name="whatsappPhoneNumberId"
                        value={settings.whatsappPhoneNumberId}
                        onChange={handleChange}
                        placeholder="e.g. 101234567890123"
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner font-mono text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    Find these credentials in your Meta for Developers App Dashboard &gt; WhatsApp &gt; API Setup. <br/><br/>
                    <strong>Note:</strong> Make sure your permanent access token has the `whatsapp_business_messaging` permission.
                  </p>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-slide-up">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-rose-400" />
                    Security & Admin
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage dashboard access and credentials.</p>
                </div>
                
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-rose-400/80 uppercase tracking-wider">Admin Login Email</label>
                    <input 
                      type="email" 
                      name="adminEmail"
                      value={settings.adminEmail}
                      onChange={handleChange}
                      className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 transition-all shadow-inner"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-rose-400/80 uppercase tracking-wider">Change Password</label>
                    <div className="flex gap-3 max-w-md">
                      <input 
                        type="password" 
                        placeholder="Enter new password"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 transition-all shadow-inner"
                      />
                      <button type="button" className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-8 mt-8 border-t border-slate-800 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95"
              >
                {isSaving ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
