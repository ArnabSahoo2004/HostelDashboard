import React, { useState, useEffect } from 'react';
import type { Room, Bed, Resident } from '../types';
import pb from '../api/client';
import { 
  Building, 
  Layers, 
  Home, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Bed as BedIcon, 
  Save, 
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  IndianRupee,
  Users,
  Snowflake,
  Bath,
  Wind
} from 'lucide-react';

const SHARING_OPTIONS = [
  { label: 'Single', value: 'single', capacity: 1 },
  { label: '2 Sharing', value: '2 sharing', capacity: 2 },
  { label: '3 Sharing', value: '3 sharing', capacity: 3 },
  { label: '4 Sharing', value: '4 sharing', capacity: 4 },
  { label: '5 Sharing', value: '5 sharing', capacity: 5 },
];

const formatRoomType = (type: string) => {
  const opt = SHARING_OPTIONS.find(o => o.value === type);
  return opt ? opt.label : type;
};

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation State for Drill-Down
  const [activeHostel, setActiveHostel] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<number | null>(null);

  // Modal & Drawer State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Custom Delete Confirmation State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields
  const [hostel, setHostel] = useState('Hostel 1');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [roomType, setRoomType] = useState('2 sharing');
  const [capacity, setCapacity] = useState('2');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [ac, setAc] = useState<boolean>(false);
  const [attachedBathroom, setAttachedBathroom] = useState<boolean>(false);
  const [balcony, setBalcony] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Check-In / Check-Out Integration States
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isResidentType, setIsResidentType] = useState<'existing' | 'new'>('new');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [newResidentName, setNewResidentName] = useState('');
  const [newResidentPhone, setNewResidentPhone] = useState('');
  const [newResidentEmail, setNewResidentEmail] = useState('');
  const [newResidentIdProof, setNewResidentIdProof] = useState('');
  const [newResidentEmergName, setNewResidentEmergName] = useState('');
  const [newResidentEmergPhone, setNewResidentEmergPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Bed Editing State (within drawer)
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editingBedLabel, setEditingBedLabel] = useState('');
  const [bedError, setBedError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('rooms').getFullList({
        sort: 'roomNumber',
        expand: 'beds_via_room' 
      });
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
      setRooms(mappedRooms as unknown as Room[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Sync selected room in drawer
  useEffect(() => {
    if (selectedRoom) {
      const updated = rooms.find(r => r.id === selectedRoom.id);
      if (updated) {
        setSelectedRoom(updated);
      }
    }
  }, [rooms, selectedRoom]);

  const openAddModal = () => {
    setHostel(activeHostel || 'Hostel 1');
    setRoomNumber('');
    setFloor(activeFloor !== null ? activeFloor.toString() : '');
    setRoomType('2 sharing');
    setCapacity('2');
    setMonthlyRent('');
    setAc(false);
    setAttachedBathroom(false);
    setBalcony(false);
    setFormError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    setHostel(room.hostel);
    setRoomNumber(room.roomNumber);
    setFloor(room.floor !== null && room.floor !== undefined ? room.floor.toString() : '');
    setRoomType(room.roomType);
    setCapacity(room.capacity.toString());
    setMonthlyRent(room.monthlyRent.toString());
    setAc(room.ac);
    setAttachedBathroom(room.attachedBathroom);
    setBalcony(room.balcony);
    setFormError(null);
    setIsEditOpen(true);
  };

  const openDrawer = (room: Room) => {
    setSelectedRoom(room);
    setBedError(null);
    setEditingBedId(null);
    setIsDrawerOpen(true);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!roomNumber || !roomType || !capacity || !monthlyRent) {
      setFormError('Please fill in all required fields.');
      setFormLoading(false);
      return;
    }

    try {
      const room = await pb.collection('rooms').create({
        roomNumber,
        hostel,
        floor: floor ? parseInt(floor, 10) : null,
        roomType,
        capacity: parseInt(capacity, 10),
        monthlyRent: parseFloat(monthlyRent),
        ac,
        attachedBathroom,
        balcony
      });

      // Also create empty beds for this room based on capacity
      const cap = parseInt(capacity, 10);
      for(let i=1; i<=cap; i++) {
        await pb.collection('beds').create({
          room: room.id,
          bedLabel: `Bed ${i}`,
          status: 'vacant'
        });
      }

      setIsAddOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add room.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setFormError(null);
    setFormLoading(true);

    try {
      await pb.collection('rooms').update(selectedRoom.id, {
        roomNumber,
        hostel,
        floor: floor ? parseInt(floor, 10) : null,
        roomType,
        capacity: parseInt(capacity, 10),
        monthlyRent: parseFloat(monthlyRent),
        ac,
        attachedBathroom,
        balcony
      });
      setIsEditOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update room.');
    } finally {
      setFormLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const records = await pb.collection('residents').getFullList();
      setResidents(records as any);
    } catch (err) {
      console.error('Failed to fetch residents:', err);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      let rId = selectedResidentId;
      if (isResidentType === 'new') {
        if (!newResidentName) throw new Error('Resident name is required.');
        const resRecord = await pb.collection('residents').create({
          fullName: newResidentName,
          phone: newResidentPhone,
          email: newResidentEmail,
          idProofNumber: newResidentIdProof,
          emergencyContactName: newResidentEmergName,
          emergencyContactPhone: newResidentEmergPhone,
          status: 'active'
        });
        rId = resRecord.id;
      } else {
        if (!rId) throw new Error('Please select a resident.');
      }

      // Create Booking
      await pb.collection('bookings').create({
        resident: rId,
        bed: selectedBedId,
        checkInDate: checkInDate + ' 12:00:00.000Z',
        notes
      });

      // Update Bed status
      await pb.collection('beds').update(selectedBedId, { status: 'occupied' });

      setIsCheckInOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFormError(err.message || 'Check-in failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      await pb.collection('bookings').update(selectedBookingId, {
        checkOutDate: checkOutDate + ' 12:00:00.000Z'
      });
      
      const booking = await pb.collection('bookings').getOne(selectedBookingId);
      await pb.collection('beds').update(booking.bed, { status: 'vacant' });

      setIsCheckOutOpen(false);
      fetchRooms();
    } catch (err: any) {
      setFormError(err.message || 'Check-out failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const markBedVacant = async (bed: Bed) => {
    setBedError(null);
    try {
      await pb.collection('beds').update(bed.id, { status: 'vacant' });
      fetchRooms();
    } catch (err: any) {
      setBedError(err.message || 'Failed to update bed status.');
    }
  };

  const triggerDeleteConfirm = (room: Room) => {
    setRoomToDelete(room);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await pb.collection('rooms').delete(roomToDelete.id);
      setIsDeleteOpen(false);
      setRoomToDelete(null);
      fetchRooms();
      if (selectedRoom?.id === roomToDelete.id) {
        setIsDrawerOpen(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete room.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleBedStatus = async (bed: Bed) => {
    const nextStatus = bed.status === 'vacant' ? 'occupied' : 'vacant';
    try {
      await pb.collection('beds').update(bed.id, { status: nextStatus });
      fetchRooms();
    } catch (err: any) {
      setBedError(err.message || 'Failed to toggle bed status.');
    }
  };

  const startEditBedLabel = (bed: Bed) => {
    setEditingBedId(bed.id);
    setEditingBedLabel(bed.bedLabel);
    setBedError(null);
  };

  const saveBedLabel = async (bedId: string) => {
    if (!editingBedLabel.trim()) return;
    try {
      await pb.collection('beds').update(bedId, { bedLabel: editingBedLabel.trim() });
      setEditingBedId(null);
      fetchRooms();
    } catch (err: any) {
      setBedError(err.message || 'Failed to update bed label.');
    }
  };

  // Helper Vacancy Calculators
  const getHostelStats = (hostelName: string) => {
    const hostelRooms = rooms.filter(r => r.hostel === hostelName);
    let totalBeds = 0;
    let occupiedBeds = 0;
    hostelRooms.forEach(room => {
      totalBeds += room.beds.length;
      occupiedBeds += room.beds.filter(b => b.status === 'occupied').length;
    });
    return {
      roomsCount: hostelRooms.length,
      vacancies: totalBeds - occupiedBeds,
    };
  };

  const getFloorStats = (hostelName: string, floorNum: number) => {
    const floorRooms = rooms.filter(r => 
      r.hostel === hostelName && 
      (r.floor === floorNum || (floorNum === 0 && (r.floor === null || r.floor === undefined)))
    );
    let totalBeds = 0;
    let occupiedBeds = 0;
    floorRooms.forEach(room => {
      totalBeds += room.beds.length;
      occupiedBeds += room.beds.filter(b => b.status === 'occupied').length;
    });
    return {
      roomsCount: floorRooms.length,
      vacancies: totalBeds - occupiedBeds,
    };
  };

  // Extract floors inside selected hostel (map null to 0 for Ground Floor)
  const activeHostelFloors = activeHostel
    ? Array.from(
        new Set(
          rooms
            .filter((r) => r.hostel === activeHostel)
            .map((r) => (r.floor === null || r.floor === undefined ? 0 : r.floor))
        )
      ).sort((a, b) => a - b)
    : [];

  // Filtered rooms list for Level 3
  const activeRooms = rooms.filter(
    (r) => r.hostel === activeHostel && (r.floor === activeFloor || (activeFloor === 0 && r.floor === null))
  );

  return (
    <div className="p-8 space-y-8 min-h-full relative overflow-x-hidden">
      {/* Header & Breadcrumb trail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold mb-2">
            <span 
              onClick={() => { setActiveHostel(null); setActiveFloor(null); }}
              className="hover:text-primary-400 cursor-pointer transition-colors"
            >
              Hostels
            </span>
            {activeHostel && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span 
                  onClick={() => setActiveFloor(null)}
                  className="hover:text-primary-400 cursor-pointer transition-colors"
                >
                  {activeHostel}
                </span>
              </>
            )}
            {activeFloor !== null && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-300">{activeFloor === 0 ? 'Ground Floor' : `Floor ${activeFloor}`}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building className="w-6 h-6 text-primary-500" />
            <span>
              {!activeHostel 
                ? 'Hostel Selection' 
                : activeFloor === null 
                ? `${activeHostel} Floors` 
                : `${activeHostel} — Floor ${activeFloor}`}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeHostel && (
            <button
              onClick={() => {
                if (activeFloor !== null) {
                  setActiveFloor(null);
                } else {
                  setActiveHostel(null);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-slate-800 rounded-full border-t-primary-500 animate-spin"></div>
        </div>
      ) : (
        <>
          {/* LEVEL 1: HOSTELS OVERVIEW */}
          {!activeHostel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['Hostel 1', 'Hostel 2'].map((name) => {
                const { roomsCount, vacancies } = getHostelStats(name);
                return (
                  <div
                    key={name}
                    onClick={() => setActiveHostel(name)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/5 group flex items-center gap-6 relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-primary-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-primary-500 group-hover:text-primary-400 group-hover:border-primary-500/25 transition-all">
                      <Building className="w-10 h-10" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-100 group-hover:text-primary-400 transition-colors">
                        {name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-2">
                        <span>{roomsCount} Rooms</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <span className="text-emerald-400">{vacancies} Vacancies</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LEVEL 2: FLOORS GRID */}
          {activeHostel && activeFloor === null && (
            <div>
              {activeHostelFloors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 text-slate-400">
                  <Layers className="w-12 h-12 text-slate-600 mb-4" />
                  <span className="font-medium">No floors initialized in this hostel yet.</span>
                  <button onClick={openAddModal} className="text-primary-400 font-semibold hover:text-primary-300 text-sm mt-1.5 flex items-center gap-1">
                    <span>Add Room to initialize a floor</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeHostelFloors.map((floorNum) => {
                    const { roomsCount, vacancies } = getFloorStats(activeHostel, floorNum);
                    return (
                      <div
                        key={floorNum}
                        onClick={() => setActiveFloor(floorNum)}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-primary-400 transition-colors">
                              <Layers className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-200 group-hover:text-slate-100">{floorNum === 0 ? 'Ground Floor' : `Floor ${floorNum}`}</h4>
                              <span className="text-xs text-slate-500">{roomsCount} Rooms</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {vacancies} Vacant
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: ROOMS GRID */}
          {activeHostel && activeFloor !== null && (
            <div>
              {activeRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 text-slate-400">
                  <Home className="w-12 h-12 text-slate-600 mb-4" />
                  <span className="font-medium">No rooms on Floor {activeFloor} yet.</span>
                  <button onClick={openAddModal} className="text-primary-400 font-semibold hover:text-primary-300 text-sm mt-1.5 flex items-center gap-1">
                    <span>Create a room</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeRooms.map((room) => {
                    const totalBeds = room.beds.length;
                    const occupiedCount = room.beds.filter((b) => b.status === 'occupied').length;
                    const vacantCount = totalBeds - occupiedCount;
                    const isFull = occupiedCount === totalBeds && totalBeds > 0;

                    return (
                      <div
                        key={room.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-305 flex flex-col justify-between group shadow-lg hover:shadow-xl relative overflow-hidden"
                      >
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-primary-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {room.hostel} • {room.floor !== null && room.floor !== undefined ? (room.floor === 0 ? 'Ground Floor' : `Floor ${room.floor}`) : 'Ground Floor'}
                              </span>
                              <h3 className="text-xl font-bold text-slate-100 group-hover:text-primary-400 transition-colors">
                                Room {room.roomNumber}
                              </h3>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isFull 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            }`}>
                              {isFull ? 'Full' : `${vacantCount} Vacant`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/40">
                              <span className="text-[10px] text-slate-500 font-medium block">Room Type</span>
                              <span className="text-sm font-semibold text-slate-200 capitalize">{formatRoomType(room.roomType)}</span>
                            </div>
                            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/40">
                              <span className="text-[10px] text-slate-500 font-medium block">Monthly Rent</span>
                              <span className="text-sm font-semibold text-slate-200">₹{room.monthlyRent}</span>
                            </div>
                          </div>

                          {/* Amenities Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                              room.ac 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              <Snowflake className="w-2.5 h-2.5" />
                              {room.ac ? 'A/C' : 'Non A/C'}
                            </span>
                            {room.attachedBathroom && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-400 border-purple-500/20">
                                <Bath className="w-2.5 h-2.5" />
                                Bath
                              </span>
                            )}
                            {room.balcony && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border-amber-500/20">
                                <Wind className="w-2.5 h-2.5" />
                                Balcony
                              </span>
                            )}
                          </div>

                          {/* Mini Live Bed Mapping */}
                          <div className="mt-6 space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Live Bed Map</span>
                            <div className="flex flex-wrap gap-2 py-1.5 px-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
                              {room.beds.map((bed) => (
                                <div
                                  key={bed.id}
                                  title={`${bed.bedLabel}: ${bed.status}`}
                                  className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer ${
                                    bed.status === 'occupied' 
                                      ? 'bg-rose-500 shadow-sm shadow-rose-500/30' 
                                      : 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBedStatus(bed);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-800/60">
                          <button
                            onClick={() => openDrawer(room)}
                            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold hover:text-white transition-all text-center"
                          >
                            Manage Bed Map
                          </button>

                          <button
                            onClick={() => openEditModal(room)}
                            className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl border border-slate-800 hover:border-primary-500/20 transition-all"
                            title="Edit Room"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => triggerDeleteConfirm(room)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-800 hover:border-rose-500/20 transition-all"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ADD ROOM MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Plus className="text-primary-500 w-5 h-5" />
                <span>Add New Room</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Hostel *</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="Hostel 1">Hostel 1</option>
                  <option value="Hostel 2">Hostel 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Floor Number</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Room Sharing Configuration *</label>
                <select
                  value={roomType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoomType(val);
                    const opt = SHARING_OPTIONS.find(o => o.value === val);
                    if (opt) setCapacity(opt.capacity.toString());
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  {SHARING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Monthly Rent *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3000"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-2 pb-1">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Room Amenities</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={ac}
                      onChange={(e) => setAc(e.target.checked)}
                      className="rounded border-slate-700 text-primary-600 focus:ring-primary-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">A/C Room</span>
                  </label>

                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={attachedBathroom}
                      onChange={(e) => setAttachedBathroom(e.target.checked)}
                      className="rounded border-slate-700 text-primary-600 focus:ring-primary-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">Attached Bath</span>
                  </label>

                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={balcony}
                      onChange={(e) => setBalcony(e.target.checked)}
                      className="rounded border-slate-700 text-primary-600 focus:ring-primary-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">Balcony</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="text-primary-500 w-5 h-5" />
                <span>Edit Room details</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Hostel *</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="Hostel 1">Hostel 1</option>
                  <option value="Hostel 2">Hostel 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Floor Number</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Room Sharing Configuration *</label>
                <select
                  value={roomType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoomType(val);
                    const opt = SHARING_OPTIONS.find(o => o.value === val);
                    if (opt) setCapacity(opt.capacity.toString());
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  {SHARING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Monthly Rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3000"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-2 pb-1">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Room Amenities</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={ac}
                      onChange={(e) => setAc(e.target.checked)}
                      className="rounded border-slate-700 text-primary-600 focus:ring-primary-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">A/C Room</span>
                  </label>

                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={attachedBathroom}
                      onChange={(e) => setAttachedBathroom(e.target.checked)}
                      className="rounded border-slate-700 text-primary-600 focus:ring-primary-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">Attached Bath</span>
                  </label>

                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={balcony}
                      onChange={(e) => setBalcony(e.target.checked)}
                      className="rounded border-slate-700 text-primary-600 focus:ring-primary-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">Balcony</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOOKMYSHOW INTERACTIVE BED MAPPING SIDE DRAWER */}
      {isDrawerOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs">
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />

          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-screen shadow-2xl relative animate-slide-in-right">
            <div>
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Room {selectedRoom.roomNumber} Map</h3>
                  <span className="text-xs text-slate-400 capitalize">{selectedRoom.hostel} • {formatRoomType(selectedRoom.roomType)} • {selectedRoom.floor !== null && selectedRoom.floor !== undefined ? (selectedRoom.floor === 0 ? 'Ground Floor' : `Floor ${selectedRoom.floor}`) : 'Ground Floor'}</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Room Information</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/40 text-center">
                      <Layers className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-500 font-semibold block">Floor</span>
                      <span className="text-xs font-bold text-slate-200">{selectedRoom.floor !== null && selectedRoom.floor !== undefined && selectedRoom.floor !== 0 ? `Floor ${selectedRoom.floor}` : 'Ground Floor'}</span>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/40 text-center">
                      <Users className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-500 font-semibold block">Beds Capacity</span>
                      <span className="text-xs font-bold text-slate-200">{selectedRoom.capacity} Beds</span>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/40 text-center">
                      <IndianRupee className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-500 font-semibold block">Monthly Rent</span>
                      <span className="text-xs font-bold text-slate-200">₹{selectedRoom.monthlyRent}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      selectedRoom.ac 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800/40'
                    }`}>
                      <Snowflake className="w-3.5 h-3.5" />
                      {selectedRoom.ac ? 'Air Conditioned' : 'Non A/C'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      selectedRoom.attachedBathroom 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800/40'
                    }`}>
                      <Bath className="w-3.5 h-3.5" />
                      {selectedRoom.attachedBathroom ? 'Attached Bathroom' : 'No Attached Bath'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      selectedRoom.balcony 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800/40'
                    }`}>
                      <Wind className="w-3.5 h-3.5" />
                      {selectedRoom.balcony ? 'Balcony' : 'No Balcony'}
                    </span>
                  </div>
                </div>

                {bedError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{bedError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visual Bed Layout Mapping</h4>
                    
                    <div className="flex gap-3 text-[10px] font-semibold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                        <span>Vacant</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                        <span>Occupied</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-6 border border-slate-800 rounded-2xl">
                    {selectedRoom.beds.map((bed) => {
                      const isOccupied = bed.status === 'occupied';
                      const isEditing = editingBedId === bed.id;
                      const activeBooking = bed.bookings?.find(b => b.checkOutDate === null);

                      return (
                        <div
                          key={bed.id}
                          className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${
                            isOccupied
                              ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50 shadow-md shadow-rose-950/10'
                              : 'bg-emerald-950/15 border-emerald-500/25 hover:border-emerald-500/40 shadow-md shadow-emerald-950/10'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 mr-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingBedLabel}
                                    onChange={(e) => setEditingBedLabel(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none"
                                  />
                                  <button onClick={() => saveBedLabel(bed.id)} className="p-1 bg-primary-600 hover:bg-primary-500 rounded text-white">
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-semibold text-slate-200 truncate">{bed.bedLabel}</span>
                                  <button 
                                    onClick={() => startEditBedLabel(bed)} 
                                    className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              
                              <span className={`text-[9px] font-bold uppercase tracking-wider block mt-1 ${
                                isOccupied ? 'text-rose-400' : 'text-emerald-400'
                              }`}>
                                {bed.status}
                              </span>
                              {isOccupied && activeBooking?.expand?.resident && (
                                <span className="text-xs font-bold text-slate-100 block mt-1.5 truncate">
                                  {activeBooking.expand.resident.fullName}
                                </span>
                              )}
                            </div>

                            <BedIcon className={`w-8 h-8 shrink-0 transition-transform hover:scale-105 ${
                              isOccupied ? 'text-rose-400' : 'text-emerald-400'
                            }`} />
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            {isOccupied ? (
                              activeBooking ? (
                                <button
                                  onClick={() => {
                                    setSelectedBookingId(activeBooking.id);
                                    setCheckOutDate(new Date().toISOString().split('T')[0]);
                                    setFormError(null);
                                    setIsCheckOutOpen(true);
                                  }}
                                  className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-[10px] font-bold tracking-wider transition-colors"
                                >
                                  Check-Out
                                </button>
                              ) : (
                                <div className="flex gap-1.5 w-full">
                                  <button
                                    onClick={() => {
                                      setSelectedBedId(bed.id);
                                      setIsResidentType('new');
                                      setSelectedResidentId('');
                                      setNewResidentName('');
                                      setNewResidentPhone('');
                                      setNewResidentEmail('');
                                      setNewResidentIdProof('');
                                      setNewResidentEmergName('');
                                      setNewResidentEmergPhone('');
                                      setCheckInDate(new Date().toISOString().split('T')[0]);
                                      setNotes('');
                                      setFormError(null);
                                      fetchResidents();
                                      setIsCheckInOpen(true);
                                    }}
                                    className="flex-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-[9px] font-bold tracking-wider transition-colors text-center font-semibold"
                                  >
                                    Check-In
                                  </button>
                                  <button
                                    onClick={() => markBedVacant(bed)}
                                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700/60 rounded-lg text-[9px] font-bold tracking-wider transition-colors text-center font-semibold"
                                  >
                                    Mark Vacant
                                  </button>
                                </div>
                              )
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBedId(bed.id);
                                  setIsResidentType('new');
                                  setSelectedResidentId('');
                                  setNewResidentName('');
                                  setNewResidentPhone('');
                                  setNewResidentEmail('');
                                  setNewResidentIdProof('');
                                  setNewResidentEmergName('');
                                  setNewResidentEmergPhone('');
                                  setCheckInDate(new Date().toISOString().split('T')[0]);
                                  setNotes('');
                                  setFormError(null);
                                  fetchResidents();
                                  setIsCheckInOpen(true);
                                }}
                                className="py-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold tracking-wider transition-colors"
                              >
                                Check-In
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BED CHECK-IN MODAL */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Check-In Resident to Bed
              </h3>
              <button onClick={() => setIsCheckInOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsResidentType('new')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isResidentType === 'new'
                      ? 'bg-slate-850 text-slate-200'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  New Resident
                </button>
                <button
                  type="button"
                  onClick={() => setIsResidentType('existing')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isResidentType === 'existing'
                      ? 'bg-slate-850 text-slate-200'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Existing Resident
                </button>
              </div>

              {isResidentType === 'existing' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Select Resident *</label>
                  <select
                    required
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">-- Select Resident --</option>
                    {residents.map(res => (
                      <option key={res.id} value={res.id}>
                        {res.fullName} {res.phone ? `(${res.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Rahul Kumar"
                      value={newResidentName}
                      onChange={(e) => setNewResidentName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 block">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={newResidentPhone}
                        onChange={(e) => setNewResidentPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={newResidentEmail}
                        onChange={(e) => setNewResidentEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">ID Proof Number</label>
                    <input
                      type="text"
                      placeholder="Aadhaar/Passport/PAN"
                      value={newResidentIdProof}
                      onChange={(e) => setNewResidentIdProof(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="border-t border-slate-850 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Emergency Contact</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">Contact Name</label>
                        <input
                          type="text"
                          placeholder="Father's Name"
                          value={newResidentEmergName}
                          onChange={(e) => setNewResidentEmergName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 block">Contact Phone</label>
                        <input
                          type="tel"
                          placeholder="9876500000"
                          value={newResidentEmergPhone}
                          onChange={(e) => setNewResidentEmergPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Check-in Date *</label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Booking Notes</label>
                <textarea
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? 'Checking in...' : 'Perform Check-In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BED CHECK-OUT MODAL */}
      {isCheckOutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <X className="w-5 h-5 text-rose-500" />
                Check-Out Resident
              </h3>
              <button onClick={() => setIsCheckOutOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCheckOutSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-300">
                Are you sure you want to perform check-out for this resident? The bed occupancy status will revert to vacant.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Check-out Date *</label>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all mt-6 shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2"
              >
                {formLoading ? 'Checking out...' : 'Confirm Check-Out'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-100">Delete Room {roomToDelete.roomNumber}</h3>
                <p className="text-sm text-slate-400">
                  Are you sure you want to delete this room? This will permanently remove all associated beds and cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => { setIsDeleteOpen(false); setRoomToDelete(null); }}
                className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-850 text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-500/10 flex items-center justify-center"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
