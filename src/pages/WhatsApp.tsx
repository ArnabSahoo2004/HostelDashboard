import React, { useState } from 'react';
import { Settings, Wifi, WifiOff, Send, MessageSquare, ShieldAlert } from 'lucide-react';
import pb from '../api/client';
import type { Settings as SettingsType } from '../types';

export default function WhatsApp() {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);

  const templates = [
    "Notice: Water supply will be suspended tomorrow from 10 AM to 12 PM due to maintenance.",
    "Gentle Reminder: Please ensure all outstanding rent dues for this month are cleared by the 5th.",
    "Alert: General maintenance work is scheduled for the common areas today. Sorry for the inconvenience.",
    "Notice: The main gate will be closed at 10 PM tonight. Please return on time."
  ];

  const isConnected = !!(import.meta.env.VITE_META_TOKEN && import.meta.env.VITE_WHATSAPP_PHONE_ID);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = import.meta.env.VITE_META_TOKEN;
    const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      setAlert({ type: 'error', msg: 'WhatsApp API credentials are missing in the .env file.' });
      return;
    }
    if (!broadcastMessage.trim()) return;

    setSending(true);
    setAlert(null);

    try {
      // Fetch all active residents
      const residents = await pb.collection('residents').getFullList({
        filter: 'status = "active"'
      });

      const phones = residents.map(r => r.phone).filter(Boolean);

      if (phones.length === 0) {
        setAlert({ type: 'error', msg: 'No active residents with phone numbers found.' });
        setSending(false);
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      // Send to Meta API
      for (const phone of phones) {
        let cleanPhone = phone.replace(/\D/g, '');
        // Default to India (+91) if 10 digits
        if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

        const payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: false, body: broadcastMessage }
        };

        const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        } else {
          failureCount++;
          const errData = await res.json();
          console.error(`Failed to send to ${cleanPhone}:`, errData);
        }
      }

      if (failureCount === 0) {
        setAlert({ type: 'success', msg: `Successfully broadcasted to ${successCount} residents.` });
        setBroadcastMessage('');
      } else if (successCount > 0) {
        setAlert({ type: 'warning', msg: `Sent to ${successCount} residents, but failed for ${failureCount}. See console for details.` });
      } else {
        setAlert({ type: 'error', msg: `Failed to send to all ${failureCount} residents.` });
      }
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.message || 'An error occurred during broadcast.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">WhatsApp Integration</h1>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          <span className="font-semibold text-sm">{isConnected ? 'Connected to Meta API' : 'Not Configured'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary-500" />
            Meta API Status
          </h2>

          {isConnected ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">System is Ready</h3>
              <p className="text-sm text-slate-400 mb-6">
                Your dashboard is securely connected to the official Meta WhatsApp Cloud API.
              </p>
              
              <div className="bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Meta 24h Policy</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You can send these free-form messages to any resident who has messaged your business number within the last 24 hours. For proactive alerts outside this window, Meta requires pre-approved template messages.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Action Required</h3>
              <p className="text-sm text-slate-400 mb-6">
                You need to configure your Meta API credentials before sending broadcasts.
              </p>
              <p className="text-xs text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800">
                Go to <strong>Settings &gt; Notifications</strong> and enter your <strong>Meta Phone Number ID</strong> and <strong>Permanent Access Token</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Broadcast Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-primary-500" />
            Hostel Broadcast
          </h2>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">
                Message to All Active Residents
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none transition-all disabled:opacity-50"
                placeholder="E.g., Notice: Water supply will be suspended tomorrow from 10 AM to 12 PM."
                disabled={!isConnected}
              />
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Texts
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBroadcastMessage(template)}
                    disabled={!isConnected}
                    className="text-left text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-xl border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {template.length > 30 ? template.substring(0, 30) + '...' : template}
                  </button>
                ))}
              </div>
            </div>

            {alert && (
              <div className={`p-4 rounded-xl text-sm border ${
                alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                alert.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {alert.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={!isConnected || sending}
              className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Broadcast</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
