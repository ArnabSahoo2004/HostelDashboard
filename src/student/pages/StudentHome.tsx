import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuth } from '../useStudentAuth';
import pb from '../../api/client';
import {
  CreditCard,
  ClipboardList,
  Wrench,
  QrCode,
  FileCheck2,
  Clock,
  ChevronRight,
  Users,
  CheckCircle2,
  Bell,
  PhoneCall,
  ShieldCheck,
  Fingerprint,
  Layers,
  Wind,
  Bath,
  History,
  X,
  DoorOpen
} from 'lucide-react';

export const StudentHome: React.FC = () => {
  const { student } = useStudentAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [activeNotices, setActiveNotices] = useState<any[]>([]);
  const [entryLogs, setEntryLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const booking = student?.expand?.bookings_via_resident?.[0];
  const room = booking?.expand?.bed?.expand?.room;
  const bed = booking?.expand?.bed;

  // Format Floor nicely (e.g. 1 -> 1st Floor)
  const formatFloor = (floor?: number | string) => {
    if (floor === undefined || floor === null || floor === '') return 'Ground Floor';
    const num = Number(floor);
    if (isNaN(num) || num === 0) return 'Ground Floor';
    if (num === 1) return '1st Floor';
    if (num === 2) return '2nd Floor';
    if (num === 3) return '3rd Floor';
    return `Floor ${num}`;
  };

  // Format Room Type nicely (e.g. 'ac' -> 'Air Conditioned (AC)')
  const formatRoomType = (type?: string, isAc?: boolean) => {
    if (!type && !isAc) return 'Standard Room';
    const lower = (type || '').toLowerCase().trim();
    if (lower === 'ac' || isAc) return 'Air Conditioned (AC)';
    if (lower === 'non-ac' || lower === 'non_ac') return 'Non-AC Room';
    if (lower === 'single') return 'Single Occupancy';
    if (lower === 'double') return 'Double Sharing';
    if (lower === 'triple') return 'Triple Sharing';
    if (lower === 'quad' || lower === 'four') return '4-Bed Dormitory';
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Standard Room';
  };

  useEffect(() => {
    const loadHomeData = async () => {
      if (!student) return;
      try {
        // 1. Fetch payments for this resident
        const pmts = await pb.collection('payments').getFullList({
          filter: `resident = "${student.id}"`,
          sort: '-created'
        });
        setPayments(pmts);

        // 2. Fetch biometric gate entry logs for this resident
        try {
          const logs = await pb.collection('entry_logs').getFullList({
            filter: `resident = "${student.id}"`,
            sort: '-timestamp,-created',
            limit: 10
          });
          setEntryLogs(logs);
        } catch {
          // Non-blocking if table is empty
        }

        // 3. Fetch roommates in the same room
        if (room?.id) {
          const roomBeds = await pb.collection('beds').getFullList({
            filter: `room = "${room.id}"`,
            expand: 'bookings_via_bed,bookings_via_bed.resident'
          });

          const mates: any[] = [];
          roomBeds.forEach((b: any) => {
            const bks = b.expand?.bookings_via_bed || [];
            bks.forEach((bk: any) => {
              if (bk.resident && bk.resident !== student.id && bk.expand?.resident?.status === 'active') {
                mates.push({
                  name: bk.expand.resident.fullName,
                  bed: b.bedLabel,
                  phone: bk.expand.resident.phone
                });
              }
            });
          });
          setRoommates(mates);
        }

        // 4. Fetch announcements / notices
        const notices = await pb.collection('home_notices').getFullList({
          sort: '-created'
        });
        setActiveNotices(notices.slice(0, 3));
      } catch (err) {
        console.warn('Error loading student dashboard details:', err);
      }
    };

    loadHomeData();
  }, [student, room?.id]);

  // Compute pending dues
  const pendingPayment = payments.find((p) => p.status === 'pending' || p.status === 'overdue');
  const totalDue = pendingPayment ? pendingPayment.amount : 0;

  // Latest gate attendance punch
  const latestPunch = entryLogs[0];
  const isInside = latestPunch ? latestPunch.type?.toLowerCase() === 'entry' || latestPunch.type?.toLowerCase() === 'in' : true;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Responsive Grid: Multi-column on Laptop/Desktop, Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ========================================================
            LEFT COLUMN (2 COLS ON DESKTOP)
           ======================================================== */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Hero Resident Card (Polished Hospitality Design) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs relative overflow-hidden transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2.5 border border-emerald-200/60 dark:border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Resident</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {student?.fullName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Admission Ref: #{student?.id?.slice(-6).toUpperCase()} • {student?.phone}
                </p>
              </div>

              {/* Room Highlight Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 text-left sm:text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  Allocated Room
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {room ? `Room ${room.roomNumber}` : 'Unassigned'}
                </span>
                {bed && (
                  <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Bed: <strong className="font-black text-slate-900 dark:text-white">{bed.bedLabel}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Room Amenities Pills (Polished tags with icons & proper formatting) */}
            {room && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                {/* Floor Pill */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatFloor(room.floor)}</span>
                </span>

                {/* AC / Room Type Pill (Proper casing: 'Air Conditioned (AC)' instead of 'ac') */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-500/20">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                  <span>{formatRoomType(room.roomType, room.ac)}</span>
                </span>

                {/* Attached Bathroom Pill */}
                {room.attachedBathroom && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-500/20">
                    <Bath className="w-3.5 h-3.5 text-teal-500" />
                    <span>Attached Washroom</span>
                  </span>
                )}

                {/* Capacity Sharing Pill */}
                {room.capacity && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/60 dark:border-purple-500/20">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    <span>{room.capacity}-Bed Room</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ========================================================
              BIOMETRIC FINGERPRINT GATE ATTENDANCE CARD
             ======================================================== */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isInside
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                }`}
              >
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Gate Biometric Attendance
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isInside
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isInside ? '● INSIDE HOSTEL' : '○ CURRENTLY OUTSIDE'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                  {latestPunch ? (
                    <>
                      Last {latestPunch.type}:{' '}
                      <span className="text-slate-500 dark:text-slate-400 font-normal">
                        {new Date(latestPunch.timestamp || latestPunch.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        ({latestPunch.method || 'Fingerprint'} Sensor)
                      </span>
                    </>
                  ) : (
                    'Biometric fingerprint profile active at main gate'
                  )}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isInside
                    ? 'Your fingerprint opens the gate lock automatically during active hours.'
                    : '⚠️ Return before night gate curfew at 9:00 PM.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLogsModal(true)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 self-start sm:self-center border border-slate-200 dark:border-slate-700"
            >
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Punch Logs</span>
            </button>
          </div>

          {/* Dues Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  totalDue > 0
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20'
                }`}
              >
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Monthly Dues Status
                </span>
                {totalDue > 0 ? (
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      ₹{totalDue.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Payment Pending
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Dues Cleared!</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              to="/student/dues"
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs self-start sm:self-center"
            >
              <span>{totalDue > 0 ? 'Pay via UPI' : 'View Invoices'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Actions Responsive Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-2.5">
              Quick Resident Services
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/student/services?tab=leave"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Leave Pass
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Night out / Home</span>
                </div>
              </Link>

              <Link
                to="/student/services?tab=maintenance"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Report Issue
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Room repairs</span>
                </div>
              </Link>

              <Link
                to="/student/id"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Digital ID Pass
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Gate QR backup</span>
                </div>
              </Link>

              <Link
                to="/student/id#agreement"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Agreement
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tenancy terms</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Notice Board Banner */}
          {activeNotices.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hostel Notice Board
                </h3>
              </div>
              <div className="space-y-2">
                {activeNotices.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {n.destination || 'Hostel Announcement'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Notice Date: {new Date(n.departureDate || n.created).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT COLUMN (SIDEBAR CARDS ON DESKTOP)
           ======================================================== */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Gate Biometric Card with Sensor Indicator */}
          <div className="rounded-3xl bg-slate-900 text-white p-5 border border-slate-800 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Gate Sensor Status
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DEVICE ONLINE
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Fingerprint Punch In/Out</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Place finger on biometric scanner to unlock gate
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Curfew: Return by <strong>9:00 PM</strong></span>
                </div>
              </div>

              <button
                onClick={() => setShowLogsModal(true)}
                className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors shrink-0"
                title="View Biometric Log"
              >
                <History className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Roommates Card */}
          {roommates.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Roommates in Room {room?.roomNumber}
                </h3>
              </div>
              <div className="space-y-2">
                {roommates.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-slate-700 font-bold flex items-center justify-center text-xs">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Bed {m.bed}</span>
                      </div>
                    </div>
                    <a
                      href={`tel:${m.phone}`}
                      className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {m.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hostel Rules & Hours Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xs transition-colors">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Hostel Hours & Schedule</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Night Gate Closing
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400">9:00 PM Sharp</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Breakfast Mess
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">7:30 - 9:30 AM</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Lunch Mess
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">1:00 - 2:30 PM</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Dinner Mess
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">8:00 - 9:30 PM</span>
              </div>
            </div>
          </div>

          {/* Warden Helpline Box */}
          <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                Warden Help Desk
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">+91 78488 01864</span>
            </div>
            <a
              href="tel:+917848801864"
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>

        </div>
      </div>

      {/* ==========================================================
          MODAL: STUDENT BIOMETRIC FINGERPRINT LOGS MODAL
         ========================================================== */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLogsModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gate Biometric Logs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fingerprint sensor in/out punch history
                </p>
              </div>
            </div>

            {entryLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent gate punch logs found for your profile.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {entryLogs.map((log) => {
                  const isEntry = log.type?.toLowerCase() === 'entry' || log.type?.toLowerCase() === 'in';
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[10px] ${
                            isEntry
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isEntry ? 'IN' : 'OUT'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {log.type}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Verified via: {log.method || 'Fingerprint Sensor'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          {new Date(log.timestamp || log.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp || log.created).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Biometric gate opens 6:00 AM – 9:00 PM daily.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
