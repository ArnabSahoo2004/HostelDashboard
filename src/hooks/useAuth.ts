import { useState, useEffect } from 'react';
import pb from '../api/client';
import type { Admin } from '../types';

export const useAuth = () => {
  const [admin, setAdmin] = useState<Admin | null>(pb.authStore.record as unknown as Admin | null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync state with pb.authStore initially
    setAdmin(pb.authStore.record as unknown as Admin | null);

    // Subscribe to auth state changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setAdmin(model as unknown as Admin | null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // In PB, admin auth is either via superusers or a custom 'admins' collection.
      // We created the account as a superuser earlier.
      // Superusers use authWithPassword on the '_superusers' collection.
      await pb.collection('_superusers').authWithPassword(email, password);
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return {
    admin,
    loading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  };
};
