import React, { useState, useEffect } from 'react';
import pb from '../api/client';
import type { Payment } from '../types';
import { generateHTMLInvoicePDF } from '../utils/generateInvoice';
import { 
  Search, 
  IndianRupee, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  SlidersHorizontal,
  RefreshCw,
  FileDown,
  X,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import ReceiptTemplate from '../components/shared/ReceiptTemplate';
import ElectricityTab from '../components/payments/ElectricityTab';
import FoodBillsTab from '../components/payments/FoodBillsTab';

const Payments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dues' | 'electricity' | 'food'>('dues');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  // Generation Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generationMonth, setGenerationMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  // HTML-to-PDF State
  const [selectedReceipt, setSelectedReceipt] = useState<{ payment: Payment | null; receiptNo: number }>({
    payment: null,
    receiptNo: 0
  });
  const receiptRef = React.useRef<HTMLDivElement>(null);

  // Pay Confirmation Modal State
  const [paymentToPay, setPaymentToPay] = useState<Payment | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('payments').getFullList({ expand: 'resident,booking,booking.bed,booking.bed.room' });
      setPayments(records as any);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    // If a receipt is selected, trigger PDF generation after it renders
    if (selectedReceipt.payment) {
      setTimeout(async () => {
        if (!receiptRef.current) return;
        try {
          const filename = `Receipt_${selectedReceipt.payment?.expand?.resident?.fullName?.replace(/\s+/g, '_') || 'Guest'}_${selectedReceipt.receiptNo}.pdf`;
          await generateHTMLInvoicePDF(receiptRef.current, filename);
        } catch (err) {
          console.error('Failed to generate PDF', err);
          alert('Error generating PDF receipt.');
        } finally {
          setSelectedReceipt({ payment: null, receiptNo: 0 }); // reset
        }
      }, 100); // Wait a tick for Tailwind styles to apply to the DOM node
    }
  }, [selectedReceipt.payment]);

  const handleMarkAsPaid = async () => {
    if (!paymentToPay) return;
    setPayLoading(true);
    setPayError(null);
    try {
      await pb.collection('payments').update(paymentToPay.id, {
        status: 'paid',
        paidDate: new Date().toISOString()
      });
      setPaymentToPay(null);
      fetchPayments();
    } catch (err: any) {
      setPayError(err.message || 'Failed to update payment status.');
    } finally {
      setPayLoading(false);
    }
  };

  const generateTestInvoicePDF = () => {
    const dummyPayment = {
      id: 'dummy',
      monthFor: '2026-07-01',
      amount: 4500,
      dueDate: '2026-07-05',
      paidDate: new Date().toISOString(),
      status: 'paid',
      expand: {
        resident: { fullName: 'Jane Doe' },
        booking: { expand: { bed: { bedLabel: 'A', room: { roomNumber: '101', hostel: 'Satabdi' } } } }
      }
    } as any;
    
    setSelectedReceipt({ payment: dummyPayment, receiptNo: 9999 });
  };

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateLoading(true);
    setGenerateMessage(null);
    try {
      const [year, month] = generationMonth.split('-');
      const monthStart = `${year}-${month}-01 12:00:00.000Z`;

      const activeBookings = await pb.collection('bookings').getFullList({
        filter: `checkOutDate = ''`,
        expand: 'resident,bed,bed.room'
      });

      let generated = 0;
      for (const booking of activeBookings) {
        // Check if payment exists
        const existing = await pb.collection('payments').getList(1, 1, {
          filter: `resident = '${booking.resident}' && monthFor = '${monthStart}'`
        });
        
        if (existing.items.length === 0) {
          const room = booking.expand?.bed?.expand?.room;
          if (room) {
             await pb.collection('payments').create({
                resident: booking.resident,
                booking: booking.id,
                monthFor: monthStart,
                amount: room.monthlyRent,
                dueDate: `${year}-${month}-05 12:00:00.000Z`,
                status: 'pending'
             });
             generated++;
          }
        }
      }

      setGenerateMessage(`Generated ${generated} new rent bills.`);
      fetchPayments();
      setTimeout(() => {
        setIsGenerateOpen(false);
        setGenerateMessage(null);
      }, 2000);
    } catch (err: any) {
      setGenerateMessage(err.message || 'Failed to generate rent bills.');
    } finally {
      setGenerateLoading(false);
    }
  };

  // KPI Calculations
  const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').length;

  // Filtered Payments
  const filteredPayments = payments.filter(pay => {
    const matchesSearch = 
      pay.expand?.resident?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = 
      statusFilter === 'all' || 
      pay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-primary-500" />
            Rent Payments & Dues
          </h2>
          <p className="text-slate-400 mt-1">Manage monthly PG rental invoicing, collections, and pending accounts.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:text-slate-200 transition-all text-slate-400"
            title="Refresh Dues"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={generateTestInvoicePDF}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all duration-200 border border-slate-700 flex items-center justify-center gap-2"
            title="Download a sample receipt to preview the format"
          >
            <FileDown className="w-4 h-4" />
            <span>Test Receipt</span>
          </button>
          
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Generate Monthly Bills</span>
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Collected */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-950/5">
          <div className="absolute right-4 top-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Rent Collected</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2 flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-emerald-400">₹</span>
            {totalCollected.toLocaleString('en-IN')}
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            Expected gross: ₹{totalExpected.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 2: Total Pending */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-amber-950/5">
          <div className="absolute right-4 top-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending Dues</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2 flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-amber-400">₹</span>
            {totalPending.toLocaleString('en-IN')}
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            Outstanding balances for active accounts
          </div>
        </div>

        {/* Card 3: Overdue Accounts */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-rose-950/5">
          <div className="absolute right-4 top-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Overdue Invoices</span>
          <h3 className="text-2xl font-black text-slate-100 mt-2 flex items-baseline gap-0.5">
            {totalOverdue}
            <span className="text-xs font-semibold text-rose-400 ml-1.5 uppercase">Accounts</span>
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            Dues exceeding grace periods
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('dues')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'dues' 
              ? 'border-primary-500 text-primary-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          Resident Dues
        </button>
        <button
          onClick={() => setActiveTab('electricity')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'electricity' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          Room Utility Bills
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'food' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          Food & Mess Bills
        </button>
      </div>

      {activeTab === 'dues' ? (
        <>
          {/* Filter and Search controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by resident name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0 mr-1 hidden md:block" />
              {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all shrink-0 capitalize ${
                    statusFilter === status
                      ? 'bg-slate-800 text-slate-200 border-slate-700'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-300'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Payments Table card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
            <span className="text-sm font-medium">Loading rent payments...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-10 h-10" />
            <span className="font-semibold">{error}</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Calendar className="w-12 h-12 text-slate-700 mb-4" />
            <span className="font-semibold">No payment records found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Resident Name</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Billing Period</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Room Location</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount & Type</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Due Date</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredPayments.map((pay) => {
                  const bookingBed = pay.expand?.booking?.expand?.bed;
                  const isElectricity = pay.paymentType === 'electricity';
                  const isFood = pay.paymentType === 'food';
                  return (
                    <tr key={pay.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 font-bold text-slate-200">
                        {pay.expand?.resident?.fullName}
                      </td>
                      <td className="p-4 text-sm text-slate-300">
                        {formatMonth(pay.monthFor)}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {bookingBed ? (
                          <span>
                            {bookingBed.room.hostel} • Room {bookingBed.room.roomNumber} ({bookingBed.bedLabel})
                          </span>
                        ) : (
                          <span className="italic text-slate-600">No active assignment</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-200">
                          ₹{Number(pay.amount).toLocaleString('en-IN')}
                        </div>
                        <div className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                           isElectricity ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                           isFood ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                           'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                        }`}>
                          {isElectricity ? 'Electricity' : isFood ? 'Food & Mess' : 'Rent'}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-450">
                        {new Date(pay.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pay.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          pay.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {pay.status !== 'paid' && (
                          <button
                            onClick={() => setPaymentToPay(pay)}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {pay.status !== 'paid' && (
                          <button
                            onClick={async () => {
                              try {
                                const residentPhone = pay.expand?.resident?.phone;
                                if (!residentPhone) {
                                  alert('Resident has no phone number registered.');
                                  return;
                                }
                                const res = await fetch('http://localhost:5000/api/whatsapp/send-reminder', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    phone: residentPhone,
                                    message: `Hi ${pay.expand?.resident?.fullName}, this is a gentle reminder that your hostel rent of ₹${pay.amount} for the month of ${formatMonth(pay.monthFor)} is due. Please clear your dues at the earliest. Ignore if already paid.`
                                  })
                                });
                                const data = await res.json();
                                if (res.ok) alert('WhatsApp reminder sent successfully!');
                                else alert('Failed to send reminder: ' + data.error);
                              } catch(e) {
                                alert('An error occurred.');
                              }
                            }}
                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors border border-indigo-500/20"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const bNumber = Math.floor(Math.random() * 9000) + 1000;
                            setSelectedReceipt({ payment: pay, receiptNo: bNumber });
                          }}
                          className="p-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20"
                          title="Download Invoice/Receipt"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      ) : activeTab === 'electricity' ? (
        <ElectricityTab />
      ) : (
        <FoodBillsTab />
      )}

      {/* Generate Invoices Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl shadow-primary-900/10 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                Generate Monthly Bills
              </h3>
              <button 
                onClick={() => setIsGenerateOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoices} className="p-6 space-y-5 overflow-y-auto">
              <p className="text-sm text-slate-400">
                This will generate rent invoices for all residents who are currently checked in and do not already have a bill for the selected month.
              </p>

              {generateMessage && (
                <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                  generateMessage.includes('Failed')
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{generateMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Billing Month *</label>
                <input
                  type="month"
                  required
                  value={generationMonth}
                  onChange={(e) => setGenerationMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateLoading}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generateLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Bills</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Confirmation Modal */}
      {paymentToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-500" />
                Confirm Payment
              </h3>
            </div>
            
            <div className="p-6 space-y-4 bg-slate-950/30">
              <p className="text-sm text-slate-300 text-center">
                Mark invoice for <br/>
                <span className="font-bold text-slate-100 text-base block mt-2">{paymentToPay.expand?.resident?.fullName}</span>
                <span className="text-emerald-400 font-bold block mt-1">₹{Number(paymentToPay.amount).toLocaleString('en-IN')}</span>
              </p>
              
              {payError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                  {payError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
              <button
                onClick={() => setPaymentToPay(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
                disabled={payLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={payLoading}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {payLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <span>Confirm Paid</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for PDF Rendering */}
      <div className="fixed top-0 left-0 pointer-events-none z-[-50]">
        {selectedReceipt.payment && (
          <ReceiptTemplate
            ref={receiptRef}
            payment={selectedReceipt.payment}
            allPayments={payments}
            receiptNumber={selectedReceipt.receiptNo}
          />
        )}
      </div>
    </div>
  );
};

export default Payments;
