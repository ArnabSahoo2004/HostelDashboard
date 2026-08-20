import { forwardRef } from 'react';
import type { Payment } from '../../types';
import { fmtDate, fmtMonth } from '../../utils/generateInvoice';

interface ReceiptTemplateProps {
  payment: Payment | null;
  allPayments?: Payment[];
  receiptNumber: number;
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ payment, allPayments = [], receiptNumber }, ref) => {
    if (!payment) return null;

    const residentId = payment.expand?.resident?.id;
    const monthFor = payment.monthFor;

    // Find all related bills for this resident for this month
    const relatedPayments = allPayments.filter(
      p => p.expand?.resident?.id === residentId && p.monthFor === monthFor
    );

    const rentPayment = relatedPayments.find(p => !p.paymentType || p.paymentType === 'rent');
    const electricityPayment = relatedPayments.find(p => p.paymentType === 'electricity');
    const foodPayment = relatedPayments.find(p => p.paymentType === 'food');

    const bookingBed = payment.expand?.booking?.expand?.bed;
    const roomInfo = bookingBed 
      ? `Room ${bookingBed.room.roomNumber} (${bookingBed.bedLabel})` 
      : 'No active assignment';

    const residentName = payment.expand?.resident?.fullName || 'Resident';
    const residentPhone = payment.expand?.resident?.phone || 'N/A';
    
    const receiptDate = fmtDate(payment.paidDate || new Date().toISOString());
    const billingMonthStr = fmtMonth(monthFor);
    const formattedReceiptNo = `INV-${new Date().getFullYear()}-${String(receiptNumber).padStart(4, '0')}`;

    const rentAmount = rentPayment ? Number(rentPayment.amount) : 0;
    const electricityAmount = electricityPayment ? Number(electricityPayment.amount) : 0;
    const foodAmount = foodPayment ? Number(foodPayment.amount) : 0;
    
    const totalAmount = rentAmount + electricityAmount + foodAmount;

    return (
      <div 
        ref={ref}
        className="bg-[#ffffff] text-[#000000] p-0 w-[794px] h-[1123px] relative mx-auto box-border" 
      >
        <div className="relative overflow-hidden w-full h-full p-4">
            
            {/* Double Border Wrapper */}
            <div className="absolute inset-4 border-[3px] border-[#1e3a8a] p-1">
                <div className="border border-[#1e3a8a] w-full h-full"></div>
            </div>

            <div className="relative z-10 px-8 py-6 h-full flex flex-col">
                {/* Header */}
                <div className="text-center mb-8 flex flex-col items-center pt-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-[#b91c1c] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md border-2 border-[#1e3a8a]">
                            S
                        </div>
                        <h1 className="text-4xl font-extrabold text-[#b91c1c] uppercase tracking-wider">Satabdi Girls' Hostel</h1>
                    </div>
                    <p className="text-sm font-bold italic text-slate-800">
                        (Under The Orissa Sai Charitable Trust)
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                        229, Saheed Nagar, Bhubaneswar - 751007
                    </p>
                    <p className="text-sm text-slate-700 font-semibold">
                        Phone : 0674-2543234, 9090001234, 9438601111, 7381081008, 7978224626
                    </p>
                    <p className="text-sm text-slate-700">
                        E-mail : saikutira30@gmail.com
                    </p>
                </div>

                {/* Divider */}
                <div className="border-b-[3px] border-[#1e3a8a] mb-1"></div>
                <div className="border-b border-[#1e3a8a] mb-8"></div>

                {/* Invoice Title */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-[#1e3a8a] uppercase tracking-widest mb-1">INVOICE</h2>
                        <p className="text-sm font-semibold text-slate-900">Invoice No: <span className="font-normal text-slate-600">{formattedReceiptNo}</span></p>
                        <p className="text-sm font-semibold text-slate-900">Date Issued: <span className="font-normal text-slate-600">{receiptDate}</span></p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed To</h3>
                        <h4 className="text-xl font-bold text-slate-900 uppercase">{residentName}</h4>
                        <p className="text-sm text-slate-700 mt-1 font-medium">
                            {roomInfo}<br/>
                            Phone: +91 {residentPhone}
                        </p>
                    </div>
                    <div className="text-right bg-[#f8fafc] p-4 rounded-xl border border-[#1e3a8a]/20">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Month</h3>
                        <p className="text-lg font-bold text-[#1e3a8a]">{billingMonthStr}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse mb-8 border border-[#1e3a8a]/30">
                    <thead>
                        <tr className="border-b-2 border-[#1e3a8a] bg-[#f8fafc]">
                            <th className="py-3 px-4 text-xs font-bold text-[#1e3a8a] uppercase tracking-wider">Description</th>
                            <th className="py-3 px-4 text-xs font-bold text-[#1e3a8a] uppercase tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e3a8a]/20">
                        
                        {rentPayment && (
                            <tr>
                                <td className="py-5 px-4">
                                    <p className="font-bold text-slate-900 uppercase">Monthly Rent</p>
                                </td>
                                <td className="py-5 px-4 text-right font-bold text-slate-900">
                                    ₹{rentAmount.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        )}

                        {electricityPayment && (
                            <tr>
                                <td className="py-5 px-4">
                                    <p className="font-bold text-slate-900 uppercase">Room Utility Bill</p>
                                </td>
                                <td className="py-5 px-4 text-right font-bold text-slate-900">
                                    ₹{electricityAmount.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        )}

                        {foodPayment && (
                            <tr>
                                <td className="py-5 px-4">
                                    <p className="font-bold text-slate-900 uppercase">Mess & Food Bill</p>
                                </td>
                                <td className="py-5 px-4 text-right font-bold text-slate-900">
                                    ₹{foodAmount.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 border border-[#1e3a8a]/30 p-4 bg-[#f8fafc]">
                        <div className="flex justify-between py-2 text-sm text-slate-700 font-medium border-b border-[#1e3a8a]/20">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm text-slate-700 font-medium border-b border-[#1e3a8a]/30">
                            <span>Late Fees / Fines</span>
                            <span className="font-bold text-slate-900">₹0</span>
                        </div>
                        <div className="flex justify-between pt-4 pb-2">
                            <span className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wide">Total Due</span>
                            <span className="text-2xl font-black text-[#b91c1c]">₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-auto pt-8 flex justify-between items-end mb-4">
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Instructions</h4>
                        <p className="text-xs text-slate-600 max-w-md leading-relaxed italic font-medium">
                            Please make the payment by the due date to avoid late fees. Payments can be made via UPI or bank transfer to the hostel accounts department. Include your Room Number in the payment reference.
                        </p>
                    </div>
                    <div className="text-center w-48 ml-8">
                        <div className="border-b border-[#1e3a8a] h-12 mb-2"></div>
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
