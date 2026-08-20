import React, { useState, useEffect } from 'react';
import { QrCode, Wifi, WifiOff, Send, MessageSquare } from 'lucide-react';
import pb from '../api/client';

export default function WhatsApp() {
  const [status, setStatus] = useState<{ connected: boolean; qrCode: string | null }>({
    connected: false,
    qrCode: null
  });
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const templates = [
    "Notice: Water supply will be suspended tomorrow from 10 AM to 12 PM due to maintenance.",
    "Gentle Reminder: Please ensure all outstanding rent dues for this month are cleared by the 5th.",
    "Alert: General maintenance work is scheduled for the common areas today. Sorry for the inconvenience.",
    "Notice: The main gate will be closed at 10 PM tonight. Please return on time."
  ];

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/whatsapp/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for QR code status every 3 seconds if not connected
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (!status.connected) {
        fetchStatus();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [status.connected]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const res = await fetch('http://localhost:5000/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones, message: broadcastMessage })
      });

      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', msg: data.message });
        setBroadcastMessage('');
      } else {
        setAlert({ type: 'error', msg: data.error || 'Failed to send broadcast.' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.message || 'An error occurred.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading WhatsApp Status...</div>;
  }
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Integration</h1>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${status.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status.connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          <span className="font-semibold">{status.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-white">
            <QrCode className="w-5 h-5 mr-2 text-indigo-600" />
            Connection Status
          </h2>

          {status.connected ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">WhatsApp is Active</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your backend is successfully connected to WhatsApp. The bot is running and listening for commands!
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              {status.qrCode ? (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Scan this QR Code with your WhatsApp app (Linked Devices):</p>
                  <img src={status.qrCode} alt="WhatsApp QR Code" className="mx-auto border p-2 rounded-lg bg-white" />
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Generating QR Code... Please wait.</p>
              )}
            </div>
          )}
        </div>

        {/* Broadcast Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-white">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
            Hostel Broadcast
          </h2>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message to All Active Residents
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="E.g., Notice: Water supply will be suspended tomorrow from 10 AM to 12 PM."
                disabled={!status.connected}
              />
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBroadcastMessage(template)}
                    disabled={!status.connected}
                    className="text-left text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-1.5 px-3 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {template.length > 30 ? template.substring(0, 30) + '...' : template}
                  </button>
                ))}
              </div>
            </div>

            {alert && (
              <div className={`p-3 rounded-lg text-sm ${alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {alert.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={!status.connected || sending}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
