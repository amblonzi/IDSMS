import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';
import Login from './pages/Login';

import Users from './pages/Users';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import Payments from './pages/Payments';

// Placeholder Pages for now
const Dashboard = () => <h2 className="text-2xl font-bold">Dashboard</h2>;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/payments" element={<Payments />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}
