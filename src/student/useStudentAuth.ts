import { useState, useEffect, useCallback } from 'react';
import pb from '../api/client';
import type { Resident } from '../types';

const STUDENT_STORAGE_KEY = 'satabdi_student_session';

export interface StudentAuthCheck {
  exists: boolean;
  resident?: Resident;
  isFirstLogin: boolean;
  error?: string;
}

export function useStudentAuth() {
  const [student, setStudent] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize phone number (strip +91, spaces, dashes)
  const cleanPhone = (phone: string): string => {
    return phone.replace(/[^0-9]/g, '').replace(/^91/, '');
  };

  // Fetch full student record with bookings, beds, and rooms
  const fetchFullStudentRecord = async (residentId: string): Promise<Resident> => {
    return await pb.collection('residents').getOne(residentId, {
      expand: 'bookings_via_resident,bookings_via_resident.bed,bookings_via_resident.bed.room'
    }) as unknown as Resident;
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(STUDENT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) {
            const fresh = await fetchFullStudentRecord(parsed.id);
            setStudent(fresh);
            localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(fresh));
          }
        }
      } catch (err) {
        console.warn('Failed to restore student session:', err);
        localStorage.removeItem(STUDENT_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Check phone existence and first login status
  const checkPhone = async (phone: string): Promise<StudentAuthCheck> => {
    const raw = cleanPhone(phone);
    if (!raw || raw.length < 10) {
      return { exists: false, isFirstLogin: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    try {
      // Find resident whose phone contains this number
      const records = await pb.collection('residents').getFullList({
        filter: `phone ~ "${raw}" || phone ~ "+91${raw}"`,
        expand: 'bookings_via_resident,bookings_via_resident.bed,bookings_via_resident.bed.room'
      });

      if (!records || records.length === 0) {
        return {
          exists: false,
          isFirstLogin: false,
          error: `Mobile number (+91 ${raw}) is not registered in hostel records. Please contact the hostel admin.`
        };
      }

      const resident = records[0] as unknown as Resident;
      const isFirstLogin = !resident.portalActivated || !resident.portalPassword || resident.portalPassword.trim() === '';

      return {
        exists: true,
        resident,
        isFirstLogin
      };
    } catch (err: any) {
      return {
        exists: false,
        isFirstLogin: false,
        error: err.message || 'Network error checking phone number.'
      };
    }
  };

  // First Login: Set password and activate portal
  const setupFirstLoginPassword = async (residentId: string, newPassword: string): Promise<Resident> => {
    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const trimmed = newPassword.trim();
    await pb.collection('residents').update(residentId, {
      portalPassword: trimmed,
      portalActivated: true,
      portalLastLogin: new Date().toISOString()
    });

    const updated = await fetchFullStudentRecord(residentId);
    setStudent(updated);
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  // Returning Student Login
  const loginWithPhone = async (phone: string, password: string): Promise<Resident> => {
    setError(null);
    const check = await checkPhone(phone);

    if (!check.exists || !check.resident) {
      const msg = check.error || 'Mobile number not found.';
      setError(msg);
      throw new Error(msg);
    }

    const resident = check.resident;

    // Check first login
    if (check.isFirstLogin) {
      throw new Error('FIRST_LOGIN_REQUIRED');
    }

    // Verify password
    if (resident.portalPassword !== password.trim()) {
      const msg = 'Incorrect password. If you forgot your password, contact the hostel admin.';
      setError(msg);
      throw new Error(msg);
    }

    // Update last login
    try {
      await pb.collection('residents').update(resident.id, {
        portalLastLogin: new Date().toISOString()
      });
    } catch {
      // Non-blocking
    }

    const fullRecord = await fetchFullStudentRecord(resident.id);
    setStudent(fullRecord);
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(fullRecord));
    return fullRecord;
  };

  // Change Password from inside the student app
  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (!student) throw new Error('Not logged in.');
    if (student.portalPassword && student.portalPassword !== oldPassword.trim()) {
      throw new Error('Current password does not match.');
    }
    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    await pb.collection('residents').update(student.id, {
      portalPassword: newPassword.trim()
    });

    const refreshed = await fetchFullStudentRecord(student.id);
    setStudent(refreshed);
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(refreshed));
  };

  // Refresh student data (e.g. after booking, payment, leave update)
  const refreshStudent = useCallback(async () => {
    if (!student?.id) return;
    try {
      const refreshed = await fetchFullStudentRecord(student.id);
      setStudent(refreshed);
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(refreshed));
    } catch (err) {
      console.warn('Could not refresh student data:', err);
    }
  }, [student?.id]);

  // Logout
  const logout = () => {
    setStudent(null);
    localStorage.removeItem(STUDENT_STORAGE_KEY);
  };

  return {
    student,
    loading,
    error,
    setError,
    checkPhone,
    setupFirstLoginPassword,
    loginWithPhone,
    changePassword,
    refreshStudent,
    logout
  };
}

