import React, { useState, useEffect } from 'react';
import type { Resident, Room, Booking } from '../types';
import pb from '../api/client';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  MapPin,
  X,
  AlertTriangle,
  FileText,
  FileCheck,
  Upload,
  Download,
  ExternalLink,
  Printer,
  Clock,
  CheckCircle2,
  FileUp
} from 'lucide-react';

const Residents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'checked_out'>('all');
  const [agreementFilter, setAgreementFilter] = useState<'all' | 'signed' | 'pending' | 'none'>('all');

  // Modals & Drawers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  // Family & Guardian Fields
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [localGuardianName, setLocalGuardianName] = useState('');
  const [localGuardianPhone, setLocalGuardianPhone] = useState('');
  const [localGuardianRelation, setLocalGuardianRelation] = useState('');
  const [occupation, setOccupation] = useState('');

  // Item tracking
  const [hasAlmirahKey, setHasAlmirahKey] = useState(false);
  const [hasPunchcard, setHasPunchcard] = useState(false);
  const [hasRoomKey, setHasRoomKey] = useState(false);

  // Agreement Management
  const [agreementStatus, setAgreementStatus] = useState<'none' | 'pending' | 'signed'>('none');
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [existingAgreementFile, setExistingAgreementFile] = useState<string | null>(null);
  const [agreementStartDate, setAgreementStartDate] = useState('');
  const [agreementEndDate, setAgreementEndDate] = useState('');
  const [agreementNotes, setAgreementNotes] = useState('');
  const [agreementUploading, setAgreementUploading] = useState(false);

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
      const records = await pb.collection('residents').getFullList({
        expand: 'bookings_via_resident,bookings_via_resident.bed,bookings_via_resident.bed.room,payments_via_resident',
        sort: '-created'
      });
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
        created: r.created,
        beds: (r.expand?.beds_via_room || []).map((b: any) => ({
          id: b.id,
          room: b.room,
          bedLabel: b.bedLabel,
          status: b.status,
          created: b.created
        }))
      }));
      setRooms(mappedRooms);
    } catch (err: any) {
      console.error('Failed to fetch rooms', err);
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
    // Agreement defaults
    setAgreementStatus('none');
    setAgreementFile(null);
    setExistingAgreementFile(null);
    setAgreementStartDate(new Date().toISOString().split('T')[0]);
    const nextYear = new Date();
    nextYear.setMonth(nextYear.getMonth() + 11);
    setAgreementEndDate(nextYear.toISOString().split('T')[0]);
    setAgreementNotes('');

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

    // Agreement fields
    setAgreementStatus(res.agreementStatus || (res.agreementFile ? 'signed' : 'none'));
    setAgreementFile(null);
    setExistingAgreementFile(res.agreementFile || null);
    setAgreementStartDate(res.agreementStartDate ? res.agreementStartDate.substring(0, 10) : '');
    setAgreementEndDate(res.agreementEndDate ? res.agreementEndDate.substring(0, 10) : '');
    setAgreementNotes(res.agreementNotes || '');

    setModalError(null);
    setIsEditOpen(true);
  };

  const openAgreementModal = (res: Resident) => {
    setSelectedResident(res);
    setAgreementStatus(res.agreementStatus || (res.agreementFile ? 'signed' : 'none'));
    setAgreementFile(null);
    setExistingAgreementFile(res.agreementFile || null);
    setAgreementStartDate(res.agreementStartDate ? res.agreementStartDate.substring(0, 10) : new Date().toISOString().split('T')[0]);
    const nextYear = new Date();
    nextYear.setMonth(nextYear.getMonth() + 11);
    setAgreementEndDate(res.agreementEndDate ? res.agreementEndDate.substring(0, 10) : nextYear.toISOString().split('T')[0]);
    setAgreementNotes(res.agreementNotes || '');
    setModalError(null);
    setIsAgreementModalOpen(true);
  };

  const openCheckInModal = (res: Resident) => {
    setSelectedResident(res);
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
      const formData = new FormData();
      formData.append('fullName', fullName);
      if (phone) formData.append('phone', phone);
      if (email) formData.append('email', email);
      if (idProofNumber) formData.append('idProofNumber', idProofNumber);
      if (emergencyContactName) formData.append('emergencyContactName', emergencyContactName);
      if (emergencyContactPhone) formData.append('emergencyContactPhone', emergencyContactPhone);
      if (fatherName) formData.append('fatherName', fatherName);
      if (fatherPhone) formData.append('fatherPhone', fatherPhone);
      if (motherName) formData.append('motherName', motherName);
      if (motherPhone) formData.append('motherPhone', motherPhone);
      if (localGuardianName) formData.append('localGuardianName', localGuardianName);
      if (localGuardianPhone) formData.append('localGuardianPhone', localGuardianPhone);
      if (localGuardianRelation) formData.append('localGuardianRelation', localGuardianRelation);
      if (occupation) formData.append('occupation', occupation);
      formData.append('hasAlmirahKey', String(hasAlmirahKey));
      formData.append('hasPunchcard', String(hasPunchcard));
      formData.append('hasRoomKey', String(hasRoomKey));
      formData.append('status', 'active');

      // Agreement
      formData.append('agreementStatus', agreementStatus);
      if (agreementFile) formData.append('agreementFile', agreementFile);
      if (agreementStartDate) formData.append('agreementStartDate', agreementStartDate);
      if (agreementEndDate) formData.append('agreementEndDate', agreementEndDate);
      if (agreementNotes) formData.append('agreementNotes', agreementNotes);

      await pb.collection('residents').create(formData);
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
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phone', phone || '');
      formData.append('email', email || '');
      formData.append('idProofNumber', idProofNumber || '');
      formData.append('emergencyContactName', emergencyContactName || '');
      formData.append('emergencyContactPhone', emergencyContactPhone || '');
      formData.append('fatherName', fatherName || '');
      formData.append('fatherPhone', fatherPhone || '');
      formData.append('motherName', motherName || '');
      formData.append('motherPhone', motherPhone || '');
      formData.append('localGuardianName', localGuardianName || '');
      formData.append('localGuardianPhone', localGuardianPhone || '');
      formData.append('localGuardianRelation', localGuardianRelation || '');
      formData.append('occupation', occupation || '');
      formData.append('hasAlmirahKey', String(hasAlmirahKey));
      formData.append('hasPunchcard', String(hasPunchcard));
      formData.append('hasRoomKey', String(hasRoomKey));

      // Agreement
      formData.append('agreementStatus', agreementStatus);
      if (agreementFile) formData.append('agreementFile', agreementFile);
      if (agreementStartDate) formData.append('agreementStartDate', agreementStartDate);
      if (agreementEndDate) formData.append('agreementEndDate', agreementEndDate);
      if (agreementNotes) formData.append('agreementNotes', agreementNotes);

      await pb.collection('residents').update(selectedResident.id, formData);
      setIsEditOpen(false);
      fetchResidents();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update resident.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    setAgreementUploading(true);
    setModalError(null);

    try {
      const formData = new FormData();
      formData.append('agreementStatus', agreementStatus);
      if (agreementFile) {
        formData.append('agreementFile', agreementFile);
      }
      if (agreementStartDate) formData.append('agreementStartDate', agreementStartDate);
      if (agreementEndDate) formData.append('agreementEndDate', agreementEndDate);
      if (agreementNotes) formData.append('agreementNotes', agreementNotes);

      await pb.collection('residents').update(selectedResident.id, formData);
      setIsAgreementModalOpen(false);
      fetchResidents();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update agreement.');
    } finally {
      setAgreementUploading(false);
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
      fetchRooms();
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
      fetchRooms();
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
        .map(r => r.floor !== null && r.floor !== undefined ? r.floor : 0)
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

    const matchesAgreement =
      agreementFilter === 'all' ||
      (agreementFilter === 'signed' && (res.agreementStatus === 'signed' || Boolean(res.agreementFile))) ||
      (agreementFilter === 'pending' && res.agreementStatus === 'pending') ||
      (agreementFilter === 'none' && !res.agreementFile && res.agreementStatus !== 'signed' && res.agreementStatus !== 'pending');

    return matchesSearch && matchesStatus && matchesAgreement;
  });

  const activeCount = residents.filter(r => r.status === 'active').length;
  const checkedOutCount = residents.filter(r => r.status === 'checked_out').length;
  const signedAgreementCount = residents.filter(r => r.agreementFile || r.agreementStatus === 'signed').length;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" />
            Residents Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage student check-ins, hardcopy agreements, and room allocations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Resident</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-200">{residents.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-200">{activeCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Agreements</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-200">{signedAgreementCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
            <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Checked-out</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-200">{checkedOutCount}</span>
          </div>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student name, phone, or ID proof..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition-colors placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'active', 'checked_out'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`py-1 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Agreement Filter */}
          <select
            value={agreementFilter}
            onChange={(e) => setAgreementFilter(e.target.value as any)}
            className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Agreements</option>
            <option value="signed">📄 Signed Only</option>
            <option value="pending">⏳ Pending Only</option>
            <option value="none">No Agreement</option>
          </select>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
            <span className="text-sm font-medium">Loading resident registry...</span>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-12 h-12 text-slate-700 mb-4" />
            <span className="font-semibold text-sm">No residents found matching criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Resident</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Occupancy</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Rental Agreement</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Contact</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredResidents.map((res) => {
                  const activeBooking = res.expand?.bookings_via_resident?.find((b: any) => b.checkOutDate === '');
                  const activeBed = activeBooking?.expand?.bed;
                  const hasAgreement = Boolean(res.agreementFile);

                  return (
                    <tr key={res.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Resident Info */}
                      <td className="p-4">
                        <div className="font-bold text-slate-200 text-sm">{res.fullName}</div>
                        <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-slate-400">
                          {res.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {res.phone}
                            </span>
                          )}
                          {res.idProofNumber && (
                            <span className="font-mono text-[10px] text-slate-500">
                              ID: {res.idProofNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Current Occupancy */}
                      <td className="p-4">
                        {activeBed ? (
                          <div>
                            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                              <span>{activeBed.expand?.room?.hostel || 'Hostel'} • Room {activeBed.expand?.room?.roomNumber}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Bed {activeBed.bedLabel} • In: {new Date(activeBooking.checkInDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No Active Room</span>
                        )}
                      </td>

                      {/* Agreement Column */}
                      <td className="p-4">
                        {hasAgreement ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={pb.files.getURL(res, res.agreementFile!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                              title="View / Download Hard Copy Agreement"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Hardcopy Signed</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                            <button
                              onClick={() => openAgreementModal(res)}
                              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                              title="Manage / Replace Copy"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : res.agreementStatus === 'pending' ? (
                          <button
                            onClick={() => openAgreementModal(res)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                            title="Pending signature — click to upload"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Copy</span>
                            <Upload className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAgreementModal(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60 transition-all"
                            title="Upload signed agreement"
                          >
                            <Upload className="w-3 h-3 text-primary-400" />
                            <span>+ Upload</span>
                          </button>
                        )}
                      </td>

                      {/* Emergency Contact */}
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
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            activeBooking
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}
                        >
                          {activeBooking ? 'Active' : 'Checked Out'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {activeBooking ? (
                            <button
                              onClick={() => openCheckOutModal(res)}
                              className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                              title="Check Out Resident"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Check-out</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openCheckInModal(res)}
                              className="py-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                              title="Check In Resident"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Check-in</span>
                            </button>
                          )}

                          <button
                            onClick={() => openAgreementModal(res)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/60"
                            title="Manage Agreement"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary-400" />
                          </button>

                          <button
                            onClick={() => openEditModal(res)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/60"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(res)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-700/60"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* =========================================================================
          MODAL: QUICK AGREEMENT MANAGER & OFFLINE UPLOAD
      ========================================================================= */}
      {isAgreementModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary-500" />
                  Agreement Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resident: <strong className="text-slate-200">{selectedResident.fullName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleQuickAgreementSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Existing Uploaded Agreement Preview */}
              {existingAgreementFile && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-emerald-400">Hardcopy Uploaded</div>
                      <div className="text-[11px] text-slate-400 truncate">{existingAgreementFile}</div>
                    </div>
                  </div>
                  <a
                    href={pb.files.getURL(selectedResident, existingAgreementFile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all flex-shrink-0 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View / Download</span>
                  </a>
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{existingAgreementFile ? 'Replace Hard Copy File (Photo / PDF)' : 'Upload Signed Hard Copy (Photo / PDF)'}</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600/20 file:text-primary-300 hover:file:bg-primary-600/30 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Upload a photo taken from your phone or scanned PDF of the offline paper agreement.
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Agreement Status</label>
                <select
                  value={agreementStatus}
                  onChange={(e) => setAgreementStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="none">Not Required / None</option>
                  <option value="pending">Pending Physical Signature</option>
                  <option value="signed">Signed & Completed</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Start Date</label>
                  <input
                    type="date"
                    value={agreementStartDate}
                    onChange={(e) => setAgreementStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">End Date (Lock-in/Tenure)</label>
                  <input
                    type="date"
                    value={agreementEndDate}
                    onChange={(e) => setAgreementEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Filing Notes / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Physical hardcopy filed in Folder 2, Rack A"
                  value={agreementNotes}
                  onChange={(e) => setAgreementNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Print Offline Agreement Template Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700/60"
                >
                  <Printer className="w-3.5 h-3.5 text-primary-400" />
                  <span>Print Blank Tenancy Agreement Form for Student</span>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAgreementModalOpen(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={agreementUploading}
                  className="py-2 px-5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-primary-500/10 flex items-center gap-2"
                >
                  {agreementUploading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Save Agreement Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PRINT PHYSICAL OFFLINE AGREEMENT FORM
      ========================================================================= */}
      {showPrintModal && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary-600" />
                Physical Tenancy Agreement Document
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-1 px-3 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  Print Form
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs leading-relaxed text-slate-800 font-serif">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-xl font-bold uppercase tracking-wider">Hostel Tenancy & Rules Agreement</h1>
                <p className="text-slate-600 text-[11px] mt-1">Under The Orissa Sai Charitable Trust • Official Admission Form</p>
              </div>

              {/* Student particulars */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p><strong>Resident Name:</strong> {selectedResident.fullName}</p>
                  <p className="mt-1"><strong>Phone Number:</strong> {selectedResident.phone || 'N/A'}</p>
                  <p className="mt-1"><strong>ID Proof / Aadhaar:</strong> {selectedResident.idProofNumber || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Guardian Name:</strong> {selectedResident.emergencyContactName || selectedResident.fatherName || 'N/A'}</p>
                  <p className="mt-1"><strong>Guardian Contact:</strong> {selectedResident.emergencyContactPhone || selectedResident.fatherPhone || 'N/A'}</p>
                  <p className="mt-1"><strong>Agreement Start Date:</strong> {agreementStartDate || new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-2">
                <h2 className="font-bold text-sm uppercase tracking-wide border-b border-slate-300 pb-1">Rules & Obligations</h2>
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-700">
                  <li><strong>Monthly Rent:</strong> Rent dues must be cleared on or before the 5th day of every calendar month.</li>
                  <li><strong>Lock-in Tenure:</strong> Minimum stay tenure is committed as per agreement. Early checkout requires a written 30-day notice.</li>
                  <li><strong>Hostel Curfew & Discipline:</strong> All residents must return by the designated gate closing time.</li>
                  <li><strong>Damage & Fines:</strong> Any damage to hostel property (furniture, appliances, electricals) will be recovered from the security deposit.</li>
                  <li><strong>Electricity Usage:</strong> Shared room sub-meter units will be billed monthly and split equally among room occupants.</li>
                </ol>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-12 text-center text-[11px]">
                <div className="border-t border-slate-800 pt-2">
                  <p className="font-bold">Resident Signature</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Date: ____________</p>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <p className="font-bold">Parent / Guardian Signature</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Date: ____________</p>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <p className="font-bold">Hostel Warden / Authority</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Seal & Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD RESIDENT
      ========================================================================= */}
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

              {/* RENTAL AGREEMENT SECTION (OPTIONAL) */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Rental Agreement (Optional)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Offline Hardcopy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Agreement Status</label>
                    <select
                      value={agreementStatus}
                      onChange={(e) => setAgreementStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="none">Not Required / None</option>
                      <option value="pending">Pending Physical Signature</option>
                      <option value="signed">Signed & Executed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Upload Hardcopy Copy</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600/20 file:text-primary-300 hover:file:bg-primary-600/30 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
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

              {/* Family & Guardian */}
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
                </div>
              </div>

              {/* Item Checklist */}
              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Issued Items</span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input type="checkbox" checked={hasAlmirahKey} onChange={(e) => setHasAlmirahKey(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-primary-500" />
                    <span>Almirah Key</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input type="checkbox" checked={hasRoomKey} onChange={(e) => setHasRoomKey(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-primary-500" />
                    <span>Room Key</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input type="checkbox" checked={hasPunchcard} onChange={(e) => setHasPunchcard(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-primary-500" />
                    <span>Punch Card</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="py-2 px-5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-primary-500/10"
                >
                  {modalLoading ? 'Creating...' : 'Create Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT RESIDENT
      ========================================================================= */}
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

              {/* RENTAL AGREEMENT SECTION (OPTIONAL) */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Rental Agreement (Optional)
                    </span>
                  </div>
                  {existingAgreementFile && (
                    <a
                      href={pb.files.getURL(selectedResident, existingAgreementFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View Current File</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Agreement Status</label>
                    <select
                      value={agreementStatus}
                      onChange={(e) => setAgreementStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="none">Not Required / None</option>
                      <option value="pending">Pending Physical Signature</option>
                      <option value="signed">Signed & Executed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {existingAgreementFile ? 'Replace Hardcopy' : 'Upload Hardcopy'}
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600/20 file:text-primary-300 hover:file:bg-primary-600/30 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Emergency Contact</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Contact Name</label>
                    <input type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Contact Phone</label>
                    <input type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500" />
                  </div>
                </div>
              </div>

              {/* Issued Items */}
              <div className="border-t border-slate-850 pt-4 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Issued Items</span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input type="checkbox" checked={hasAlmirahKey} onChange={(e) => setHasAlmirahKey(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-primary-500" />
                    <span>Almirah Key</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input type="checkbox" checked={hasRoomKey} onChange={(e) => setHasRoomKey(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-primary-500" />
                    <span>Room Key</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input type="checkbox" checked={hasPunchcard} onChange={(e) => setHasPunchcard(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-primary-500" />
                    <span>Punch Card</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="py-2 px-5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-primary-500/10"
                >
                  {modalLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CHECK IN RESIDENT
      ========================================================================= */}
      {isCheckInOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                Check In: {selectedResident.fullName}
              </h3>
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Hostel Block</label>
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
                  {Array.from(new Set(rooms.map(r => r.hostel))).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => {
                      setSelectedFloor(e.target.value);
                      setSelectedRoomId('');
                      setSelectedBedId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">All Floors</option>
                    {availableFloors.map(f => (
                      <option key={f} value={f.toString()}>{f === 0 ? 'Ground' : `Floor ${f}`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Room Number *</label>
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      setSelectedBedId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select Room</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.roomType || `${r.capacity} sharing`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Available Bed *</label>
                <select
                  required
                  disabled={!selectedRoomId}
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500 disabled:opacity-50"
                >
                  <option value="">{selectedRoomId ? 'Select an available bed' : 'Select a room first'}</option>
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      Bed {b.bedLabel}
                    </option>
                  ))}
                </select>
                {selectedRoomId && availableBeds.length === 0 && (
                  <span className="text-[10px] text-rose-400 font-semibold block mt-1">No vacant beds in this room!</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Check-in Date *</label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Notes</label>
                <input
                  type="text"
                  placeholder="Additional check-in details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !selectedBedId}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {modalLoading ? 'Assigning...' : 'Complete Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CHECK OUT RESIDENT
      ========================================================================= */}
      {isCheckOutOpen && selectedResident && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-500" />
                Check Out: {selectedResident.fullName}
              </h3>
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
              <p className="text-xs text-slate-400">
                This action will vacate their assigned bed and update the resident status to checked-out.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Check-out Date *</label>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCheckOutOpen(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/10"
                >
                  {modalLoading ? 'Checking out...' : 'Confirm Check-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DELETE CONFIRMATION
      ========================================================================= */}
      {isDeleteOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Delete Profile
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
                This action is permanent and will delete their checkout histories and billing records.
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
