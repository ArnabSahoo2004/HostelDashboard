import { useState, useEffect } from 'react';
import pb from '../api/client';
import type { Fine, CautionDeposit, Resident } from '../types';
import {
  IndianRupee, Plus, X, AlertTriangle, CheckCircle, Shield,
  ChevronDown, User, RefreshCw, Ban, Gavel
} from 'lucide-react';

const FINE_CATEGORIES = [
  { value: 'noise', label: 'Noise Violation' },
  { value: 'damage', label: 'Property Damage' },
  { value: 'late_return', label: 'Late Return' },
  { value: 'rule_violation', label: 'Rule Violation' },
  { value: 'other', label: 'Other' },
];

function categoryColor(cat: string) {
  switch (cat) {
    case 'noise': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'damage': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'late_return': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'rule_violation': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export default function FinesDeposits() {
  const [activeTab, setActiveTab] = useState<'fines' | 'deposits'>('fines');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [deposits, setDeposits] = useState<CautionDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fine form state
  const [isAddFineOpen, setIsAddFineOpen] = useState(false);
  const [fineResident, setFineResident] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [fineCategory, setFineCategory] = useState<Fine['category']>('noise');
  const [fineDate, setFineDate] = useState(new Date().toISOString().split('T')[0]);
  const [fineFormLoading, setFineFormLoading] = useState(false);
  const [fineFormError, setFineFormError] = useState<string | null>(null);

  // Deposit form state
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [depositResident, setDepositResident] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNotes, setDepositNotes] = useState('');
  const [depositFormLoading, setDepositFormLoading] = useState(false);
  const [depositFormError, setDepositFormError] = useState<string | null>(null);

  // Refund modal state
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundDeposit, setRefundDeposit] = useState<CautionDeposit | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, f, d] = await Promise.all([
        pb.collection('residents').getFullList({ sort: 'fullName', filter: 'status = "active"' }),
        pb.collection('fines').getFullList({ sort: '-created', expand: 'resident' }),
        pb.collection('caution_deposits').getFullList({ sort: '-created', expand: 'resident' }),
      ]);
      setResidents(r as any);
      setFines(f as any);
      setDeposits(d as any);
    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fineResident || !fineAmount || !fineReason) {
      setFineFormError('Please fill in all required fields.');
      return;
    }
    setFineFormLoading(true);
    setFineFormError(null);
    try {
      await pb.collection('fines').create({
        resident: fineResident,
        amount: parseFloat(fineAmount),
        reason: fineReason,
        category: fineCategory,
        fineDate: fineDate + ' 00:00:00.000Z',
        status: 'pending',
      });
      setIsAddFineOpen(false);
      setFineResident(''); setFineAmount(''); setFineReason('');
      setFineCategory('noise'); setFineDate(new Date().toISOString().split('T')[0]);
      fetchAll();
    } catch (err: any) {
      setFineFormError(err.message || 'Failed to add fine.');
    } finally {
      setFineFormLoading(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositResident || !depositAmount) {
      setDepositFormError('Please fill in all required fields.');
      return;
    }
    setDepositFormLoading(true);
    setDepositFormError(null);
    try {
      await pb.collection('caution_deposits').create({
        resident: depositResident,
        amount: parseFloat(depositAmount),
        depositDate: depositDate + ' 00:00:00.000Z',
        status: 'held',
        notes: depositNotes,
      });
      setIsAddDepositOpen(false);
      setDepositResident(''); setDepositAmount(''); setDepositNotes('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      fetchAll();
    } catch (err: any) {
      setDepositFormError(err.message || 'Failed to record deposit.');
    } finally {
      setDepositFormLoading(false);
    }
  };

  const updateFineStatus = async (id: string, status: 'paid' | 'waived') => {
    try {
      await pb.collection('fines').update(id, { status });
      fetchAll();
    } catch (err: any) { setError(err.message); }
  };

  // Compute refund automatically: deposit - pending fines for that resident
  const computeRefund = (deposit: CautionDeposit) => {
    const pendingFines = fines.filter(
      f => f.resident === deposit.resident && f.status === 'pending'
    );
    const totalFines = pendingFines.reduce((s, f) => s + Number(f.amount), 0);
    const refund = Math.max(0, Number(deposit.amount) - totalFines);
    return { totalFines, refund, pendingFines };
  };

  const handleRefund = async () => {
    if (!refundDeposit) return;
    setRefundLoading(true);
    setRefundError(null);
    const { totalFines, refund, pendingFines } = computeRefund(refundDeposit);
    try {
      // Mark all pending fines as paid (deducted from caution)
      await Promise.all(pendingFines.map(f => pb.collection('fines').update(f.id, { status: 'paid' })));
      // Update deposit
      await pb.collection('caution_deposits').update(refundDeposit.id, {
        status: refund > 0 ? 'refunded' : 'forfeited',
        refundAmount: refund,
        refundDate: new Date().toISOString(),
        deductedFines: totalFines,
      });
      setIsRefundOpen(false);
      setRefundDeposit(null);
      fetchAll();
    } catch (err: any) {
      setRefundError(err.message || 'Failed to process refund.');
    } finally {
      setRefundLoading(false);
    }
  };

  const totalPendingFines = fines.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0);
  const totalDepositsHeld = deposits.filter(d => d.status === 'held').reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Gavel className="w-8 h-8 text-rose-500" />
            Fines &amp; Deposits
          </h2>
          <p className="text-slate-400 mt-1">Manage resident fines and caution money deposits.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === 'fines' ? (
            <button
              onClick={() => setIsAddFineOpen(true)}
              className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-900/20"
            >
              <Plus className="w-4 h-4" /> Raise Fine
            </button>
          ) : (
            <button
              onClick={() => setIsAddDepositOpen(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <Plus className="w-4 h-4" /> Record Deposit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl">
            <Gavel className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending Fines</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2">₹{totalPendingFines.toLocaleString('en-IN')}</h3>
          <div className="text-[11px] text-slate-500 mt-2">{fines.filter(f => f.status === 'pending').length} outstanding fines</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Deposits Held</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2">₹{totalDepositsHeld.toLocaleString('en-IN')}</h3>
          <div className="text-[11px] text-slate-500 mt-2">{deposits.filter(d => d.status === 'held').length} active deposits</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Refunded</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2">
            ₹{deposits.filter(d => d.status === 'refunded').reduce((s, d) => s + Number(d.refundAmount || 0), 0).toLocaleString('en-IN')}
          </h3>
          <div className="text-[11px] text-slate-500 mt-2">{deposits.filter(d => d.status === 'refunded').length} deposits refunded</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button onClick={() => setActiveTab('fines')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fines' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
          Fines
        </button>
        <button onClick={() => setActiveTab('deposits')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'deposits' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
          Caution Deposits
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : activeTab === 'fines' ? (
        /* ── FINES TABLE ── */
        fines.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            <Gavel className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="font-semibold">No fines recorded.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  {['Resident', 'Category', 'Reason', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fines.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">{f.expand?.resident?.fullName || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryColor(f.category)}`}>
                        {FINE_CATEGORIES.find(c => c.value === f.category)?.label || f.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400 max-w-[200px] truncate">{f.reason}</td>
                    <td className="p-4 font-bold text-rose-400">₹{Number(f.amount).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(f.fineDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        f.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        f.status === 'waived' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>{f.status}</span>
                    </td>
                    <td className="p-4">
                      {f.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateFineStatus(f.id, 'paid')} title="Mark Paid" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateFineStatus(f.id, 'waived')} title="Waive Fine" className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-all">
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ── DEPOSITS TABLE ── */
        deposits.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="font-semibold">No caution deposits recorded.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  {['Resident', 'Deposit', 'Date', 'Pending Fines', 'Refund (Est.)', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deposits.map(d => {
                  const { totalFines, refund } = computeRefund(d);
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-semibold text-slate-200">{d.expand?.resident?.fullName || '—'}</td>
                      <td className="p-4 font-bold text-slate-200">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-xs text-slate-500">{new Date(d.depositDate).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-rose-400">{d.status === 'held' ? `₹${totalFines.toLocaleString('en-IN')}` : `₹${Number(d.deductedFines || 0).toLocaleString('en-IN')} (deducted)`}</td>
                      <td className="p-4 font-bold text-emerald-400">{d.status === 'held' ? `₹${refund.toLocaleString('en-IN')}` : `₹${Number(d.refundAmount || 0).toLocaleString('en-IN')}`}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          d.status === 'held' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          d.status === 'refunded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>{d.status}</span>
                      </td>
                      <td className="p-4">
                        {d.status === 'held' && (
                          <button
                            onClick={() => { setRefundDeposit(d); setRefundError(null); setIsRefundOpen(true); }}
                            className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all"
                          >
                            Process Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── ADD FINE MODAL ── */}
      {isAddFineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Gavel className="w-4 h-4 text-rose-400" /> Raise Fine</h3>
              <button onClick={() => setIsAddFineOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddFine} className="p-5 space-y-4">
              {fineFormError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{fineFormError}</div>}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Resident *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={fineResident} onChange={e => setFineResident(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-200 focus:outline-none focus:border-rose-500 appearance-none">
                    <option value="">-- Select Resident --</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Category *</label>
                  <select value={fineCategory} onChange={e => setFineCategory(e.target.value as Fine['category'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 appearance-none">
                    {FINE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Amount (₹) *</label>
                  <input type="number" min="1" value={fineAmount} onChange={e => setFineAmount(e.target.value)} placeholder="500" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Reason *</label>
                <textarea value={fineReason} onChange={e => setFineReason(e.target.value)} rows={2} placeholder="Describe the violation..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Date</label>
                <input type="date" value={fineDate} onChange={e => setFineDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 [color-scheme:dark]" />
              </div>
              <button type="submit" disabled={fineFormLoading} className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {fineFormLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Gavel className="w-4 h-4" /> Raise Fine</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD DEPOSIT MODAL ── */}
      {isAddDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Record Caution Deposit</h3>
              <button onClick={() => setIsAddDepositOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddDeposit} className="p-5 space-y-4">
              {depositFormError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{depositFormError}</div>}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Resident *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={depositResident} onChange={e => setDepositResident(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none">
                    <option value="">-- Select Resident --</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Amount (₹) *</label>
                  <input type="number" min="1" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="5000" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Date</label>
                  <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Notes</label>
                <input type="text" value={depositNotes} onChange={e => setDepositNotes(e.target.value)} placeholder="Any notes..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
              <button type="submit" disabled={depositFormLoading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {depositFormLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Shield className="w-4 h-4" /> Record Deposit</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ── */}
      {isRefundOpen && refundDeposit && (() => {
        const { totalFines, refund, pendingFines } = computeRefund(refundDeposit);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-slate-800">
                <h3 className="font-bold text-slate-100 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-emerald-400" /> Process Refund</h3>
                <button onClick={() => setIsRefundOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {refundError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{refundError}</div>}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Resident</span>
                    <span className="font-semibold text-slate-200">{refundDeposit.expand?.resident?.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Deposit Amount</span>
                    <span className="font-bold text-slate-200">₹{Number(refundDeposit.amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pending Fines ({pendingFines.length})</span>
                    <span className="font-bold text-rose-400">- ₹{totalFines.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="font-bold text-slate-300">Refund Amount</span>
                    <span className="text-xl font-black text-emerald-400">₹{refund.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {pendingFines.length > 0 && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    ⚡ All {pendingFines.length} pending fines will be auto-marked as paid (deducted from caution deposit).
                  </p>
                )}
                <button onClick={handleRefund} disabled={refundLoading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                  {refundLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirm Refund</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
