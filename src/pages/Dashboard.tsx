import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '../api/client';
import type { DashboardStats } from '../types';
import { 
  Users, 
  Layers, 
  IndianRupee, 
  Activity, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const rooms = await pb.collection('rooms').getFullList();
      const beds = await pb.collection('beds').getFullList();
      const payments = await pb.collection('payments').getFullList({ expand: 'resident', sort: '-created' });
      const bookings = await pb.collection('bookings').getFullList({ expand: 'resident,bed,bed.room', sort: '-created' });
      const entryLogs = await pb.collection('entry_logs').getFullList({ expand: 'resident', sort: '-timestamp' });

      const hostels = new Set(rooms.map(r => r.hostel));

      const statsObj: DashboardStats = {
        hostelsCount: hostels.size,
        roomsCount: rooms.length,
        totalBeds: beds.length,
        occupiedBeds: beds.filter(b => b.status === 'occupied').length,
        vacantBeds: beds.filter(b => b.status === 'vacant').length,
        expectedRent: payments.reduce((sum, p) => sum + p.amount, 0),
        collectedRent: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        pendingRent: payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
        overdueCount: payments.filter(p => p.status === 'overdue').length,
        recentPayments: payments.slice(0, 5) as any,
        recentBookings: bookings.slice(0, 5) as any,
        recentEntries: entryLogs.slice(0, 5) as any,
      };

      setStats(statsObj);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
        <span className="text-sm font-medium">Loading portal analytics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-rose-400 flex flex-col items-center justify-center gap-2 min-h-[60vh]">
        <AlertTriangle className="w-12 h-12" />
        <span className="font-semibold text-lg">{error || 'Unable to load statistics.'}</span>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-all text-xs font-bold">
          Retry Loading
        </button>
      </div>
    );
  }

  // Calculate occupancy percentage
  const occupancyRate = stats.totalBeds > 0 
    ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) 
    : 0;

  // Calculate collection rate
  const collectionRate = stats.expectedRent > 0
    ? Math.round((stats.collectedRent / stats.expectedRent) * 100)
    : 0;

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-600/10 rounded-full blur-[80px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Hostel Live Database Connected</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">PG Hostel Overview</h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Real-time monitoring of room occupancies, bed allocations, monthly rent collections, and pending dues for your hostels.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/rooms')}
              className="py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-primary-500/10"
            >
              <span>Manage Rooms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/residents')}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-semibold rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <span>Manage Residents</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Occupancy Rate */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-primary-950/5">
          <div className="absolute right-4 top-4 bg-primary-500/10 border border-primary-500/20 text-primary-400 p-2 rounded-xl">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Bed Occupancy Rate</span>
          <h3 className="text-3xl font-black text-slate-100 mt-2 flex items-baseline gap-1">
            {occupancyRate}%
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            {stats.occupiedBeds} of {stats.totalBeds} beds occupied ({stats.vacantBeds} vacant)
          </div>
        </div>

        {/* Card 2: Collection Rate */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-950/5">
          <div className="absolute right-4 top-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-xl">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rent Collection Rate</span>
          <h3 className="text-3xl font-black text-slate-100 mt-2 flex items-baseline gap-1">
            {collectionRate}%
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            ₹{stats.collectedRent.toLocaleString('en-IN')} collected this month
          </div>
        </div>

        {/* Card 3: Expected Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-amber-950/5">
          <div className="absolute right-4 top-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded-xl">
            <IndianRupee className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Monthly Dues Expected</span>
          <h3 className="text-3xl font-black text-slate-100 mt-2 flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-amber-400">₹</span>
            {stats.expectedRent.toLocaleString('en-IN')}
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            Pending dues to collect: ₹{stats.pendingRent.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 4: Total Rooms Count */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-slate-950/5">
          <div className="absolute right-4 top-4 bg-slate-850 border border-slate-750 text-slate-400 p-2 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rooms in System</span>
          <h3 className="text-3xl font-black text-slate-100 mt-2 flex items-baseline gap-1">
            {stats.roomsCount}
            <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Rooms</span>
          </h3>
          <div className="text-[11px] text-slate-500 mt-2 block">
            Distributed across {stats.hostelsCount} Hostel Buildings
          </div>
        </div>
      </div>

      {/* Activity Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Card: Recent Allocations (Check-Ins) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Recent Check-Ins (Allocations)
            </h3>
            <button onClick={() => navigate('/residents')} className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {stats.recentBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-600 text-sm italic">
              No recent room allocations recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-colors">
                  <div>
                    <div className="font-bold text-slate-200 text-sm">{b.expand?.resident?.fullName}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary-500/60" />
                      <span>{b.expand?.bed?.expand?.room?.hostel} • Room {b.expand?.bed?.expand?.room?.roomNumber} ({b.expand?.bed?.bedLabel})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(b.checkInDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 mt-1.5 inline-block">
                      Allocated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Recent Collections */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              Recent Rent Collections
            </h3>
            <button onClick={() => navigate('/payments')} className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {stats.recentPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-600 text-sm italic">
              No recent collection invoices generated.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-colors">
                  <div>
                    <div className="font-bold text-slate-200 text-sm">{p.expand?.resident?.fullName}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Invoice period: {new Date(p.monthFor).toLocaleDateString('default', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-200 text-sm flex items-baseline gap-0.5 justify-end">
                      <span className="text-xs text-slate-400">₹</span>
                      {Number(p.amount).toLocaleString('en-IN')}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 inline-block border ${
                      p.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                        : p.status === 'overdue'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
