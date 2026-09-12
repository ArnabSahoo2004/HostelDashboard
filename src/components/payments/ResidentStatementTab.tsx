import { useState, useEffect, useRef } from 'react';
import pb from '../../api/client';
import type { Resident, Payment } from '../../types';
import { generateHTMLInvoicePDF } from '../../utils/generateInvoice';
import ReceiptTemplate from '../shared/ReceiptTemplate';
import {
  User,
  IndianRupee,
  BedDouble,
  Zap,
  Utensils,
  CheckCircle,
  FileDown,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

export default function ResidentStatementTab({ onPaymentsChanged }: { onPaymentsChanged?: () => void }) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF State
  const [selectedReceipt, setSelectedReceipt] = useState<{ payment: Payment | null; receiptNo: number }>({ payment: null, receiptNo: 0 });
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch residents once
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const records = await pb.collection('residents').getFullList({ sort: 'fullName' });
        setResidents(records as any);
        if (records.length > 0) setSelectedResidentId(records[0].id);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch residents.');
      }
    };
    fetchResidents();
  }, []);

  // Fetch payments for selected resident + month
  useEffect(() => {
    if (!selectedResidentId) return;
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const monthStart = `${billingMonth}-01`;
        const [year, month] = billingMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const monthEnd = `${billingMonth}-${lastDay}`;

        const records = await pb.collection('payments').getFullList({
          filter: `resident = '${selectedResidentId}' && monthFor >= '${monthStart} 00:00:00' && monthFor <= '${monthEnd} 23:59:59'`,
          expand: 'resident,booking,booking.bed,booking.bed.room',
        });
        setAllPayments(records as any);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch payments.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [selectedResidentId, billingMonth]);

  // Trigger PDF after receipt renders
  useEffect(() => {
    if (selectedReceipt.payment) {
      setTimeout(async () => {
        if (!receiptRef.current) return;
        const resident = residents.find(r => r.id === selectedResidentId);
        const filename = `Invoice_${resident?.fullName?.replace(/\s+/g, '_') || 'Resident'}_${billingMonth}.pdf`;
        try {
          await generateHTMLInvoicePDF(receiptRef.current!, filename);
        } catch (err) {
          console.error('PDF generation failed:', err);
        } finally {
          setSelectedReceipt({ payment: null, receiptNo: 0 });
        }
      }, 100);
    }
  }, [selectedReceipt.payment]);

  const handleMarkAllPaid = async () => {
    const unpaid = allPayments.filter(p => p.status !== 'paid');
    if (unpaid.length === 0) return;
    setActionLoading(true);
    try {
      await Promise.all(
        unpaid.map(p =>
          pb.collection('payments').update(p.id, {
            status: 'paid',
            paidDate: new Date().toISOString(),
          })
        )
      );
      // Refresh
      const monthStart = `${billingMonth}-01`;
      const [year, month] = billingMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const monthEnd = `${billingMonth}-${lastDay}`;
      const records = await pb.collection('payments').getFullList({
        filter: `resident = '${selectedResidentId}' && monthFor >= '${monthStart} 00:00:00' && monthFor <= '${monthEnd} 23:59:59'`,
        expand: 'resident,booking,booking.bed,booking.bed.room',
      });
      setAllPayments(records as any);
      // Notify parent to refresh its payment list too
      onPaymentsChanged?.();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    const pivot = allPayments[0];
    if (!pivot) return;
    const receiptNo = Math.floor(Math.random() * 9000) + 1000;
    setSelectedReceipt({ payment: pivot, receiptNo });
  };

  const mainInvoice = allPayments[0];
  const rentAmt = mainInvoice ? (mainInvoice.rentAmount || 0) : 0;
  const electricityAmt = mainInvoice ? (mainInvoice.electricityAmount || 0) : 0;
  const fineAmt = mainInvoice ? (mainInvoice.fineAmount || 0) : 0;
  const totalAmt = mainInvoice ? (mainInvoice.amount || 0) : 0;

  const allPaid = allPayments.length > 0 && allPayments.every(p => p.status === 'paid');
  const anyPending = allPayments.some(p => p.status !== 'paid');

  const selectedResident = residents.find(r => r.id === selectedResidentId);

  const statusBadge = (p: Payment) => {
    if (p.status === 'paid') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>;
    if (p.status === 'overdue') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">Overdue</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
        {/* Resident Picker */}
        <div className="relative flex-1 min-w-[220px]">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={selectedResidentId}
            onChange={e => setSelectedResidentId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-200 focus:outline-none focus:border-primary-500 appearance-none"
          >
            {residents.map(r => (
              <option key={r.id} value={r.id}>{r.fullName}</option>
            ))}
          </select>
        </div>

        {/* Month Picker */}
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="month"
            value={billingMonth}
            onChange={e => setBillingMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-primary-500 [color-scheme:dark]"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => setSelectedResidentId(sid => sid)}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : !selectedResidentId ? (
        <div className="text-center py-20 text-slate-500">Select a resident to view their statement.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Bill Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            {/* Resident Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-black text-xl flex-shrink-0">
                {selectedResident?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-100 text-lg">{selectedResident?.fullName}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                  {selectedResident?.phone && <span>📞 {selectedResident.phone}</span>}
                  <span>Statement: {new Date(billingMonth + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="ml-auto">
                {allPaid
                  ? <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />All Cleared</span>
                  : <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Dues Pending</span>
                }
              </div>
            </div>

            {/* Bill Line Items */}
            {allPayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No bills found</p>
                <p className="text-slate-600 text-sm mt-1">No bills have been generated for this resident in the selected month.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider grid grid-cols-4">
                  <span className="col-span-2">Bill Type</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {rentAmt > 0 && (
                    <div className="p-4 grid grid-cols-4 items-center hover:bg-slate-800/20 transition-colors">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
                          <BedDouble className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Monthly Rent</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Room accommodation</div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-200">₹{rentAmt.toLocaleString('en-IN')}</div>
                      <div className="text-right">{statusBadge(mainInvoice)}</div>
                    </div>
                  )}

                  {electricityAmt > 0 && (
                    <div className="p-4 grid grid-cols-4 items-center hover:bg-slate-800/20 transition-colors">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Electricity</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Utility bill (split)</div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-200">₹{electricityAmt.toLocaleString('en-IN')}</div>
                      <div className="text-right">{statusBadge(mainInvoice)}</div>
                    </div>
                  )}


                  
                  {fineAmt > 0 && (
                    <div className="p-4 grid grid-cols-4 items-center hover:bg-slate-800/20 transition-colors">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">Fines</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Penalties</div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-200">₹{fineAmt.toLocaleString('en-IN')}</div>
                      <div className="text-right">{statusBadge(mainInvoice)}</div>
                    </div>
                  )}
                </div>

                {/* Total Row */}
                <div className="p-4 border-t-2 border-slate-700 bg-slate-950/40 grid grid-cols-4 items-center">
                  <div className="col-span-2 text-sm font-bold text-slate-300 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-primary-400" />
                    Total Due
                  </div>
                  <div className="text-right text-xl font-black text-primary-400">₹{totalAmt.toLocaleString('en-IN')}</div>
                  <div className="text-right">
                    {allPaid
                      ? <span className="text-emerald-400 text-xs font-bold">✓ Cleared</span>
                      : <span className="text-amber-400 text-xs font-bold">{allPayments.filter(p => p.status !== 'paid').length} pending</span>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary + Actions */}
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Summary</h3>

              <div className="space-y-3">
                {[
                  { label: 'Rent', amt: rentAmt, color: 'text-primary-400', show: rentAmt > 0 },
                  { label: 'Electricity', amt: electricityAmt, color: 'text-amber-400', show: electricityAmt > 0 },
                ].filter(i => i.show).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>₹{item.amt.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Total</span>
                  <span className="text-white font-black text-lg">₹{totalAmt.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {allPayments.length > 0 && (
              <div className="space-y-3">
                {anyPending && (
                  <button
                    onClick={handleMarkAllPaid}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark All as Paid
                  </button>
                )}

                <button
                  onClick={handleDownloadInvoice}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <FileDown className="w-4 h-4" />
                  Download Invoice PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden receipt for PDF rendering */}
      <div className="fixed top-0 left-0 pointer-events-none z-[-50]">
        {selectedReceipt.payment && (
          <ReceiptTemplate
            ref={receiptRef}
            payment={selectedReceipt.payment}
            allPayments={allPayments}
            receiptNumber={selectedReceipt.receiptNo}
          />
        )}
      </div>
    </div>
  );
}
