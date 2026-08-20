import React, { useState, useEffect } from 'react';
import { pb } from '../api/client';
import { Calendar, Users, Utensils, Plus, Trash2, X, Activity } from 'lucide-react';
import type { Resident } from '../types';
import ResidentCalendar from '../components/kitchen/ResidentCalendar';

export default function Kitchen() {
  const [viewMode, setViewMode] = useState<'daily' | 'resident'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [optOuts, setOptOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalResidentId, setModalResidentId] = useState('');
  const [modalMealType, setModalMealType] = useState('lunch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const residentsList = await pb.collection('residents').getFullList<Resident>({
        filter: `status = "active"`,
        sort: 'fullName'
      });
      setResidents(residentsList);
      if (residentsList.length > 0 && !modalResidentId) {
        setModalResidentId(residentsList[0].id);
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const records = await pb.collection('meal_opt_outs').getFullList({
        filter: `date >= "${startOfDay.toISOString().replace('T', ' ')}" && date <= "${endOfDay.toISOString().replace('T', ' ')}"`,
        expand: 'resident'
      });
      setOptOuts(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOptOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalResidentId) return;

    setIsSubmitting(true);
    try {
      const targetDate = new Date(selectedDate);
      targetDate.setUTCHours(12, 0, 0, 0);

      const mealsToAdd = modalMealType === 'both' ? ['lunch', 'dinner'] : [modalMealType];

      for (const meal of mealsToAdd) {
        const exists = optOuts.find(o => o.resident === modalResidentId && o.mealType === meal);
        if (!exists) {
          await pb.collection('meal_opt_outs').create({
            resident: modalResidentId,
            date: targetDate.toISOString(),
            mealType: meal
          });
        }
      }

      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert('Error adding opt-out: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOptOut = async (id: string) => {
    if (!confirm('Are you sure you want to remove this opt-out?')) return;
    try {
      await pb.collection('meal_opt_outs').delete(id);
      fetchData();
    } catch (err: any) {
      alert('Error removing opt-out: ' + err.message);
    }
  };

  const lunchOptOuts = optOuts.filter(o => o.mealType === 'lunch');
  const dinnerOptOuts = optOuts.filter(o => o.mealType === 'dinner');
  const totalResidentsCount = residents.length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary-500" />
            Kitchen Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage daily headcounts and view resident meal history.</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'daily' 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Daily Overview
          </button>
          <button
            onClick={() => setViewMode('resident')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'resident' 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Resident History
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Record Opt-Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lunch Card */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden">
               <h3 className="text-lg font-semibold text-slate-200 mb-1">Expected Lunch Headcount</h3>
               <p className="text-sm text-slate-400 mb-6">Total Active Residents - Opt Outs</p>
               
               <div className="flex items-end gap-3">
                 <span className="text-5xl font-bold text-primary-400">{totalResidentsCount - lunchOptOuts.length}</span>
                 <span className="text-xl font-medium text-slate-500 mb-1">/ {totalResidentsCount}</span>
               </div>

               <div className="mt-6 pt-6 border-t border-slate-700/50">
                 <h4 className="text-sm font-medium text-slate-300 mb-3 flex justify-between">
                    <span>Lunch Opt-Outs</span>
                    <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full text-xs">{lunchOptOuts.length} Residents</span>
                 </h4>
                 {lunchOptOuts.length > 0 ? (
                   <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                     {lunchOptOuts.map(opt => (
                       <li key={opt.id} className="text-sm text-slate-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-slate-600 transition-colors">
                          <div className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              {opt.expand?.resident?.fullName || 'Unknown'}
                          </div>
                          <button 
                            onClick={() => handleDeleteOptOut(opt.id)}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Remove Opt-Out"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-slate-500 italic">No opt-outs for lunch today.</p>
                 )}
               </div>
            </div>

            {/* Dinner Card */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden">
               <h3 className="text-lg font-semibold text-slate-200 mb-1">Expected Dinner Headcount</h3>
               <p className="text-sm text-slate-400 mb-6">Total Active Residents - Opt Outs</p>
               
               <div className="flex items-end gap-3">
                 <span className="text-5xl font-bold text-primary-400">{totalResidentsCount - dinnerOptOuts.length}</span>
                 <span className="text-xl font-medium text-slate-500 mb-1">/ {totalResidentsCount}</span>
               </div>

               <div className="mt-6 pt-6 border-t border-slate-700/50">
                 <h4 className="text-sm font-medium text-slate-300 mb-3 flex justify-between">
                    <span>Dinner Opt-Outs</span>
                    <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full text-xs">{dinnerOptOuts.length} Residents</span>
                 </h4>
                 {dinnerOptOuts.length > 0 ? (
                   <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                     {dinnerOptOuts.map(opt => (
                       <li key={opt.id} className="text-sm text-slate-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-slate-600 transition-colors">
                          <div className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              {opt.expand?.resident?.fullName || 'Unknown'}
                          </div>
                          <button 
                            onClick={() => handleDeleteOptOut(opt.id)}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Remove Opt-Out"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-slate-500 italic">No opt-outs for dinner today.</p>
                 )}
               </div>
            </div>
          </div>
        </>
      ) : (
        <ResidentCalendar residents={residents} />
      )}

      {/* Add Opt-Out Modal */}
      {isAddModalOpen && viewMode === 'daily' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-100">Record Manual Opt-Out</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddOptOut} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Resident</label>
                <select
                  required
                  value={modalResidentId}
                  onChange={e => setModalResidentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">To change date, close modal and change dashboard date.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Meal Type</label>
                <select
                  required
                  value={modalMealType}
                  onChange={e => setModalMealType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="lunch">Lunch Only</option>
                  <option value="dinner">Dinner Only</option>
                  <option value="both">Both Meals</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Opt-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
