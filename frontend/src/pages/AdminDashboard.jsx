import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import analyticsService from '../services/analyticsService';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import {
    Users, BookOpen, Calendar, CreditCard, TrendingUp,
    Clock, AlertCircle, Car, DollarSign, Award
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, trend, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {trend !== undefined && trend !== null && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : trend < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
);

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [enrollmentData, setEnrollmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all dashboard data
                const [dashboardStats, revenueAnalytics, enrollmentTrends] = await Promise.all([
                    analyticsService.getDashboardStats(),
                    analyticsService.getRevenueAnalytics(),
                    analyticsService.getEnrollmentTrends()
                ]);

                setStats(dashboardStats);
                setRevenueData(revenueAnalytics);
                setEnrollmentData(enrollmentTrends);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertCircle className="mx-auto text-red-600 mb-2" size={48} />
                <p className="text-red-800 font-semibold">{error}</p>
            </div>
        );
    }

    if (!stats) return null;

    // Calculate revenue trend
    const revenueTrend = stats.revenue.last_month > 0
        ? Math.round(((stats.revenue.this_month - stats.revenue.last_month) / stats.revenue.last_month) * 100)
        : 0;

    // Prepare chart data
    const revenueChartData = revenueData?.trend_data?.map(item => ({
        date: format(new Date(item.date), 'MMM dd'),
        amount: item.amount,
        count: item.count
    })) || [];

    const enrollmentChartData = enrollmentData?.trend_data?.map(item => ({
        month: item.date,
        count: item.count
    })) || [];

    const lessonStatusData = [
        { name: 'Scheduled', value: stats.lessons.scheduled },
        { name: 'Completed', value: stats.lessons.completed },
        { name: 'Cancelled', value: stats.lessons.cancelled },
        { name: 'No Show', value: stats.lessons.no_show }
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || user?.email}! Here's your school overview.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={DollarSign}
                    label="Total Revenue"
                    value={`KES ${stats.revenue.total.toLocaleString()}`}
                    color="bg-emerald-500"
                    trend={revenueTrend}
                    subtitle={`KES ${stats.revenue.this_month.toLocaleString()} this month`}
                />
                <StatCard
                    icon={Users}
                    label="Total Students"
                    value={stats.users.student}
                    color="bg-blue-500"
                    subtitle={`${stats.users.total} total users`}
                />
                <StatCard
                    icon={BookOpen}
                    label="Active Enrollments"
                    value={stats.enrollments.active}
                    color="bg-purple-500"
                    subtitle={`${stats.enrollments.total} total enrollments`}
                />
                <StatCard
                    icon={Calendar}
                    label="Scheduled Lessons"
                    value={stats.lessons.scheduled}
                    color="bg-orange-500"
                    subtitle={`${stats.lessons.completed} completed`}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Award}
                    label="Instructors"
                    value={stats.users.instructor}
                    color="bg-indigo-500"
                />
                <StatCard
                    icon={Car}
                    label="Active Vehicles"
                    value={stats.vehicles.active}
                    color="bg-cyan-500"
                    subtitle={`${stats.vehicles.maintenance_due} need maintenance`}
                />
                <StatCard
                    icon={CreditCard}
                    label="Pending Payments"
                    value={`KES ${stats.revenue.pending.toLocaleString()}`}
                    color="bg-amber-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Revenue Trend</h3>
                        <span className="text-xs text-gray-500">Last 30 days</span>
                    </div>
                    {revenueChartData.length > 0 ? (
                        <LineChart
                            data={revenueChartData}
                            xKey="date"
                            yKey="amount"
                            color="#10b981"
                            height={250}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No revenue data available
                        </div>
                    )}
                </div>

                {/* Enrollment Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Enrollment Trend</h3>
                        <span className="text-xs text-gray-500">By month</span>
                    </div>
                    {enrollmentChartData.length > 0 ? (
                        <BarChart
                            data={enrollmentChartData}
                            xKey="month"
                            yKey="count"
                            color="#3b82f6"
                            height={250}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No enrollment data available
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lesson Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Lesson Status</h3>
                    {lessonStatusData.length > 0 ? (
                        <PieChart
                            data={lessonStatusData}
                            nameKey="name"
                            valueKey="value"
                            height={250}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No lesson data available
                        </div>
                    )}
                </div>

                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Recent Activities</h3>
                        <span className="text-xs text-gray-500">{stats.recent_activities.length} activities</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        {stats.recent_activities.length > 0 ? (
                            stats.recent_activities.map((activity) => (
                                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg ${activity.type === 'enrollment' ? 'bg-blue-50 text-blue-600' :
                                                activity.type === 'payment' ? 'bg-green-50 text-green-600' :
                                                    'bg-purple-50 text-purple-600'
                                            }`}>
                                            {activity.type === 'enrollment' ? <BookOpen size={20} /> :
                                                activity.type === 'payment' ? <CreditCard size={20} /> :
                                                    <Calendar size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                                            <p className="text-xs text-gray-400">
                                                {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activity.type === 'enrollment' ? 'bg-blue-50 text-blue-600' :
                                            activity.type === 'payment' ? 'bg-green-50 text-green-600' :
                                                'bg-purple-50 text-purple-600'
                                        }`}>
                                        {activity.type}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">No recent activities</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {(stats.vehicles.maintenance_due > 0 || stats.revenue.pending > 0) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Alerts & Notifications</h3>
                    <div className="space-y-3">
                        {stats.vehicles.maintenance_due > 0 && (
                            <div className="flex items-start space-x-3 p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
                                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">Maintenance Required</p>
                                    <p className="text-xs opacity-80">
                                        {stats.vehicles.maintenance_due} vehicle{stats.vehicles.maintenance_due > 1 ? 's' : ''} need{stats.vehicles.maintenance_due === 1 ? 's' : ''} service soon.
                                    </p>
                                </div>
                            </div>
                        )}
                        {stats.revenue.pending > 0 && (
                            <div className="flex items-start space-x-3 p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                <TrendingUp size={20} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">Pending Payments</p>
                                    <p className="text-xs opacity-80">
                                        KES {stats.revenue.pending.toLocaleString()} in pending payments to follow up.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
