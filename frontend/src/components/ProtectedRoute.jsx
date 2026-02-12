import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}
