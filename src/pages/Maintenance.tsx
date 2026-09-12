import { useState, useEffect } from 'react';
import { pb } from '../api/client';
import { Wrench, CheckCircle, AlertCircle, Clock, QrCode, X, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function Maintenance() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const qrUrl = window.location.origin + '/report-issue';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tickets and sort by newest first
      const ticketsData = await pb.collection('maintenance_requests').getFullList({
        sort: '-reportedDate'
      });
      setTickets(ticketsData);
      
      // Fetch rooms to map room names
      const roomsData = await pb.collection('rooms').getFullList();
      setRooms(roomsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await pb.collection('maintenance_requests').update(id, {
        status: newStatus
      });
      // Update local state
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.roomNumber : 'Unknown Room';
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary-500" />
            Maintenance Tickets
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track resident maintenance issues.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600/10 text-primary-400 rounded-lg hover:bg-primary-600/20 transition-all text-sm font-bold border border-primary-500/20 shadow-lg shadow-primary-500/10"
          >
            <QrCode className="w-4 h-4" />
            Print QR Poster
          </button>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-sm font-medium border border-slate-700"
          >
            Refresh Tickets
          </button>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:bg-white print:backdrop-blur-none print:p-0 print:m-0 print:absolute print:inset-0 print:block">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white print:max-w-full print:h-screen print:flex print:flex-col print:items-center print:justify-center print:rounded-none">
            
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors print:hidden"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center print:w-full print:max-w-2xl print:mx-auto">
              {/* Branding Header */}
              <div className="mb-6 print:mb-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/20 print:bg-primary-50 print:border-primary-200 print:w-32 print:h-32">
                  <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500 print:w-16 print:h-16" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 print:text-black print:text-5xl uppercase tracking-tight">Hostel Maintenance</h2>
                <div className="h-1 w-16 sm:w-24 bg-primary-500 mx-auto mt-4 rounded-full print:w-32 print:h-2"></div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2 print:text-slate-800 print:text-3xl">Scan to Report an Issue</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 print:text-slate-500 print:text-xl print:mb-12 print:px-10">
                Point your phone's camera at this QR code to instantly raise a maintenance ticket for your room. No app download required!
              </p>
              
              <div className="bg-white p-4 sm:p-6 rounded-3xl inline-block shadow-xl mb-6 border-4 border-slate-800 print:border-8 print:border-primary-500 print:p-10 print:shadow-2xl">
                <div className="print:scale-[1.5] print:origin-center">
                  <QRCode value={qrUrl} size={180} className="sm:w-[200px] sm:h-[200px]" />
                </div>
              </div>
              
              <p className="text-xs text-slate-500 font-mono bg-slate-950 px-3 py-2 rounded-lg mb-6 truncate print:text-slate-400 print:bg-transparent print:text-lg">{qrUrl}</p>
              
              <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 print:hidden"
              >
                <Printer className="w-5 h-5" />
                Print Poster Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg print:hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No maintenance tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Room</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Issue Description</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4 text-sm text-slate-300">
                      {new Date(ticket.reportedDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-200">
                      {getRoomName(ticket.roomId)}
                    </td>
                    <td className="p-4 text-sm text-slate-400 max-w-md truncate">
                      {ticket.description}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${ticket.status === 'open' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          ticket.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                      >
                        {ticket.status === 'open' && <AlertCircle className="w-3.5 h-3.5" />}
                        {ticket.status === 'in-progress' && <Clock className="w-3.5 h-3.5" />}
                        {ticket.status === 'resolved' && <CheckCircle className="w-3.5 h-3.5" />}
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(ticket.id, 'resolved')}
                          className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => updateStatus(ticket.id, 'in-progress')}
                          className="px-3 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          Mark In-Progress
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
