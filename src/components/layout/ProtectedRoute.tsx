import React from 'react';
import { Navigate } from 'react-router-dom';
import type { Admin } from '../../types';

interface ProtectedRouteProps {
  admin: Admin | null;
  loading: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ admin, loading, children }) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-800 rounded-full border-t-primary-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
