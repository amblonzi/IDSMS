import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * RoleProtectedRoute Component
 * Protects routes based on user roles
 * 
 * @param {React.ReactNode} children - Child components to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string} redirectTo - Where to redirect unauthorized users (default: /dashboard)
 */
export default function RoleProtectedRoute({ children, allowedRoles, redirectTo = '/dashboard' }) {
    const { user } = useAuth();

    // Normalize user role to lowercase for case-insensitive comparison
    const userRole = user?.role?.toLowerCase();

    // Check if user's role is in the allowed roles list
    const isAuthorized = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!isAuthorized) {
        console.warn(`Access denied: User role "${userRole}" not in allowed roles [${allowedRoles.join(', ')}]`);
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}
