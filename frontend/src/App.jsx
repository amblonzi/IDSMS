import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './layouts/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import Payments from './pages/Payments';
import Vehicles from './pages/Vehicles';
import Assessments from './pages/Assessments';
import AddStudent from './pages/AddStudent';
import ProfileComplete from './pages/ProfileComplete';
import StudentOnboarding from './pages/StudentOnboarding';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              {/* Registration removed - Admin only */}

              {/* Standalone Protected Routes (no Layout wrapper) */}
              <Route
                path="/profile/complete"
                element={
                  <ProtectedRoute>
                    <ProfileComplete />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes with Layout */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Profile Routes */}
                <Route path="/profile" element={<Profile />} />

                {/* Management Routes */}
                <Route path="/users" element={<Navigate to="/students" replace />} />
                <Route
                  path="/students"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'manager', 'instructor']}>
                      <Students />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Staff />
                    </RoleProtectedRoute>
                  }
                />
                <Route path="/courses" element={<Courses />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/onboarding" element={<StudentOnboarding />} />

                {/* Admin-Only Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Reports />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Settings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/students/add"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'manager', 'instructor']}>
                      <AddStudent />
                    </RoleProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
