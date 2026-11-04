import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../useStudentAuth';
import pb from '../../api/client';
import QRCode from 'react-qr-code';
import {
  QrCode,
  CheckCircle2,
  Receipt,
  X,
  Copy,
  Check,
  Printer
} from 'lucide-react';

export const StudentDues: React.FC = () => {
  const { student } = useStudentAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const HOSTEL_UPI_ID = 'satabdihostel@upi';

  useEffect(() => {
    const fetchPayments = async () => {
      if (!student) return;
      try {
        setLoading(true);
        const records = await pb.collection('payments').getFullList({
          filter: `resident = "${student.id}"`,
          sort: '-created',
          expand: 'booking,booking.bed,booking.bed.room'
        });
        setPayments(records);
      } catch (err) {
        console.warn('Error fetching student payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [student]);

  const activeDue = payments.find((p) => p.status === 'pending' || p.status === 'overdue');
  const pastPaid = payments.filter((p) => p.status === 'paid');

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(HOSTEL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const booking = student?.expand?.bookings_via_resident?.[0];
  const room = booking?.expand?.bed?.expand?.room;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Hostel Fees & Invoices
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Monthly room rent, electricity bills, and payment receipts
        </p>
      </div>

      {/* Responsive Grid: 2 cols for bills/history, 1 col for UPI on laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (2 Cols on Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Active Bill / Outstanding Card */}
          {activeDue ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 p-5 sm:p-6 shadow-xs relative overflow-hidden transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                    Current Outstanding Due
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Billing Cycle: {new Date(activeDue.monthFor || activeDue.created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    ₹{activeDue.amount?.toLocaleString()}
                  </h3>
                </div>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all self-start"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pay via UPI / QR</span>
                </button>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Room Rent</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{activeDue.rentAmount || 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Electricity</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{activeDue.electricityAmount || 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Food & Mess</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{activeDue.foodAmount || 0}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Fines / Others</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{activeDue.fineAmount || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/20 text-center shadow-xs transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Dues Cleared</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You have no outstanding payments for the current billing cycle.
              </p>
            </div>
          )}

          {/* Payment History Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Payment Receipts History
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading invoices...</div>
            ) : pastPaid.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500">
                No past receipts recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {pastPaid.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          ₹{item.amount?.toLocaleString()}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Paid on:{' '}
                          {new Date(item.paidDate || item.created).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        PAID
                      </span>
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar Card on Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Permanent UPI Payment Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs text-center transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hostel UPI QR Code</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
              Scan with GPay, PhonePe, Paytm or Banking App
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xs border border-slate-200 mb-3">
              <QRCode
                value={`upi://pay?pa=${HOSTEL_UPI_ID}&pn=Satabdi%20Girls%20Hostel&am=${activeDue?.amount || ''}&cu=INR`}
                size={160}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs mb-3">
              <span className="font-mono text-slate-800 dark:text-emerald-400 font-bold">{HOSTEL_UPI_ID}</span>
              <button
                onClick={handleCopyUpi}
                className="flex items-center gap-1 py-1 px-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors font-medium text-[11px]"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-left">
              After payment, share a screenshot to Hostel WhatsApp (+91 78488 01864) for instant receipt verification.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================================
          MODAL: PAY VIA UPI QR CODE (Mobile Popup)
         ========================================================== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Hostel UPI Payment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Scan with any UPI app to pay ₹{activeDue?.amount?.toLocaleString() || ''}
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xs border border-slate-200 mb-4">
              <QRCode
                value={`upi://pay?pa=${HOSTEL_UPI_ID}&pn=Satabdi%20Girls%20Hostel&am=${activeDue?.amount || ''}&cu=INR`}
                size={180}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs mb-4">
              <span className="font-mono text-slate-900 dark:text-emerald-400 font-bold">{HOSTEL_UPI_ID}</span>
              <button
                onClick={handleCopyUpi}
                className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Send the screenshot on WhatsApp (+91 78488 01864) for instant payment clearance.
            </p>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: PRINTABLE / DIGITAL RECEIPT MODAL
         ========================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-200">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="border-b border-slate-200 pb-4 mb-4 text-center">
              <h3 className="text-xl font-black text-slate-950 tracking-tight">
                SATABDI GIRLS' HOSTEL
              </h3>
              <p className="text-[11px] text-slate-500">Official Rent & Maintenance Receipt</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                Payment Cleared
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-slate-700 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold">REC-{selectedReceipt.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Resident Name:</span>
                <span className="font-bold text-slate-900">{student?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Allocated:</span>
                <span>{room ? `Room ${room.roomNumber}` : 'Hostel Block'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span>
                  {new Date(selectedReceipt.paidDate || selectedReceipt.created).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="border-t border-b border-slate-200 py-3 my-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Room Rent:</span>
                <span>₹{selectedReceipt.rentAmount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Electricity Bill:</span>
                <span>₹{selectedReceipt.electricityAmount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Food & Mess:</span>
                <span>₹{selectedReceipt.foodAmount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fines / Adjustments:</span>
                <span>₹{selectedReceipt.fineAmount || 0}</span>
              </div>
              <div className="flex justify-between font-black text-base text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount Paid:</span>
                <span>₹{selectedReceipt.amount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDues;
