import { forwardRef } from 'react';
import type { Payment } from '../../types';
import { fmtDate, fmtMonth } from '../../utils/generateInvoice';

interface ReceiptTemplateProps {
  payment: Payment | null;
  allPayments?: Payment[];
  receiptNumber: number;
  settings?: any;
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ payment, receiptNumber, settings }, ref) => {
    if (!payment) return null;

    const monthFor = payment.monthFor;

    const bookingBed = payment.expand?.booking?.expand?.bed;
    const roomInfo = bookingBed
      ? `Room ${bookingBed.expand?.room?.roomNumber ?? bookingBed.room} (${bookingBed.bedLabel})`
      : 'No active assignment';

    const residentName = payment.expand?.resident?.fullName || 'Resident';
    const residentPhone = payment.expand?.resident?.phone || 'N/A';

    const receiptDate = fmtDate(payment.paidDate || new Date().toISOString());
    const billingMonthStr = fmtMonth(monthFor);
    const formattedReceiptNo = `INV-${new Date().getFullYear()}-${String(receiptNumber).padStart(4, '0')}`;

    const rentAmount = payment.rentAmount || 0;
    const electricityAmount = payment.electricityAmount || 0;
    const fineAmount = payment.fineAmount || 0;

    const totalAmount = payment.amount || 0;

    // Use dynamic settings or fallback to placeholders
    const hostelName = settings?.hostelName || "Satabdi Girls' Hostel";
    const tagline = settings?.tagline || "(Under The Orissa Sai Charitable Trust)";
    const address = settings?.address || "229, Saheed Nagar, Bhubaneswar - 751007";
    const phoneStr = settings?.phone || "0674-2543234, 9090001234, 9438601111, 7381081008, 7978224626";
    const emailStr = settings?.email || "saikutira30@gmail.com";
    const initial = hostelName.charAt(0).toUpperCase();

    return (
      <div
        ref={ref}
        className="bg-[#ffffff] text-[#000000] p-0 w-[794px] h-[1123px] relative mx-auto box-border"
      >
        <div className="relative overflow-hidden w-full h-full p-3">

          {/* Double Border Wrapper */}
          <div className="absolute inset-3 border-[3px] border-[#1e3a8a] p-0.5">
            <div className="border border-[#1e3a8a] w-full h-full"></div>
          </div>

          <div className="relative z-10 px-8 py-4 h-full flex flex-col">

            {/* ── Header ── */}
            <div className="text-center mb-3 flex flex-col items-center pt-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-[#b91c1c] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-[#1e3a8a]">
                  {initial}
                </div>
                <h1 className="text-3xl font-extrabold text-[#b91c1c] uppercase tracking-wider">
                  {hostelName}
                </h1>
              </div>
              <p className="text-xs font-bold italic text-slate-800">{tagline}</p>
              <p className="text-xs text-slate-700 mt-0.5">{address}</p>
              <p className="text-xs text-slate-700 font-semibold">
                Phone : {phoneStr}
              </p>
              <p className="text-xs text-slate-700">E-mail : {emailStr}</p>
            </div>

            {/* Divider */}
            <div className="border-b-[3px] border-[#1e3a8a] mb-0.5"></div>
            <div className="border-b border-[#1e3a8a] mb-4"></div>

            {/* ── Invoice Title ── */}
            <div className="mb-4">
              <h2 className="text-2xl font-black text-[#1e3a8a] uppercase tracking-widest mb-0.5">INVOICE</h2>
              <p className="text-sm font-semibold text-slate-900">
                Invoice No: <span className="font-normal text-slate-600">{formattedReceiptNo}</span>
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Date Issued: <span className="font-normal text-slate-600">{receiptDate}</span>
              </p>
            </div>

            {/* ── Billed To ── */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billed To</h3>
                <h4 className="text-xl font-bold text-slate-900 uppercase">{residentName}</h4>
                <p className="text-sm text-slate-700 mt-0.5 font-medium">
                  {roomInfo}<br />
                  Phone: +91 {residentPhone}
                </p>
              </div>
              <div className="text-right bg-[#f8fafc] px-4 py-3 rounded-xl border border-[#1e3a8a]/20">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Billing Month</h3>
                <p className="text-lg font-bold text-[#1e3a8a]">{billingMonthStr}</p>
              </div>
            </div>

            {/* ── Items Table ── */}
            <table className="w-full text-left border-collapse mb-5 border border-[#1e3a8a]/30">
              <thead>
                <tr className="border-b-2 border-[#1e3a8a] bg-[#f8fafc]">
                  <th className="py-2 px-4 text-xs font-bold text-[#1e3a8a] uppercase tracking-wider">Description</th>
                  <th className="py-2 px-4 text-xs font-bold text-[#1e3a8a] uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a8a]/20">

                {rentAmount > 0 && (
                  <tr>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 uppercase">Monthly Rent</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{rentAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}

                {electricityAmount > 0 && (
                  <tr>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 uppercase">Room Utility Bill</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{electricityAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}


                
                {fineAmount > 0 && (
                  <tr>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 uppercase">Fines</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{fineAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}

              </tbody>
            </table>

            {/* ── Totals ── */}
            <div className="flex justify-end">
              <div className="w-1/2 border border-[#1e3a8a]/30 p-3.5 bg-[#f8fafc]">
                <div className="flex justify-between py-1.5 text-sm text-slate-700 font-medium border-b border-[#1e3a8a]/20">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm text-slate-700 font-medium border-b border-[#1e3a8a]/30">
                  <span>Late Fees / Fines</span>
                  <span className="font-bold text-slate-900">₹0</span>
                </div>
                <div className="flex justify-between pt-3 pb-1">
                  <span className="text-lg font-bold text-[#1e3a8a] uppercase tracking-wide">Total Due</span>
                  <span className="text-2xl font-black text-[#b91c1c]">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* ── Footer — always pinned to bottom ── */}
            <div className="mt-auto pt-5 flex justify-between items-end border-t border-[#1e3a8a]/20">
              <div className="flex-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Payment Instructions
                </h4>
                <p className="text-xs text-slate-600 max-w-md leading-relaxed italic font-medium">
                  Please make the payment by the due date to avoid late fees. Payments can be
                  made via UPI or bank transfer to the hostel accounts department. Include your
                  Room Number in the payment reference.
                </p>
              </div>
              <div className="text-center w-44 ml-8 flex-shrink-0">
                <div className="border-b border-[#1e3a8a] h-10 mb-2"></div>
                <p className="text-xs font-bold text-[#1e3a8a] uppercase">Authorized Signatory</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
