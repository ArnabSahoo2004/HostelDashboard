import React, { useState } from 'react';
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

// Student Portal Components
import StudentLogin from './student/StudentLogin';
import StudentAppLayout from './student/StudentAppLayout';
import StudentHome from './student/pages/StudentHome';
import StudentDues from './student/pages/StudentDues';
import StudentServices from './student/pages/StudentServices';
import StudentIDCard from './student/pages/StudentIDCard';
import StudentProfile from './student/pages/StudentProfile';

const App: React.FC = () => {
  const { admin, loading, error, login, logout, clearError } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Router>
      <Routes>
        {/* ========================================================
            STUDENT MOBILE APP (CAPACITOR READY) ROUTES
           ======================================================== */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student" element={<StudentAppLayout />}>
          <Route index element={<StudentHome />} />
          <Route path="dues" element={<StudentDues />} />
          <Route path="services" element={<StudentServices />} />
          <Route path="id" element={<StudentIDCard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Route>

        {/* Public Admin Login Route */}
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

        {/* Public Maintenance Report Route */}
        <Route path="/report-issue" element={<PublicMaintenance />} />

        {/* ========================================================
            PROTECTED CORE ADMIN DASHBOARD SHELL
           ======================================================== */}
        <Route
          path="/*"
          element={
            <ProtectedRoute admin={admin} loading={loading}>
              <div className="flex min-h-screen bg-slate-950 text-slate-100">
                <Sidebar
                  onLogout={logout}
                  isOpen={mobileMenuOpen}
                  onClose={() => setMobileMenuOpen(false)}
                />
                <div className="flex-grow flex flex-col min-w-0">
                  <Navbar
                    admin={admin}
                    onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
                  />
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
