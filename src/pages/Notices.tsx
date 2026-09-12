import { useState, useEffect } from 'react';
import pb from '../api/client';
import type { LeaveNotice, HomeNotice, Resident } from '../types';
import {
  FileText, Home, Plus, X, AlertTriangle, CheckCircle,
  XCircle, Clock, User, RefreshCw, ChevronDown, MapPin, Phone
} from 'lucide-react';

function statusBadge(status: string) {
  switch (status) {
    case 'approved': case 'returned':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'rejected':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'active':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export default function Notices() {
  const [activeTab, setActiveTab] = useState<'leave' | 'home'>('leave');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [leaves, setLeaves] = useState<LeaveNotice[]>([]);
  const [homeNotices, setHomeNotices] = useState<HomeNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leave form
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveResident, setLeaveResident] = useState('');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFormLoading, setLeaveFormLoading] = useState(false);
  const [leaveFormError, setLeaveFormError] = useState<string | null>(null);

  // Home notice form
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [homeResident, setHomeResident] = useState('');
  const [homeDeparture, setHomeDeparture] = useState('');
  const [homeReturn, setHomeReturn] = useState('');
  const [homeDestination, setHomeDestination] = useState('');
  const [homeContact, setHomeContact] = useState('');
  const [homeFormLoading, setHomeFormLoading] = useState(false);
  const [homeFormError, setHomeFormError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      const [r, l, h] = await Promise.all([
        pb.collection('residents').getFullList({ sort: 'fullName', filter: 'status = "active"' }),
        pb.collection('leave_notices').getFullList({ sort: '-created', expand: 'resident' }),
        pb.collection('home_notices').getFullList({ sort: '-created', expand: 'resident' }),
      ]);
      setResidents(r as any);
      setLeaves(l as any);
      setHomeNotices(h as any);
    } catch (err: any) { setError(err.message || 'Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveResident || !leaveFrom || !leaveTo || !leaveReason) {
      setLeaveFormError('Please fill in all required fields.'); return;
    }
    setLeaveFormLoading(true); setLeaveFormError(null);
    try {
      await pb.collection('leave_notices').create({
        resident: leaveResident,
        fromDate: leaveFrom + ' 00:00:00.000Z',
        toDate: leaveTo + ' 00:00:00.000Z',
        reason: leaveReason,
        status: 'pending',
      });
      setIsLeaveOpen(false);
      setLeaveResident(''); setLeaveFrom(''); setLeaveTo(''); setLeaveReason('');
      fetchAll();
    } catch (err: any) { setLeaveFormError(err.message || 'Failed to submit leave notice.'); }
    finally { setLeaveFormLoading(false); }
  };

  const handleAddHome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeResident || !homeDeparture || !homeReturn || !homeDestination) {
      setHomeFormError('Please fill in all required fields.'); return;
    }
    setHomeFormLoading(true); setHomeFormError(null);
    try {
      await pb.collection('home_notices').create({
        resident: homeResident,
        departureDate: homeDeparture + ' 00:00:00.000Z',
        returnDate: homeReturn + ' 00:00:00.000Z',
        destination: homeDestination,
        contactDuringLeave: homeContact,
        status: 'active',
      });
      setIsHomeOpen(false);
      setHomeResident(''); setHomeDeparture(''); setHomeReturn('');
      setHomeDestination(''); setHomeContact('');
      fetchAll();
    } catch (err: any) { setHomeFormError(err.message || 'Failed to submit home notice.'); }
    finally { setHomeFormLoading(false); }
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    try { await pb.collection('leave_notices').update(id, { status }); fetchAll(); }
    catch (err: any) { setError(err.message); }
  };

  const markReturned = async (id: string) => {
    try { await pb.collection('home_notices').update(id, { status: 'returned' }); fetchAll(); }
    catch (err: any) { setError(err.message); }
  };

  const awayNow = homeNotices.filter(h => h.status === 'active').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-sky-500" />
            Notices
          </h2>
          <p className="text-slate-400 mt-1">Manage leave applications and home-going notices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === 'leave' ? (
            <button onClick={() => setIsLeaveOpen(true)} className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-900/20">
              <Plus className="w-4 h-4" /> Add Leave Notice
            </button>
          ) : (
            <button onClick={() => setIsHomeOpen(true)} className="py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-violet-900/20">
              <Plus className="w-4 h-4" /> Add Home Notice
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Away Right Now</span>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{awayNow}</h3>
              <div className="text-[11px] text-slate-500 mt-1">Residents currently away</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl"><Home className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending Leave Requests</span>
              <h3 className="text-2xl font-black text-sky-400 mt-1">{pendingLeaves}</h3>
              <div className="text-[11px] text-slate-500 mt-1">Awaiting approval</div>
            </div>
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl"><Clock className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Notices</span>
              <h3 className="text-2xl font-black text-slate-200 mt-1">{leaves.length + homeNotices.length}</h3>
              <div className="text-[11px] text-slate-500 mt-1">All time</div>
            </div>
            <div className="p-2.5 bg-slate-700/50 border border-slate-700 text-slate-400 rounded-xl"><FileText className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button onClick={() => setActiveTab('leave')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'leave' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
          Leave Notices
        </button>
        <button onClick={() => setActiveTab('home')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'home' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
          Home Going
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : activeTab === 'leave' ? (
        leaves.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="font-semibold">No leave notices yet.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  {['Resident', 'From', 'To', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">{l.expand?.resident?.fullName || '—'}</td>
                    <td className="p-4 text-sm text-slate-400">{new Date(l.fromDate).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-slate-400">{new Date(l.toDate).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-slate-400 max-w-[200px] truncate">{l.reason}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadge(l.status)}`}>{l.status}</span>
                    </td>
                    <td className="p-4">
                      {l.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateLeaveStatus(l.id, 'approved')} title="Approve" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => updateLeaveStatus(l.id, 'rejected')} title="Reject" className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"><XCircle className="w-4 h-4" /></button>
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
        homeNotices.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            <Home className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="font-semibold">No home-going notices yet.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  {['Resident', 'Destination', 'Departed', 'Returns', 'Contact', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {homeNotices.map(h => (
                  <tr key={h.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">{h.expand?.resident?.fullName || '—'}</td>
                    <td className="p-4 text-sm text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-violet-400" />{h.destination}</td>
                    <td className="p-4 text-sm text-slate-400">{new Date(h.departureDate).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-slate-400">{new Date(h.returnDate).toLocaleDateString()}</td>
                    <td className="p-4 text-xs text-slate-500">
                      {h.contactDuringLeave && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{h.contactDuringLeave}</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadge(h.status)}`}>{h.status}</span>
                    </td>
                    <td className="p-4">
                      {h.status === 'active' && (
                        <button onClick={() => markReturned(h.id)} className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all">
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── LEAVE FORM MODAL ── */}
      {isLeaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><FileText className="w-4 h-4 text-sky-400" /> Add Leave Notice</h3>
              <button onClick={() => setIsLeaveOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddLeave} className="p-5 space-y-4">
              {leaveFormError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{leaveFormError}</div>}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Resident *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={leaveResident} onChange={e => setLeaveResident(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-200 focus:outline-none focus:border-sky-500 appearance-none">
                    <option value="">-- Select Resident --</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">From Date *</label>
                  <input type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 [color-scheme:dark]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">To Date *</label>
                  <input type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Reason *</label>
                <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={3} placeholder="Reason for leave..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none" />
              </div>
              <button type="submit" disabled={leaveFormLoading} className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {leaveFormLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><FileText className="w-4 h-4" /> Submit Notice</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── HOME NOTICE MODAL ── */}
      {isHomeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Home className="w-4 h-4 text-violet-400" /> Home Going Notice</h3>
              <button onClick={() => setIsHomeOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddHome} className="p-5 space-y-4">
              {homeFormError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{homeFormError}</div>}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Resident *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={homeResident} onChange={e => setHomeResident(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-200 focus:outline-none focus:border-violet-500 appearance-none">
                    <option value="">-- Select Resident --</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Destination *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type="text" value={homeDestination} onChange={e => setHomeDestination(e.target.value)} placeholder="e.g., Cuttack, Odisha" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Departure *</label>
                  <input type="date" value={homeDeparture} onChange={e => setHomeDeparture(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Returns *</label>
                  <input type="date" value={homeReturn} onChange={e => setHomeReturn(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500 [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Contact During Leave</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input type="text" value={homeContact} onChange={e => setHomeContact(e.target.value)} placeholder="Phone number while away" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <button type="submit" disabled={homeFormLoading} className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {homeFormLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Home className="w-4 h-4" /> Submit Notice</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
