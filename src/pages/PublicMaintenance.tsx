import React, { useState, useEffect } from 'react';
import { Wrench, Send, CheckCircle, MapPin, User, AlertTriangle } from 'lucide-react';
import pb from '../api/client';

export default function PublicMaintenance() {
  const [rooms, setRooms] = useState<{ id: string; roomNumber: string }[]>([]);
  const [formData, setFormData] = useState({
    roomId: '',
    studentName: '',
    category: 'Plumbing',
    description: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Fetch rooms for dropdown
    const fetchRooms = async () => {
      try {
        const roomsData = await pb.collection('rooms').getFullList({
          sort: 'roomNumber',
        });
        setRooms(roomsData.map(r => ({ id: r.id, roomNumber: r.roomNumber })));
      } catch (err) {
        console.error("Failed to load rooms", err);
      }
    };
    fetchRooms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomId || !formData.studentName || !formData.category) return;
    
    setStatus('submitting');
    
    try {
      // Pack the extra info into the description field since we didn't migrate the DB schema for new fields
      const fullDescription = `[${formData.category}] Submitted by: ${formData.studentName}\n\n${formData.description}`;
      
      await pb.collection('maintenance_requests').create({
        roomId: formData.roomId,
        description: fullDescription,
        status: 'open',
        reportedDate: new Date().toISOString()
      });
      
      setStatus('success');
    } catch (err) {
      console.error("Failed to submit ticket", err);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-emerald-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Ticket Submitted!</h2>
          <p className="text-slate-400 mb-8">Our maintenance team has been notified and will attend to your request shortly.</p>
          <button 
            onClick={() => { setStatus('idle'); setFormData({...formData, description: ''}); }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 flex flex-col items-center">
      
      <div className="w-full max-w-lg mb-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
          <Wrench className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-100">Raise a Ticket</h1>
        <p className="text-slate-400 mt-2">Report an issue in your room and our team will get it fixed.</p>
      </div>

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        {status === 'error' && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-400">Failed to submit the ticket. Please try again or contact the warden directly.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Room Number
            </label>
            <select 
              name="roomId"
              value={formData.roomId}
              onChange={handleChange}
              required
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:outline-none focus:border-primary-500 transition-all appearance-none"
            >
              <option value="" disabled>Select your room...</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.roomNumber}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Your Name
            </label>
            <input 
              type="text" 
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="e.g. Arnab Sahoo"
              required
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" /> Issue Category
            </label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:outline-none focus:border-primary-500 transition-all appearance-none"
            >
              <option value="Plumbing">💧 Plumbing & Water</option>
              <option value="Electrical">⚡ Electrical & Lights</option>
              <option value="Cleaning">🧹 Cleaning & Hygiene</option>
              <option value="Carpentry">s🪵 Carpentry & Furniture</option>
              <option value="Internet">🌐 Wi-Fi & Internet</option>
              <option value="Other">❓ Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe the issue in detail..."
              rows={4}
              required
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:outline-none focus:border-primary-500 transition-all resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            {status === 'submitting' ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>{status === 'submitting' ? 'Submitting...' : 'Submit Ticket'}</span>
          </button>

        </form>
      </div>

    </div>
  );
}
