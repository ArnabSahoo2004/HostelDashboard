export interface Settings {
  id: string;
  hostelName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  rentDueDate: string;
  lateFeeAmount: string;
  whatsappApiKey: string;
  whatsappPhoneNumberId?: string;
  adminEmail: string;
  created: string;
}

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
  roomType: string;
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
  status: string;
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
  // Feature 3: Item tracking
  hasAlmirahKey?: boolean;
  hasPunchcard?: boolean;
  hasRoomKey?: boolean;
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
  rentAmount: number;
  electricityAmount: number;
  foodAmount: number;
  fineAmount: number;
  amount: number; // This acts as totalAmount
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  created: string;
  expand?: any;
}

export interface ElectricityBill {
  id: string;
  room: string;
  billingMonth: string;
  previousReading?: number; // legacy
  currentReading?: number;  // legacy
  ratePerUnit?: number;     // legacy
  meters?: Array<{
    name: string;
    previousReading: number;
    currentReading: number;
    ratePerUnit: number;
    amount: number;
    isFirstTime?: boolean;
  }>;
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
  status: string;
  reportedDate: string;
  resolvedDate?: string | null;
  createdAt: string;
}

export interface EntryLog {
  id: string;
  resident: string;
  timestamp: string;
  type: string;
  method: string;
  created: string;
  expand?: any;
}

// ── Feature 1 — Payment Reminders ──────────────────────────────
export interface Notification {
  id: string;
  resident: string;
  payment: string;
  message: string;
  sentAt: string;
  channel: 'whatsapp' | 'sms';
  status: 'sent' | 'failed';
  created: string;
  expand?: any;
}

// ── Feature 2 — Leave Notices ───────────────────────────────────
export interface LeaveNotice {
  id: string;
  resident: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  created: string;
  expand?: any;
}

// ── Feature 4 — Home Going Notices ─────────────────────────────
export interface HomeNotice {
  id: string;
  resident: string;
  departureDate: string;
  returnDate: string;
  destination: string;
  contactDuringLeave?: string;
  status: 'active' | 'returned';
  created: string;
  expand?: any;
}

// ── Feature 5 — Fines ──────────────────────────────────────────
export interface Fine {
  id: string;
  resident: string;
  amount: number;
  reason: string;
  category: 'noise' | 'damage' | 'late_return' | 'rule_violation' | 'other';
  fineDate: string;
  status: 'pending' | 'paid' | 'waived';
  created: string;
  expand?: any;
}

// ── Feature 5 — Caution Deposits ───────────────────────────────
export interface CautionDeposit {
  id: string;
  resident: string;
  amount: number;
  depositDate: string;
  status: 'held' | 'refunded' | 'forfeited';
  refundAmount?: number;
  refundDate?: string;
  deductedFines?: number;
  notes?: string;
  created: string;
  expand?: any;
}
