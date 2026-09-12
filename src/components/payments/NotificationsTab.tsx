import { useState, useEffect } from 'react';
import pb from '../../api/client';
import type { Payment, Resident } from '../../types';
import {
  Bell, Send, CheckCircle, AlertTriangle, RefreshCw,
  MessageSquare, Clock
} from 'lucide-react';

const WA_BASE = 'http://localhost:5000';

function buildReminderMessage(resident: Resident, payments: Payment[]): string {
  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  const month = payments[0]?.monthFor
    ? new Date(payments[0].monthFor).toLocaleDateString('default', { month: 'long', year: 'numeric' })
    : 'this month';
  return `Dear ${resident.fullName},\n\nThis is a gentle reminder from Satabdi Girls' Hostel that your payment of ₹${total.toLocaleString('en-IN')} for ${month} is due.\n\nPlease make the payment at the earliest to avoid late fees.\n\nThank you,\nHostel Management`;
}

export default function NotificationsTab() {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const payments = await pb.collection('payments').getFullList({
        filter: 'status = "pending" || status = "overdue"',
        expand: 'resident',
        sort: '-created',
      });
      setPendingPayments(payments as any);
    } catch (err: any) { setError(err.message || 'Failed to load.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Group payments by resident
  const byResident = pendingPayments.reduce<Record<string, Payment[]>>((acc, p) => {
    const rid = p.expand?.resident?.id || p.resident;
    if (!acc[rid]) acc[rid] = [];
    acc[rid].push(p);
    return acc;
  }, {});

  const checkWaConnected = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${WA_BASE}/api/whatsapp/status`);
      const data = await res.json();
      return data.connected === true;
    } catch { return false; }
  };

  const sendReminder = async (residentId: string) => {
    const resident = pendingPayments.find(p => (p.expand?.resident?.id || p.resident) === residentId)?.expand?.resident;
    if (!resident?.phone) {
      setError(`${resident?.fullName || 'Resident'} has no phone number.`); return;
    }
    setSending(s => ({ ...s, [residentId]: true }));
    setError(null);
    try {
      const connected = await checkWaConnected();
      if (!connected) throw new Error('WhatsApp is not connected. Go to the WhatsApp page to connect.');
      const message = buildReminderMessage(resident, byResident[residentId]);
      const res = await fetch(`${WA_BASE}/api/whatsapp/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones: [resident.phone], message }),
      });
      if (!res.ok) throw new Error('Failed to send message.');
      // Log notification
      await pb.collection('notifications').create({
        resident: resident.id,
        payment: byResident[residentId][0]?.id || '',
        message,
        sentAt: new Date().toISOString(),
        channel: 'whatsapp',
        status: 'sent',
      }).catch(() => {}); // best-effort log
      setSent(s => ({ ...s, [residentId]: true }));
    } catch (err: any) { setError(err.message || 'Failed to send reminder.'); }
    finally { setSending(s => ({ ...s, [residentId]: false })); }
  };

  const sendAll = async () => {
    setBulkSending(true); setBulkResult(null); setError(null);
    const connected = await checkWaConnected();
    if (!connected) { setError('WhatsApp is not connected.'); setBulkSending(false); return; }
    let successCount = 0;
    for (const residentId of Object.keys(byResident)) {
      const resident = pendingPayments.find(p => (p.expand?.resident?.id || p.resident) === residentId)?.expand?.resident;
      if (!resident?.phone) continue;
      try {
        const message = buildReminderMessage(resident, byResident[residentId]);
        const res = await fetch(`${WA_BASE}/api/whatsapp/broadcast`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phones: [resident.phone], message }),
        });
        if (res.ok) {
          successCount++;
          setSent(s => ({ ...s, [residentId]: true }));
          await pb.collection('notifications').create({
            resident: resident.id, payment: byResident[residentId][0]?.id || '',
            message, sentAt: new Date().toISOString(), channel: 'whatsapp', status: 'sent',
          }).catch(() => {});
        }
        // Small delay between messages
        await new Promise(r => setTimeout(r, 500));
      } catch { /* skip failed */ }
    }
    setBulkResult(`✅ Reminders sent to ${successCount} of ${Object.keys(byResident).length} residents.`);
    setBulkSending(false);
  };

  const totalPending = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">{Object.keys(byResident).length} residents with pending dues</div>
            <div className="text-xs text-slate-500">Total outstanding: ₹{totalPending.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={sendAll}
            disabled={bulkSending || Object.keys(byResident).length === 0}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            {bulkSending ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Send className="w-4 h-4" />}
            Remind All via WhatsApp
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
        </div>
      )}
      {bulkResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />{bulkResult}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : Object.keys(byResident).length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-emerald-700 mx-auto mb-3" />
          <p className="font-semibold text-emerald-400">All dues are cleared!</p>
          <p className="text-slate-600 text-sm mt-1">No pending payments to send reminders for.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byResident).map(([residentId, pays]) => {
            const resident = pays[0]?.expand?.resident;
            const total = pays.reduce((s, p) => s + Number(p.amount), 0);
            const hasPhone = !!resident?.phone;
            const isSent = sent[residentId];
            const isSending = sending[residentId];
            return (
              <div key={residentId} className={`bg-slate-900 border rounded-2xl p-5 flex items-center gap-5 transition-all ${isSent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-black text-lg flex-shrink-0">
                  {resident?.fullName?.charAt(0).toUpperCase() || '?'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-200">{resident?.fullName || 'Unknown'}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    {resident?.phone ? (
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{resident.phone}</span>
                    ) : (
                      <span className="text-rose-400">No phone number</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pays.length} bill{pays.length > 1 ? 's' : ''} pending</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pays.map(p => (
                      <div key={p.id} className="flex gap-2">
                        {p.rentAmount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">🏠 ₹{Number(p.rentAmount).toLocaleString('en-IN')}</span>}
                        {p.electricityAmount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">⚡ ₹{Number(p.electricityAmount).toLocaleString('en-IN')}</span>}
                        {p.fineAmount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">⚠️ ₹{Number(p.fineAmount).toLocaleString('en-IN')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Total */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-black text-rose-400">₹{total.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">Total Due</div>
                </div>
                {/* Send button */}
                <button
                  onClick={() => sendReminder(residentId)}
                  disabled={isSending || isSent || !hasPhone}
                  className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    isSent
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : hasPhone
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {isSending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : isSent ? (
                    <><CheckCircle className="w-4 h-4" /> Sent</>
                  ) : (
                    <><Send className="w-4 h-4" /> Remind</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
