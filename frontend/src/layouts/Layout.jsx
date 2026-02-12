import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    LogOut, LayoutDashboard, Users, BookOpen, Calendar,
    Car, CreditCard, ClipboardCheck, BarChart3,
    FileText, Settings as SettingsIcon, Bell,
    Search, User as UserIcon, Menu, X, ChevronRight, UserPlus, CheckCircle, ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const SidebarItem = ({ icon: Icon, label, path, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <Link
            to={path}
            onClick={onClick}
            className={clsx(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group mb-1",
                isActive
                    ? "bg-primary text-white shadow-md shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary"
            )}
        >
            <div className="flex items-center space-x-3">
                <Icon size={20} className={clsx("transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                <span className="font-semibold text-sm">{label}</span>
            </div>
            {isActive && <ChevronRight size={14} className="opacity-70" />}
        </Link>
    );
};

export default function Layout() {
    const { logout, user } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Role check helpers
    const userRole = user?.role?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'manager';
    const isStaff = isAdmin || userRole === 'instructor';

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.startsWith('/students')) return 'Student Management';
        if (path.startsWith('/staff')) return 'Staff Management';
        if (path.startsWith('/courses')) return 'Course Catalog';
        if (path.startsWith('/schedule')) return 'Lesson Schedule';
        if (path.startsWith('/vehicles')) return 'Fleet Management';
        if (path.startsWith('/payments')) return 'Financial Records';
        if (path.startsWith('/admin/settings')) return 'System Settings';
        if (path.startsWith('/admin/dashboard')) return 'Analytics';
        if (path.startsWith('/admin/reports')) return 'Reports';
        return 'IDSMS';
    };

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white premium-sidebar transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Car size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 leading-tight">
                                    {settings?.school_name || 'IDSMS'}
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management System</p>
                            </div>
                        </div>
                        <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-1 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Main Navigation
                    </div>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto space-y-1 pb-8 custom-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" onClick={() => setSidebarOpen(false)} />

                    {isStaff && (
                        <SidebarItem icon={Users} label="Students" path="/students" onClick={() => setSidebarOpen(false)} />
                    )}

                    {isAdmin && (
                        <SidebarItem icon={ShieldCheck} label="Staff Management" path="/staff" onClick={() => setSidebarOpen(false)} />
                    )}

                    {isStaff && (
                        <SidebarItem icon={UserPlus} label="Add Student" path="/students/add" onClick={() => setSidebarOpen(false)} />
                    )}

                    {!isStaff && userRole === 'student' && (
                        <SidebarItem icon={CheckCircle} label="Onboarding" path="/onboarding" onClick={() => setSidebarOpen(false)} />
                    )}

                    <SidebarItem icon={BookOpen} label="Courses" path="/courses" onClick={() => setSidebarOpen(false)} />
                    <SidebarItem icon={Calendar} label="Schedule" path="/schedule" onClick={() => setSidebarOpen(false)} />

                    {isAdmin && (
                        <SidebarItem icon={Car} label="Fleet Status" path="/vehicles" onClick={() => setSidebarOpen(false)} />
                    )}

                    {!isStaff && userRole === 'student' && (
                        <SidebarItem icon={ClipboardCheck} label="Assessments" path="/assessments" onClick={() => setSidebarOpen(false)} />
                    )}
                    <SidebarItem icon={CreditCard} label="Payments" path="/payments" onClick={() => setSidebarOpen(false)} />

                    {/* Admin Section */}
                    {isAdmin && (
                        <>
                            <div className="mt-8 mb-4 px-4">
                                <div className="h-px bg-slate-100 w-full mb-6"></div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Administration</p>
                            </div>
                            <SidebarItem icon={BarChart3} label="Analytics" path="/admin/dashboard" onClick={() => setSidebarOpen(false)} />
                            <SidebarItem icon={FileText} label="System Reports" path="/admin/reports" onClick={() => setSidebarOpen(false)} />
                            <SidebarItem icon={SettingsIcon} label="Settings" path="/admin/settings" onClick={() => setSidebarOpen(false)} />
                        </>
                    )}
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Help Center</p>
                        <p className="text-xs text-slate-600 mb-3">Need assistance with the system?</p>
                        <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            Contact Support
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header / Navbar */}
                <header className="h-20 glass sticky top-0 z-30 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center space-x-4">
                        <button
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h2>
                            <p className="text-xs text-slate-400 md:block hidden">Driving School Management Console</p>
                        </div>
                    </div>

                    {/* Search Bar - Desktop Only */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>

                        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                        {/* User Profile Dropdown Placeholder (Simple for now) */}
                        <div className="flex items-center space-x-3 pl-1">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.full_name || 'User Name'}</p>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{user?.role || 'User'}</p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden group-hover:border-primary transition-colors">
                                    {user?.full_name?.[0] || <UserIcon size={20} />}
                                </div>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                                    <div className="px-4 py-2 border-b border-slate-50 mb-1 lg:hidden">
                                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.full_name}</p>
                                        <p className="text-[10px] font-bold text-primary uppercase">{user?.role}</p>
                                    </div>
                                    <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors">
                                        <UserIcon size={16} />
                                        <span>My Profile</span>
                                    </Link>
                                    <Link to="/admin/settings" className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors">
                                        <SettingsIcon size={16} />
                                        <span>Settings</span>
                                    </Link>
                                    <div className="h-px bg-slate-50 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                                    >
                                        <LogOut size={16} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid */}
                <main className="flex-1 overflow-auto p-4 md:p-8 animate-slide-in custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
