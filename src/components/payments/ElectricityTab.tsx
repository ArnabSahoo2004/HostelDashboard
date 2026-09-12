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
  Trash2
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
  const [dueDate, setDueDate] = useState('');
  
  // Meters State
  const [meters, setMeters] = useState([{ id: Date.now(), name: 'Main Meter', prev: '', curr: '', rate: '7', isFirstTime: true }]);
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
      setMeters([{ id: Date.now(), name: 'Main Meter', prev: '', curr: '', rate: '7', isFirstTime: true }]);
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
          if (lastBill.meters && lastBill.meters.length > 0) {
             const newMeters = lastBill.meters.map((m: any) => ({
                id: Math.random(),
                name: m.name || 'Meter',
                prev: String(m.currentReading),
                curr: '',
                rate: String(m.ratePerUnit || '7'),
                isFirstTime: false
             }));
             setMeters(newMeters);
          } else {
             // Legacy fallback
             setMeters([{
                id: Date.now(),
                name: 'Main Meter',
                prev: String(lastBill.currentReading || 0),
                curr: '',
                rate: String(lastBill.ratePerUnit || '7'),
                isFirstTime: false
             }]);
          }
        } else {
          setMeters([{ id: Date.now(), name: 'Main Meter', prev: '', curr: '', rate: '7', isFirstTime: true }]);
        }
      } catch {
        setMeters([{ id: Date.now(), name: 'Main Meter', prev: '', curr: '', rate: '7', isFirstTime: true }]);
      } finally {
        setLoadingPrevReading(false);
      }
    };
    fetchLastReading();
  }, [selectedRoomId]);

  const calculateMeterAmount = (prevStr: string, currStr: string, rateStr: string) => {
    const prev = Number(prevStr) || 0;
    const curr = Number(currStr) || 0;
    const rate = Number(rateStr) || 0;
    if (curr > prev) {
      return (curr - prev) * rate;
    }
    return 0;
  };

  const totalAmount = React.useMemo(() => {
    return meters.reduce((sum, m) => sum + calculateMeterAmount(m.prev, m.curr, m.rate), 0);
  }, [meters]);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
       alert('Total amount must be greater than 0. Check readings and rate.');
       return;
    }
    // Verify all meters have valid names
    if (meters.some(m => !m.name.trim())) {
       alert('All meters must have a valid name.');
       return;
    }

    setActionLoading(true);
    try {
      const monthStart = `${billingMonth}-01 12:00:00.000Z`;
      const dueStart = `${dueDate} 12:00:00.000Z`;
      
      const structuredMeters = meters.map(m => ({
        name: m.name.trim(),
        previousReading: Number(m.prev) || 0,
        currentReading: Number(m.curr) || 0,
        ratePerUnit: Number(m.rate) || 0,
        amount: calculateMeterAmount(m.prev, m.curr, m.rate),
        isFirstTime: m.isFirstTime
      }));

      await pb.collection('electricity_bills').create({
        room: selectedRoomId,
        billingMonth: monthStart,
        meters: structuredMeters,
        totalAmount,
        dueDate: dueStart,
        status: 'draft'
      });

      setIsAddOpen(false);
      setSelectedRoomId('');
      setMeters([{ id: Date.now(), name: 'Main Meter', prev: '', curr: '', rate: '7', isFirstTime: true }]);
      setDueDate('');
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
        const existingInvoices = await pb.collection('payments').getList(1, 1, {
           filter: `resident = '${booking.resident}' && monthFor = '${bill.billingMonth}'`
        });
        
        if (existingInvoices.items.length > 0) {
           const invoice = existingInvoices.items[0] as any;
           await pb.collection('payments').update(invoice.id, {
              electricityAmount: splitAmount,
              amount: (invoice.rentAmount || 0) + splitAmount + (invoice.fineAmount || 0)
           });
        } else {
           await pb.collection('payments').create({
              resident: booking.resident,
              booking: booking.id,
              monthFor: bill.billingMonth,
              rentAmount: 0,
              electricityAmount: splitAmount,
              fineAmount: 0,
              amount: splitAmount,
              dueDate: bill.dueDate,
              status: 'pending'
           });
        }
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

  const handleDeleteBill = async (bill: ElectricityBill) => {
    let message = 'Are you sure you want to delete this bill?';
    if (bill.status === 'split_and_billed') {
      message = 'WARNING: This bill has already been split among residents. Deleting this record here will NOT automatically remove the electricity charges from the residents\' pending invoices. You will need to manually adjust their invoices if needed.\n\nDo you still want to delete this record?';
    }

    if (!window.confirm(message)) return;

    setActionLoading(true);
    try {
      await pb.collection('electricity_bills').delete(bill.id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bill');
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
              <div className="flex justify-between items-start mb-4 pr-8 relative">
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
                
                <button
                  disabled={actionLoading}
                  onClick={() => handleDeleteBill(bill)}
                  className="absolute -top-2 -right-2 p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Bill"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4"/> Month</span>
                  <span className="text-slate-200">{new Date(bill.billingMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Units</span>
                  <span className="text-slate-200">
                    {bill.meters && bill.meters.length > 0 
                      ? bill.meters.reduce((sum, m) => sum + (m.currentReading - m.previousReading), 0)
                      : (bill.currentReading || 0) - (bill.previousReading || 0)} units
                  </span>
                </div>
                {bill.meters && bill.meters.length > 0 && (
                  <div className="flex flex-col gap-1 text-xs text-slate-500 pt-1 pb-1">
                    {bill.meters.map((m, idx) => (
                       <div key={idx} className="flex justify-between">
                         <span>- {m.name}</span>
                         <span>₹{m.amount}</span>
                       </div>
                    ))}
                  </div>
                )}
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
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
            <form onSubmit={handleCreateBill} className="p-5 overflow-y-auto">
              <div className="space-y-4">
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

              </div>

              {/* Dynamic Meters Section */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-bold text-slate-200">Meter Readings</h4>
                   <button 
                     type="button" 
                     onClick={() => setMeters([...meters, { id: Date.now(), name: `Meter ${meters.length + 1}`, prev: '', curr: '', rate: '7', isFirstTime: true }])}
                     className="text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                   >
                     <Plus className="w-3 h-3" /> Add Meter
                   </button>
                </div>

                {meters.map((meter, index) => (
                  <div key={meter.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-4 relative">
                    {meters.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => setMeters(meters.filter(m => m.id !== meter.id))}
                        className="absolute -top-2 -right-2 bg-rose-500/20 text-rose-500 hover:bg-rose-500 text-xs w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">Meter Name *</label>
                        <input
                          type="text"
                          required
                          value={meter.name}
                          onChange={(e) => {
                             const newMeters = [...meters];
                             newMeters[index].name = e.target.value;
                             setMeters(newMeters);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">Rate Per Unit (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.1"
                          value={meter.rate}
                          onChange={(e) => {
                             const newMeters = [...meters];
                             newMeters[index].rate = e.target.value;
                             setMeters(newMeters);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          Start Units
                          {!meter.isFirstTime && <span className="text-amber-500 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-1 rounded-sm">Auto</span>}
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={loadingPrevReading ? '' : meter.prev}
                          onChange={(e) => {
                             const newMeters = [...meters];
                             newMeters[index].prev = e.target.value;
                             setMeters(newMeters);
                          }}
                          readOnly={!meter.isFirstTime}
                          placeholder={loadingPrevReading ? 'Fetching...' : ''}
                          className={`w-full border rounded-xl py-2 px-3.5 text-sm focus:outline-none transition-colors ${
                            !meter.isFirstTime
                              ? 'bg-slate-800 border-amber-500/30 text-amber-300 cursor-not-allowed'
                              : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">End Units *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={meter.curr}
                          onChange={(e) => {
                             const newMeters = [...meters];
                             newMeters[index].curr = e.target.value;
                             setMeters(newMeters);
                          }}
                          placeholder="New reading"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
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
