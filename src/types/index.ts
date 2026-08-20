export interface Admin {
  id: string;
  email: string;
  created?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  hostel: string;
  floor?: number | null;
  roomType: string; // 'single' | 'double' | 'dorm'
  capacity: number;
  monthlyRent: number;
  ac: boolean;
  attachedBathroom: boolean;
  balcony: boolean;
  created: string;
  beds: Bed[];
}

export interface Bed {
  id: string;
  room: string;
  bedLabel: string;
  status: string; // 'vacant' | 'occupied'
  created: string;
  bookings?: Booking[];
  expand?: any;
}

export interface Resident {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  idProofNumber?: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  localGuardianName?: string;
  localGuardianPhone?: string;
  localGuardianRelation?: string;
  occupation?: string;
  status: 'active' | 'checked_out';
  created: string;
  expand?: any;
}

export interface Booking {
  id: string;
  resident: string;
  bed: string;
  checkInDate: string;
  checkOutDate?: string | null;
  notes?: string | null;
  created: string;
  expand?: any;
}

export interface Payment {
  id: string;
  resident: string;
  booking: string;
  monthFor: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  paymentType?: 'rent' | 'electricity' | 'other';
  status: 'paid' | 'pending' | 'overdue';
  created: string;
  expand?: any;
}

export interface ElectricityBill {
  id: string;
  room: string;
  billingMonth: string;
  previousReading?: number;
  currentReading?: number;
  ratePerUnit?: number;
  totalAmount: number;
  dueDate: string;
  status: 'draft' | 'split_and_billed';
  created: string;
  expand?: any;
}

export interface DashboardStats {
  hostelsCount: number;
  roomsCount: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  expectedRent: number;
  collectedRent: number;
  pendingRent: number;
  overdueCount: number;
  recentPayments: Payment[];
  recentBookings: (Booking & { resident: Resident; bed: Bed & { room: Room } })[];
  recentEntries: EntryLog[];
}

export interface MaintenanceRequest {
  id: string;
  roomId: string;
  description: string;
  status: string; // 'open' | 'in_progress' | 'resolved'
  reportedDate: string;
  resolvedDate?: string | null;
  createdAt: string;
}

export interface EntryLog {
  id: string;
  resident: string;
  timestamp: string;
  type: string; // 'Entry' | 'Exit'
  method: string; // 'Face' | 'Fingerprint' | 'Card' | 'Manual'
  created: string;
  expand?: any;
}
