import React, { useState, useEffect } from 'react';
import { pb } from '../api/client';
import { Wrench, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function Maintenance() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-sm font-medium border border-slate-700"
        >
          Refresh Tickets
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
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
