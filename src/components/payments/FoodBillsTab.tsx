import { useState, useEffect } from 'react';
import pb from '../../api/client';
import type { Resident } from '../../types';
import { 
  Utensils, 
  AlertTriangle,
  IndianRupee,
  CheckCircle,
  Receipt
} from 'lucide-react';

const LUNCH_PRICE = 90;
const DINNER_PRICE = 80;

interface ResidentBill {
  resident: Resident;
  lunchOptOuts: number;
  dinnerOptOuts: number;
  totalDays: number;
  expectedCost: number;
  deduction: number;
  finalAmount: number;
  existingPayment?: any;
}

export default function FoodBillsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().substring(0, 7));
  const [residentBills, setResidentBills] = useState<ResidentBill[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch active residents
      const residentsData = await pb.collection('residents').getFullList({ 
        filter: 'status = "active"',
        expand: 'room'
      });

      // 2. Fetch opt-outs for the month
      const [year, month] = billingMonth.split('-').map(Number);
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      
      const optOutsData = await pb.collection('meal_opt_outs').getFullList({
        filter: `date >= "${startDate.toISOString().replace('T', ' ')}" && date <= "${endDate.toISOString().replace('T', ' ')}"`
      });

      // 3. Fetch existing food payments for this month
      const existingPayments = await pb.collection('payments').getFullList({
        filter: `paymentType = "food" && monthFor >= "${startDate.toISOString().replace('T', ' ')}" && monthFor <= "${endDate.toISOString().replace('T', ' ')}"`
      });

      const totalDays = new Date(year, month, 0).getDate();
      const expectedCost = totalDays * (LUNCH_PRICE + DINNER_PRICE);

      const bills: ResidentBill[] = residentsData.map((res: any) => {
        const resOptOuts = optOutsData.filter(o => o.resident === res.id);
        const lunchOptOuts = resOptOuts.filter(o => o.mealType === 'lunch').length;
        const dinnerOptOuts = resOptOuts.filter(o => o.mealType === 'dinner').length;
        const deduction = (lunchOptOuts * LUNCH_PRICE) + (dinnerOptOuts * DINNER_PRICE);
        const finalAmount = expectedCost - deduction;
        const existingPayment = existingPayments.find(p => p.resident === res.id);

        return {
          resident: res,
          lunchOptOuts,
          dinnerOptOuts,
          totalDays,
          expectedCost,
          deduction,
          finalAmount,
          existingPayment
        };
      });

      setResidentBills(bills);
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
  }, [billingMonth]);

  const handleGenerateBill = async (bill: ResidentBill) => {
    setGeneratingFor(bill.resident.id);
    try {
      const [year, month] = billingMonth.split('-').map(Number);
      // Set due date to the 5th of the NEXT month
      const dueDate = new Date(Date.UTC(year, month, 5)).toISOString();
      const monthFor = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      
      await pb.collection('payments').create({
        resident: bill.resident.id,
        amount: bill.finalAmount,
        monthFor: monthFor,
        dueDate: dueDate,
        status: 'pending',
        paymentType: 'food'
      });
      
      fetchData();
    } catch (err: any) {
      alert('Failed to generate bill: ' + (err.message || 'Unknown error'));
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-200">Mess & Food Bills</h3>
          <p className="text-sm text-slate-400">Calculate monthly food bills dynamically based on kitchen opt-outs.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/40 p-2 border border-slate-800 rounded-xl">
          <label className="text-sm font-semibold text-slate-400 pl-2">Billing Month:</label>
          <input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Resident</th>
                <th className="px-6 py-4 font-semibold">Expected Meals</th>
                <th className="px-6 py-4 font-semibold">Opt-Outs (Deduction)</th>
                <th className="px-6 py-4 font-semibold">Final Bill</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {residentBills.map((bill) => (
                <tr key={bill.resident.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200">{bill.resident.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {bill.resident.expand?.room?.hostel} - Room {bill.resident.expand?.room?.roomNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300">
                      {bill.totalDays} Days
                    </div>
                    <div className="text-xs text-slate-500">
                      ₹{bill.expectedCost.toLocaleString('en-IN')} Gross
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <span className="bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{bill.lunchOptOuts} L</span>
                      <span className="bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{bill.dinnerOptOuts} D</span>
                    </div>
                    <div className="text-xs text-rose-500 font-medium">
                      - ₹{bill.deduction.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-emerald-400 text-lg flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {bill.finalAmount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {bill.existingPayment ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-emerald-400 font-medium text-xs">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Generated
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateBill(bill)}
                        disabled={generatingFor === bill.resident.id}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {generatingFor === bill.resident.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Receipt className="w-3.5 h-3.5" />
                        )}
                        Generate Bill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {residentBills.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Utensils className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    <p>No active residents found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
