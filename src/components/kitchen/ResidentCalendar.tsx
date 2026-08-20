import { useState, useEffect } from 'react';
import { pb } from '../../api/client';
import type { Resident } from '../../types';
import { Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';

interface ResidentCalendarProps {
  residents: Resident[];
}

export default function ResidentCalendar({ residents }: ResidentCalendarProps) {
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [optOuts, setOptOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (residents.length > 0 && !selectedResidentId) {
      setSelectedResidentId(residents[0].id);
    }
  }, [residents]);

  useEffect(() => {
    if (selectedResidentId && selectedMonth) {
      fetchHistory();
    }
  }, [selectedResidentId, selectedMonth]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const records = await pb.collection('meal_opt_outs').getFullList({
        filter: `resident = "${selectedResidentId}" && date >= "${startOfMonth.toISOString().replace('T', ' ')}" && date <= "${endOfMonth.toISOString().replace('T', ' ')}"`,
      });
      setOptOuts(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const numDays = new Date(year, month, 0).getDate();
    return Array.from({ length: numDays }, (_, i) => i + 1);
  };

  const days = getDaysInMonth();
  const [year, month] = selectedMonth.split('-').map(Number);

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedResidentId}
            onChange={(e) => setSelectedResidentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none min-w-[200px]"
          >
            <option value="" disabled>Select Resident</option>
            {residents.map(r => (
              <option key={r.id} value={r.id}>{r.fullName}</option>
            ))}
          </select>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none [color-scheme:dark]"
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-medium bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
           <div className="flex items-center gap-1.5 text-slate-300">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
             <span>Ate</span>
           </div>
           <div className="flex items-center gap-1.5 text-slate-300">
             <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
             <span>Opted Out</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {days.map(day => {
            const dateStr = new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
            
            // Check opt outs for this specific day
            // Note: DB dates are around noon UTC (12:00) so they easily match the day prefix
            const dayOptOuts = optOuts.filter(o => o.date.startsWith(dateStr));
            
            const skippedLunch = dayOptOuts.some(o => o.mealType === 'lunch');
            const skippedDinner = dayOptOuts.some(o => o.mealType === 'dinner');

            return (
              <div key={day} className="bg-slate-900/60 rounded-xl border border-slate-700/50 p-3 hover:border-slate-600 transition-colors flex flex-col items-center">
                <span className="text-sm font-bold text-slate-400 mb-3">{day}</span>
                <div className="flex gap-3 w-full justify-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">L</span>
                    {skippedLunch ? (
                      <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" title="Opted out of Lunch"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" title="Ate Lunch"></div>
                    )}
                  </div>
                  <div className="w-px h-8 bg-slate-700/50"></div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">D</span>
                    {skippedDinner ? (
                      <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" title="Opted out of Dinner"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" title="Ate Dinner"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
