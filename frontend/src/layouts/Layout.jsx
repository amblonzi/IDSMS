import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, BookOpen, Calendar, Car, CreditCard } from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ icon: Icon, label, path }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(path);

    return (
        <Link
            to={path}
            className={clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1",
                isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
            )}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </Link>
    );
};

export default function Layout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-primary">IDSMS</h1>
                    <p className="text-xs text-gray-400 mt-1">Driving School System</p>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" />
                    <SidebarItem icon={Users} label="Users" path="/users" />
                    <SidebarItem icon={BookOpen} label="Courses" path="/courses" />
                    <SidebarItem icon={Calendar} label="Schedule" path="/schedule" />
                    <SidebarItem icon={Car} label="Fleet" path="/vehicles" />
                    <SidebarItem icon={CreditCard} label="Payments" path="/payments" />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user?.full_name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role || 'Student'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
