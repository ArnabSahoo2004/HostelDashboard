import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStudentAuth } from '../useStudentAuth';
import pb from '../../api/client';
import {
  ClipboardList,
  Wrench,
  Clock,
  Plus,
  CheckCircle2,
  X,
  MapPin
} from 'lucide-react';

export const StudentServices: React.FC = () => {
  const { student } = useStudentAuth();
  const [searchParams] = useSearchParams();

  // Tab State: 'leave' | 'maintenance'
  const initialTab = searchParams.get('tab') === 'maintenance' ? 'maintenance' : 'leave';
  const [activeTab, setActiveTab] = useState<'leave' | 'maintenance'>(initialTab);

  // Leave Notices State
  const [leaveNotices, setLeaveNotices] = useState<any[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [destination, setDestination] = useState('');
  const [contactDuringLeave, setContactDuringLeave] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Maintenance Requests State
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState('Electrical');
  const [issueDescription, setIssueDescription] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const booking = student?.expand?.bookings_via_resident?.[0];
  const room = booking?.expand?.bed?.expand?.room;

  // Load user's leave requests & maintenance requests
  const fetchData = async () => {
    if (!student) return;
    try {
      // 1. Fetch leave requests
      const leaves = await pb.collection('home_notices').getFullList({
        filter: `resident = "${student.id}"`,
        sort: '-created'
      });
      setLeaveNotices(leaves);

      // 2. Fetch room maintenance requests
      if (room?.id) {
        const issues = await pb.collection('maintenance_requests').getFullList({
          filter: `roomId = "${room.id}"`,
          sort: '-created'
        });
        setMaintenanceList(issues);
      }
    } catch (err) {
      console.warn('Error fetching student services data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [student, room?.id]);

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    try {
      setLeaveLoading(true);
      await pb.collection('home_notices').create({
        resident: student.id,
        departureDate: departureDate ? new Date(departureDate).toISOString() : new Date().toISOString(),
        returnDate: returnDate ? new Date(returnDate).toISOString() : new Date().toISOString(),
        destination: destination.trim(),
        contactDuringLeave: contactDuringLeave.trim() || student.emergencyContactPhone || student.phone,
        status: 'pending'
      });

      setShowLeaveModal(false);
      setDepartureDate('');
      setReturnDate('');
      setDestination('');
      setContactDuringLeave('');
      setFeedbackMsg('Leave request submitted! Awaiting warden approval.');
      setTimeout(() => setFeedbackMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      alert('Failed to submit leave request: ' + err.message);
    } finally {
      setLeaveLoading(false);
    }
  };

  // Submit Maintenance Request
  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !room) {
      alert('No room assigned. Please contact the hostel admin.');
      return;
    }

    try {
      setMaintenanceLoading(true);
      await pb.collection('maintenance_requests').create({
        roomId: room.id,
        description: `[${issueCategory}] ${issueDescription.trim()} (Reported by: ${student.fullName})`,
        status: 'pending',
        reportedDate: new Date().toISOString()
      });

      setShowMaintenanceModal(false);
      setIssueDescription('');
      setFeedbackMsg('Maintenance issue reported! Technician assigned.');
      setTimeout(() => setFeedbackMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      alert('Failed to report issue: ' + err.message);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Hostel Services & Requests
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Apply for night-out leave passes and report room maintenance issues
        </p>
      </div>

      {/* Pill Segmented Tabs */}
      <div className="flex p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'leave'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Leave Passes ({leaveNotices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Room Repairs ({maintenanceList.length})</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in max-w-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ========================================================
          TAB 1: LEAVE & OUTING PASSES
         ======================================================== */}
      {activeTab === 'leave' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              My Outing & Leave Records
            </span>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {leaveNotices.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center shadow-xs transition-colors">
              <ClipboardList className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Leave Requests</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Going home or taking a night out? Submit your permission request here.
              </p>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                + New Leave Request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {leaveNotices.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{l.destination || 'Home Visit'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Emergency Contact: {l.contactDuringLeave || 'On file'}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        l.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : l.status === 'rejected'
                          ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      {l.status === 'approved'
                        ? 'Approved'
                        : l.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending Warden'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      From: {new Date(l.departureDate).toLocaleDateString()}
                    </span>
                    <span>Return: {new Date(l.returnDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: ROOM REPAIRS & MAINTENANCE
         ======================================================== */}
      {activeTab === 'maintenance' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Room Maintenance Issues
            </span>
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Report Issue</span>
            </button>
          </div>

          {maintenanceList.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center shadow-xs transition-colors">
              <Wrench className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Pending Issues</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Everything in Room {room?.roomNumber || 'your room'} is functioning properly.
              </p>
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                + Report Room Issue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {maintenanceList.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                        {m.description}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Reported on: {new Date(m.reportedDate || m.created).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        m.status === 'resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : m.status === 'in_progress'
                          ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                          : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      {m.status === 'resolved'
                        ? 'Resolved'
                        : m.status === 'in_progress'
                        ? 'In Progress'
                        : 'Reported'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================================
          MODAL: APPLY LEAVE NOTICE
         ========================================================== */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Apply for Outing / Leave</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Submit your dates for warden confirmation
            </p>

            <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Departure Date *
                </label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Return Date *
                </label>
                <input
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Destination / Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home visit / College exam"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Contact Phone During Leave
                </label>
                <input
                  type="tel"
                  placeholder="Parent / alternative phone"
                  value={contactDuringLeave}
                  onChange={(e) => setContactDuringLeave(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={leaveLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {leaveLoading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: REPORT ROOM MAINTENANCE
         ========================================================== */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowMaintenanceModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Report Room Issue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Room {room ? room.roomNumber : 'Repair'} Maintenance
            </p>

            <form onSubmit={handleSubmitMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Category *
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Electrical">Electrical (Fan / Light / Plug)</option>
                  <option value="Plumbing">Plumbing (Tap / Washroom / Geyser)</option>
                  <option value="Air Conditioning">Air Conditioning (AC)</option>
                  <option value="Carpentry">Carpentry (Bed / Almirah / Door)</option>
                  <option value="Cleaning">Cleaning & Pest Control</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Describe Problem *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Fan is making noise / washroom tap leaking"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={maintenanceLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {maintenanceLoading ? 'Reporting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentServices;
