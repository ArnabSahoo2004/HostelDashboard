import React, { useState, useEffect } from 'react';
import pb from '../../api/client';
import type { Room, ElectricityBill } from '../../types';
import { 
  Zap, 
  Plus,
  AlertTriangle,
  SplitSquareHorizontal,
  CheckCircle,
  X,
  IndianRupee,
  Calendar,
  Clock
} from 'lucide-react';

export default function ElectricityTab() {
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().substring(0, 7));
  const [previousReading, setPreviousReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('7');
  const [dueDate, setDueDate] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [loadingPrevReading, setLoadingPrevReading] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billsData, roomsData] = await Promise.all([
        pb.collection('electricity_bills').getFullList({ expand: 'room' }),
        pb.collection('rooms').getFullList({ sort: 'roomNumber' })
      ]);
      
      const sortedBills = (billsData as any[]).sort((a, b) => {
        return new Date(b.billingMonth).getTime() - new Date(a.billingMonth).getTime();
      });
      
      setBills(sortedBills);
      setRooms(roomsData as any[]);
    } catch (err: any) {
      if (err.response) {
        setError('API Error: ' + JSON.stringify(err.response));
      } else {
        setError(err.message || 'Failed to fetch data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-fetch previous reading when a room is selected
  useEffect(() => {
    if (!selectedRoomId) {
      setPreviousReading('');
      setIsFirstTime(true);
      return;
    }
    const fetchLastReading = async () => {
      setLoadingPrevReading(true);
      try {
        const lastBills = await pb.collection('electricity_bills').getList(1, 1, {
          filter: `room = '${selectedRoomId}'`,
          sort: '-billingMonth'
        });
        if (lastBills.items.length > 0) {
          const lastBill = lastBills.items[0] as any;
          setPreviousReading(String(lastBill.currentReading));
          setIsFirstTime(false);
        } else {
          setPreviousReading('');
          setIsFirstTime(true);
        }
      } catch {
        setPreviousReading('');
        setIsFirstTime(true);
      } finally {
        setLoadingPrevReading(false);
      }
    };
    fetchLastReading();
  }, [selectedRoomId]);

  const totalAmount = React.useMemo(() => {
    const prev = Number(previousReading) || 0;
    const curr = Number(currentReading) || 0;
    const rate = Number(ratePerUnit) || 0;
    if (curr > prev) {
      return (curr - prev) * rate;
    }
    return 0;
  }, [previousReading, currentReading, ratePerUnit]);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
       alert('Total amount must be greater than 0. Check readings and rate.');
       return;
    }
    setActionLoading(true);
    try {
      const monthStart = `${billingMonth}-01 12:00:00.000Z`;
      const dueStart = `${dueDate} 12:00:00.000Z`;
      await pb.collection('electricity_bills').create({
        room: selectedRoomId,
        billingMonth: monthStart,
        previousReading: Number(previousReading),
        currentReading: Number(currentReading),
        ratePerUnit: Number(ratePerUnit),
        totalAmount,
        dueDate: dueStart,
        status: 'draft'
      });
      setIsAddOpen(false);
      setSelectedRoomId('');
      setPreviousReading('');
      setCurrentReading('');
      setRatePerUnit('7');
      setDueDate('');
      setIsFirstTime(true);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSplitBill = async (bill: ElectricityBill) => {
    if (!window.confirm('Are you sure you want to split this bill? This will create pending electricity payments for all residents currently checked into this room.')) return;
    
    setActionLoading(true);
    try {
      const activeBookings = await pb.collection('bookings').getFullList({
        filter: `checkOutDate = '' && bed.room = '${bill.room}'`,
        expand: 'resident,bed'
      });

      if (activeBookings.length === 0) {
         alert('No active residents found in this room. Cannot split bill.');
         setActionLoading(false);
         return;
      }

      const splitAmount = Math.ceil(bill.totalAmount / activeBookings.length);
      
      for (const booking of activeBookings) {
        await pb.collection('payments').create({
          resident: booking.resident,
          booking: booking.id,
          monthFor: bill.billingMonth,
          amount: splitAmount,
          dueDate: bill.dueDate,
          status: 'pending',
          paymentType: 'electricity'
        });
      }

      await pb.collection('electricity_bills').update(bill.id, {
        status: 'split_and_billed'
      });

      fetchData();
      alert(`Successfully split ₹${bill.totalAmount} among ${activeBookings.length} residents (₹${splitAmount} each).`);
    } catch (err: any) {
      alert(err.message || 'Failed to split bill');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-200">Room Utility Bills ({rooms.length} rooms fetched)</h3>
          <p className="text-sm text-slate-400">Add meter readings and split electricity bills.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Room Bill
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map(bill => (
            <div key={bill.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xl font-bold text-slate-100">
                    Room {bill.expand?.room?.roomNumber}
                  </div>
                  <div className="text-xs text-slate-500">{bill.expand?.room?.hostel}</div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  bill.status === 'split_and_billed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                }`}>
                  {bill.status === 'split_and_billed' ? 'Billed' : 'Draft'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4"/> Month</span>
                  <span className="text-slate-200">{new Date(bill.billingMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Units</span>
                  <span className="text-slate-200">{(bill.currentReading || 0) - (bill.previousReading || 0)} @ ₹{bill.ratePerUnit}/unit</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold flex items-center gap-2"><IndianRupee className="w-4 h-4"/> Total</span>
                  <span className="text-amber-400 font-bold text-lg">₹{bill.totalAmount}</span>
                </div>
              </div>

              {bill.status === 'draft' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleSplitBill(bill)}
                  className="w-full py-2 bg-slate-800 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <SplitSquareHorizontal className="w-4 h-4" />
                  Split & Bill Residents
                </button>
              )}
              {bill.status === 'split_and_billed' && (
                <div className="w-full py-2 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-default">
                  <CheckCircle className="w-4 h-4" />
                  Successfully Split
                </div>
              )}
            </div>
          ))}
          {bills.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
               <Zap className="w-12 h-12 text-slate-700 mx-auto mb-3" />
               <h3 className="text-lg font-medium text-slate-300">No Utility Bills</h3>
               <p className="text-sm text-slate-500 mt-1">Add a new room electricity bill to get started.</p>
             </div>
          )}
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Add Room Bill
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBill} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Select Room *</label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 appearance-none"
                >
                  <option value="">Select Room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.hostel} - Room {r.roomNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Billing Month *</label>
                <input
                  type="month"
                  required
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    Starting Units
                    {!isFirstTime && <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Auto-filled</span>}
                    {isFirstTime && <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">First time</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={loadingPrevReading ? '' : previousReading}
                      onChange={(e) => setPreviousReading(e.target.value)}
                      readOnly={!isFirstTime}
                      placeholder={loadingPrevReading ? 'Fetching...' : isFirstTime ? 'Enter starting units' : ''}
                      className={`w-full border rounded-xl py-2 px-3.5 text-sm focus:outline-none transition-colors ${
                        !isFirstTime
                          ? 'bg-slate-800 border-amber-500/30 text-amber-300 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Current Reading *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    placeholder="Enter new meter reading"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Rate Per Unit (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={ratePerUnit}
                    onChange={(e) => setRatePerUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-600">Default: ₹7/unit</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="p-3 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-amber-500">Calculated Total</span>
                <span className="text-xl font-bold text-amber-400">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                disabled={actionLoading || totalAmount <= 0}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition-all mt-4 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Add Bill'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
