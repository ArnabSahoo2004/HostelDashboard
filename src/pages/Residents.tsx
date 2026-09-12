import React, { useState, useEffect } from 'react';
import type { Resident, Room, Booking } from '../types';
import pb from '../api/client';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  ShieldAlert,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  X,
  AlertTriangle
} from 'lucide-react';

const Residents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'checked_out'>('all');

  // Modals & Drawers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selection States
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form Fields: Resident Profile
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // New Form Fields
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [localGuardianName, setLocalGuardianName] = useState('');
  const [localGuardianPhone, setLocalGuardianPhone] = useState('');
  const [localGuardianRelation, setLocalGuardianRelation] = useState('');
  const [occupation, setOccupation] = useState('');
  // Feature 3: Item tracking
  const [hasAlmirahKey, setHasAlmirahKey] = useState(false);
  const [hasPunchcard, setHasPunchcard] = useState(false);
  const [hasRoomKey, setHasRoomKey] = useState(false);

  // Form Fields: Check-in
  const [selectedHostel, setSelectedHostel] = useState('Hostel 1');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Form Fields: Check-out
  const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().split('T')[0]);

  // Loading & Error states inside Modals
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch Residents
  const fetchResidents = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('residents').getFullList({ expand: 'bookings_via_resident,bookings_via_resident.bed,bookings_via_resident.bed.room,payments_via_resident' });
      setResidents(records as any);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch residents.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Rooms (for vacant bed selection in check-in)
  const fetchRooms = async () => {
    try {
      const records = await pb.collection('rooms').getFullList({ expand: 'beds_via_room' });
      const mappedRooms = records.map(r => ({
        id: r.id,
        roomNumber: r.roomNumber,
        hostel: r.hostel,
        floor: r.floor,
        roomType: r.roomType,
        capacity: r.capacity,
        monthlyRent: r.monthlyRent,
        ac: r.ac,
        attachedBathroom: r.attachedBathroom,
        balcony: r.balcony,
        beds: r.expand?.beds_via_room?.map((b: any) => ({
          id: b.id,
          roomId: b.room,
          bedLabel: b.bedLabel,
          status: b.status
        })) || []
      }));
      setRooms(mappedRooms as any);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  useEffect(() => {
    fetchResidents();
    fetchRooms();
  }, []);

  // Modal Open Handlers
  const openAddModal = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setIdProofNumber('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setFatherName('');
    setFatherPhone('');
    setMotherName('');
    setMotherPhone('');
    setLocalGuardianName('');
    setLocalGuardianPhone('');
    setLocalGuardianRelation('');
    setOccupation('');
    setHasAlmirahKey(false);
    setHasPunchcard(false);
    setHasRoomKey(false);
    setModalError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (res: Resident) => {
    setSelectedResident(res);
    setFullName(res.fullName);
    setPhone(res.phone || '');
    setEmail(res.email || '');
    setIdProofNumber(res.idProofNumber || '');
    setEmergencyContactName(res.emergencyContactName || '');
    setEmergencyContactPhone(res.emergencyContactPhone || '');
    setFatherName(res.fatherName || '');
    setFatherPhone(res.fatherPhone || '');
    setMotherName(res.motherName || '');
    setMotherPhone(res.motherPhone || '');
    setLocalGuardianName(res.localGuardianName || '');
    setLocalGuardianPhone(res.localGuardianPhone || '');
    setLocalGuardianRelation(res.localGuardianRelation || '');
    setOccupation(res.occupation || '');
    setHasAlmirahKey(res.hasAlmirahKey || false);
    setHasPunchcard(res.hasPunchcard || false);
    setHasRoomKey(res.hasRoomKey || false);
    setModalError(null);
    setIsEditOpen(true);
  };

  const openCheckInModal = (res: Resident) => {
    setSelectedResident(res);
    // Reset selection defaults
    setSelectedHostel('Hostel 1');
    setSelectedFloor('');
    setSelectedRoomId('');
    setSelectedBedId('');
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setModalError(null);
    setIsCheckInOpen(true);
  };

  const openCheckOutModal = (res: Resident) => {
    setSelectedResident(res);
    // Find active booking. PocketBase expands reverse relation as an array.
    const activeBooking = (res as any).expand?.bookings_via_resident?.find((b: any) => b.checkOutDate === '');
    if (!activeBooking) {
      setError('No active booking found for this resident.');
      return;
    }
    setSelectedBooking(activeBooking);
    setCheckOutDate(new Date().toISOString().split('T')[0]);
    setModalError(null);
    setIsCheckOutOpen(true);
  };

  const openDeleteModal = (res: Resident) => {
    setSelectedResident(res);
    setModalError(null);
    setIsDeleteOpen(true);
  };

  // Form Submissions
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      await pb.collection('residents').create({
        fullName,
        phone,
        email,
        idProofNumber,
        emergencyContactName,
        emergencyContactPhone,
        fatherName,
        fatherPhone,
        motherName,
        motherPhone,
        localGuardianName,
        localGuardianPhone,
        localGuardianRelation,
        occupation,
        hasAlmirahKey,
        hasPunchcard,
        hasRoomKey,
        status: 'active'
      });
      setIsAddOpen(false);
      fetchResidents();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create resident.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    setModalError(null);
    setModalLoading(true);

    try {
      await pb.collection('residents').update(selectedResident.id, {
        fullName,
        phone,
        email,
        idProofNumber,
        emergencyContactName,
        emergencyContactPhone,
        fatherName,
        fatherPhone,
        motherName,
        motherPhone,
        localGuardianName,
        localGuardianPhone,
        localGuardianRelation,
        occupation,
        hasAlmirahKey,
        hasPunchcard,
        hasRoomKey,
      });
      setIsEditOpen(false);
      fetchResidents();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update resident.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !selectedBedId) {
      setModalError('Please select a bed.');
      return;
    }
    setModalError(null);
    setModalLoading(true);

    try {
      await pb.collection('bookings').create({
        resident: selectedResident.id,
        bed: selectedBedId,
        checkInDate: checkInDate + ' 12:00:00.000Z',
        notes,
      });

      await pb.collection('beds').update(selectedBedId, { status: 'occupied' });

      setIsCheckInOpen(false);
      fetchResidents();
      fetchRooms(); // Refresh rooms to sync bed occupancy
    } catch (err: any) {
      setModalError(err.message || 'Check-in failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setModalError(null);
    setModalLoading(true);

    try {
      await pb.collection('bookings').update(selectedBooking.id, {
        checkOutDate: checkOutDate + ' 12:00:00.000Z',
      });

      await pb.collection('beds').update(selectedBooking.bed, { status: 'vacant' });
      await pb.collection('residents').update(selectedResident!.id, { status: 'checked_out' });

      setIsCheckOutOpen(false);
      fetchResidents();
      fetchRooms(); // Refresh rooms to sync bed occupancy
    } catch (err: any) {
      setModalError(err.message || 'Check-out failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteResidentSubmit = async () => {
    if (!selectedResident) return;
    setModalError(null);
    setModalLoading(true);

    try {
      await pb.collection('residents').delete(selectedResident.id);
      setIsDeleteOpen(false);
      fetchResidents();
    } catch (err: any) {
      setModalError(err.message || 'Failed to delete resident.');
    } finally {
      setModalLoading(false);
    }
  };

  // Select list builders for check-in
  const availableFloors = Array.from(
    new Set(
      rooms
        .filter(r => r.hostel === selectedHostel)
        .map(r => r.floor === null || r.floor === undefined ? 0 : r.floor)
    )
  ).sort((a, b) => a - b);

  const availableRooms = rooms.filter(
    r => r.hostel === selectedHostel &&
      (selectedFloor === '' ||
        r.floor?.toString() === selectedFloor ||
        (selectedFloor === '0' && r.floor === null))
  );

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const availableBeds = selectedRoom
    ? selectedRoom.beds.filter(b => b.status === 'vacant')
    : [];

  // Filtered residents list
  const filteredResidents = residents.filter(res => {
    const matchesSearch =
      res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.phone && res.phone.includes(searchTerm)) ||
      (res.email && res.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = residents.filter(r => r.status === 'active').length;
  const checkedOutCount = residents.filter(r => r.status === 'checked_out').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-500" />
            Residents Dashboard
          </h2>
          <p className="text-slate-400 mt-1">Manage resident check-ins, profiles, and historical check-outs.</p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Resident</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Residents</span>
            <span className="text-2xl font-bold text-slate-200">{residents.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active checked-in</span>
            <span className="text-2xl font-bold text-slate-200">{activeCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Checked-out</span>
            <span className="text-2xl font-bold text-slate-200">{checkedOutCount}</span>
          </div>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, contact info..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition-colors placeholder-slate-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'checked_out'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${statusFilter === status
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-300'
                }`}
            >
              {status === 'all' && 'All Status'}
              {status === 'active' && 'Active'}
              {status === 'checked_out' && 'Checked Out'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
            <span className="text-sm font-medium">Loading resident profiles...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="w-10 h-10" />
            <span className="font-semibold">{error}</span>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-12 h-12 text-slate-700 mb-4" />
            <span className="font-semibold">No residents found matching criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Resident Info</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID Proof</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Current Occupancy</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredResidents.map((res) => {
                  const activeBooking = res.expand?.bookings_via_resident?.find((b: any) => b.checkOutDate === '');
                  const activeBed = activeBooking?.expand?.bed;

                  return (
                    <tr key={res.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-200">{res.fullName}</div>
                        <div className="flex flex-col gap-1 mt-1 text-[11px] text-slate-500">
                          {res.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {res.phone}
                            </span>
                          )}
                          {res.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-600" />
                              {res.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-sm text-slate-300">
                        {res.idProofNumber ? (
                          <span className="font-mono bg-slate-950/30 px-2 py-1 border border-slate-800/40 rounded-lg text-xs">
                            {res.idProofNumber}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        {activeBed ? (
                          <div>
                            <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary-400" />
                              {activeBed.expand?.room?.hostel} • Room {activeBed.expand?.room?.roomNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {activeBed.bedLabel} • Checked-in {new Date(activeBooking.checkInDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">No Active Check-in</span>
                        )}
                      </td>

                      <td className="p-4">
                        {res.emergencyContactName ? (
                          <div>
                            <div className="text-xs font-semibold text-slate-300">{res.emergencyContactName}</div>
                            {res.emergencyContactPhone && (
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {res.emergencyContactPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${!!activeBooking
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}>
                          {!!activeBooking ? 'Active' : 'Checked Out'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!!activeBooking ? (
                            <button
                              onClick={() => openCheckOutModal(res)}
                              className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                              title="Check Out Resident"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Check-out</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openCheckInModal(res)}
                              className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                              title="Check In Resident"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Check-in</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(res)}
                            className="p-1.5 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg border border-slate-800 hover:border-primary-500/20 transition-all"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {res.status !== 'active' && (
                            <button
                              onClick={() => openDeleteModal(res)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-800 hover:border-rose-500/20 transition-all"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD RESIDENT */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                Add Resident Profile
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddResident} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">ID Proof Number (Aadhaar/PAN/Passport)</label>
                <input
                  type="text"
                  placeholder="Aadhaar: 1234-5678-9012"
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Emergency Contact details</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="Father's Name"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Contact Phone Number</label>
                    <input
                      type="tel"
                      placeholder="9876500000"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Family & Guardian Details</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Father's Name</label>
                    <input type="text" placeholder="Father's Name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Father's Phone</label>
                    <input type="tel" placeholder="9876500001" value={fatherPhone} onChange={(e) => setFatherPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Mother's Name</label>
                    <input type="text" placeholder="Mother's Name" value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Mother's Phone</label>
                    <input type="tel" placeholder="9876500002" value={motherPhone} onChange={(e) => setMotherPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Local Guardian Name</label>
                    <input type="text" placeholder="Local Guardian Name" value={localGuardianName} onChange={(e) => setLocalGuardianName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Local Guardian Phone</label>
                    <input type="tel" placeholder="9876500003" value={localGuardianPhone} onChange={(e) => setLocalGuardianPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Guardian Relation</label>
                    <input type="text" placeholder="Uncle / Aunt" value={localGuardianRelation} onChange={(e) => setLocalGuardianRelation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Occupation</label>
                    <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 appearance-none">
                      <option value="">Select Occupation</option>
                      <option value="Student">Student</option>
                      <option value="Working Professional">Working Professional</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Issued Checklist */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Items Issued to Resident</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '🔑 Almirah Key', state: hasAlmirahKey, setter: setHasAlmirahKey },
                    { label: '🪪 Punchcard', state: hasPunchcard, setter: setHasPunchcard },
                    { label: '🚪 Room Key', state: hasRoomKey, setter: setHasRoomKey },
                  ].map(({ label, state, setter }) => (
                    <label key={label} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      state ? 'bg-primary-500/10 border-primary-500/30 text-primary-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)} className="accent-primary-500 w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg flex items-center justify-center gap-2"
              >
                {modalLoading ? 'Creating...' : 'Create Resident'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RESIDENT */}
      {isEditOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary-500" />
                Edit Profile: {selectedResident.fullName}
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditResident} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">ID Proof Number</label>
                <input
                  type="text"
                  placeholder="Aadhaar: 1234-5678-9012"
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Emergency Contact details</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="Father's Name"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Contact Phone Number</label>
                    <input
                      type="tel"
                      placeholder="9876500000"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Family & Guardian Details</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Father's Name</label>
                    <input type="text" placeholder="Father's Name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Father's Phone</label>
                    <input type="tel" placeholder="9876500001" value={fatherPhone} onChange={(e) => setFatherPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Mother's Name</label>
                    <input type="text" placeholder="Mother's Name" value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Mother's Phone</label>
                    <input type="tel" placeholder="9876500002" value={motherPhone} onChange={(e) => setMotherPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Local Guardian Name</label>
                    <input type="text" placeholder="Local Guardian Name" value={localGuardianName} onChange={(e) => setLocalGuardianName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Local Guardian Phone</label>
                    <input type="tel" placeholder="9876500003" value={localGuardianPhone} onChange={(e) => setLocalGuardianPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Guardian Relation</label>
                    <input type="text" placeholder="Uncle / Aunt" value={localGuardianRelation} onChange={(e) => setLocalGuardianRelation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Occupation</label>
                    <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 appearance-none">
                      <option value="">Select Occupation</option>
                      <option value="Student">Student</option>
                      <option value="Working Professional">Working Professional</option>
                    </select>
                  </div>
                </div>
              </div>

                            {/* Items Issued Checklist */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Items Issued to Resident</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'AlmirahKey', state: hasAlmirahKey, setter: setHasAlmirahKey },
                    { label: 'Punchcard', state: hasPunchcard, setter: setHasPunchcard },
                    { label: 'RoomKey', state: hasRoomKey, setter: setHasRoomKey },
                  ].map(({ label, state, setter }) => (
                    <label key={label} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${state ? 'bg-primary-500/10 border-primary-500/30 text-primary-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)} className="accent-primary-500 w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
<button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg flex items-center justify-center gap-2"
              >
                {modalLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHECK IN */}
      {isCheckInOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary-500" />
                  Check-in Resident
                </h3>
                <span className="text-xs text-slate-500">Checking in {selectedResident.fullName}</span>
              </div>
              <button
                onClick={() => setIsCheckInOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Hostel *</label>
                  <select
                    value={selectedHostel}
                    onChange={(e) => {
                      setSelectedHostel(e.target.value);
                      setSelectedFloor('');
                      setSelectedRoomId('');
                      setSelectedBedId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="Hostel 1">Hostel 1</option>
                    <option value="Hostel 2">Hostel 2</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Floor Number</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => {
                      setSelectedFloor(e.target.value);
                      setSelectedRoomId('');
                      setSelectedBedId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Any Floor</option>
                    {availableFloors.map(f => (
                      <option key={f} value={f.toString()}>{f === 0 ? 'Ground Floor' : `Floor ${f}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Select Room *</label>
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      setSelectedBedId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">-- Choose Room --</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Select Bed *</label>
                  <select
                    required
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    disabled={!selectedRoomId}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500 disabled:opacity-50"
                  >
                    <option value="">-- Choose Bed --</option>
                    {availableBeds.map(b => (
                      <option key={b.id} value={b.id}>{b.bedLabel}</option>
                    ))}
                  </select>
                  {selectedRoomId && availableBeds.length === 0 && (
                    <span className="text-[10px] text-rose-400 font-semibold block mt-1">No vacant beds in this room!</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Check-in Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Booking Notes</label>
                <textarea
                  placeholder="Any details (advance payment details, luggage, room keys details)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500 h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={modalLoading || !selectedBedId}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {modalLoading ? 'Checking in...' : 'Perform Check-In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CHECK OUT */}
      {isCheckOutOpen && selectedResident && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-500" />
                  Check-out Resident
                </h3>
                <span className="text-xs text-slate-500">Checking out {selectedResident.fullName}</span>
              </div>
              <button
                onClick={() => setIsCheckOutOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCheckOutSubmit} className="p-6 space-y-4">
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/40 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Bed Booking:</span>
                  <span className="font-semibold text-slate-200">
                    Room {selectedBooking.expand?.bed?.expand?.room?.roomNumber} ({selectedBooking.expand?.bed?.bedLabel})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in Date:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Check-out Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg flex items-center justify-center gap-2"
              >
                {modalLoading ? 'Checking out...' : 'Confirm Check-Out'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOM DELETE RESIDENT MODAL */}
      {isDeleteOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Delete Profile Confirmation
              </h3>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300">
                Are you sure you want to delete the resident profile for{' '}
                <strong className="text-slate-100 font-semibold">{selectedResident.fullName}</strong>?
                This action is permanent and will delete their complete checkout histories and billing records.
              </p>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-850">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={modalLoading}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteResidentSubmit}
                  disabled={modalLoading}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/10"
                >
                  {modalLoading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residents;
