import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Residents from './pages/Residents';
import Payments from './pages/Payments';
import WhatsApp from './pages/WhatsApp';
import Settings from './pages/Settings';

import Maintenance from './pages/Maintenance';
import PublicMaintenance from './pages/PublicMaintenance';
import Notices from './pages/Notices';
import FinesDeposits from './pages/FinesDeposits';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

const App: React.FC = () => {
  const { admin, loading, error, login, logout, clearError } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            admin ? (
              <Navigate to="/" replace />
            ) : (
              <Login login={login} error={error} clearError={clearError} />
            )
          }
        />

        {/* Public Maintenance Route */}
        <Route path="/report-issue" element={<PublicMaintenance />} />

        {/* Protected Core Dashboard Shell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute admin={admin} loading={loading}>
              <div className="flex min-h-screen bg-slate-950 text-slate-100">
                <Sidebar onLogout={logout} />
                <div className="flex-grow flex flex-col min-w-0">
                  <Navbar admin={admin} />
                  <main className="flex-1 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/residents" element={<Residents />} />
                      <Route path="/payments" element={<Payments />} />

                      <Route path="/whatsapp" element={<WhatsApp />} />
                      <Route path="/maintenance" element={<Maintenance />} />
                      <Route path="/notices" element={<Notices />} />
                      <Route path="/fines" element={<FinesDeposits />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
