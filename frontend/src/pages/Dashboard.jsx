import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analytics';
import { lessonService } from '../services/lessonService';
import { Users, BookOpen, Calendar, CreditCard, TrendingUp, Clock, AlertCircle, RefreshCw, Activity, DollarSign, UserPlus, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { RevenueChart, EnrollmentChart, SparklineChart } from '../components/DashboardCharts';

// Mock data generator for sparklines (since backend doesn't provide history yet)
const generateSparklineData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: Math.floor(Math.random() * 50) + 10
    }));
};

const StatCard = ({ icon: Icon, label, value, color, trend, trendLabel, sparklineData }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden">
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-white`} aria-hidden="true">
                <Icon size={20} className={color.replace('bg-', 'text-')} />
            </div>
        </div>

        <div className="flex items-center justify-between mt-4 z-10">
            {trend !== undefined && trend !== null && (
                <div className="flex items-center space-x-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
                </div>
            )}
        </div>

        {/* Sparkline Background */}
        <div className="absolute bottom-0 right-0 w-32 h-16 opacity-20 pointer-events-none">
            {sparklineData && <SparklineChart data={sparklineData} color={color === 'bg-blue-500' ? '#3B82F6' : color === 'bg-emerald-500' ? '#10B981' : color === 'bg-purple-500' ? '#8B5CF6' : '#F97316'} />}
        </div>
    </div>
);

const ActivityItem = ({ activity }) => {
    const isPayment = activity.type === 'payment';
    const Icon = isPayment ? DollarSign : UserPlus;
    const colorClass = isPayment ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600';

    return (
        <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg group">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition`}>
                    <Icon size={16} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        users: 0,
        enrollments: 0,
        lessons: 0,
        revenue: 0,
        recentActivity: [], // For admins: mixed activities
        recentLessons: [], // For students: just lessons
        trends: { users: 0, enrollments: 0, lessons: 0, revenue: 0 },
        charts: { revenue: [], enrollments: [] }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const userRole = user?.role?.toLowerCase();
        if (userRole === 'student') {
            fetchStudentStats();
        } else if (userRole === 'instructor') {
            navigate('/instructor/dashboard');
        } else {
            fetchStats();
        }
    }, [user, navigate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await analyticsService.getDashboardStats();

            let revenueTrend = 0;
            if (data.revenue && data.revenue.last_month > 0) {
                revenueTrend = Math.round(((data.revenue.this_month - data.revenue.last_month) / data.revenue.last_month) * 100);
            } else if (data.revenue && data.revenue.this_month > 0) {
                revenueTrend = 100;
            }

            // Mock Chart Data (Backend integration placeholder)
            const revenueData = [
                { name: 'Jan', value: 4000 },
                { name: 'Feb', value: 3000 },
                { name: 'Mar', value: 2000 },
                { name: 'Apr', value: 2780 },
                { name: 'May', value: 1890 },
                { name: 'Jun', value: 2390 },
                { name: 'Jul', value: 3490 },
            ];

            const enrollmentData = [
                { name: 'Active', value: data.enrollments.active || 10 },
                { name: 'Pending', value: data.enrollments.pending || 5 },
                { name: 'Completed', value: data.enrollments.completed || 15 }
            ];

            setStats({
                users: data.users.student,
                enrollments: data.enrollments.active,
                lessons: data.lessons.total,
                revenue: data.revenue.completed,
                recentActivity: data.recent_activities,
                recentLessons: [],
                trends: { users: 12, enrollments: 8, lessons: 5, revenue: revenueTrend },
                charts: { revenue: revenueData, enrollments: enrollmentData }
            });
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch Enrollments
            const enrollmentsRes = await api.get(`/users/${user.id}/enrollments`);
            const activeEnrollment = enrollmentsRes.data.find(e => e.status === 'active') || enrollmentsRes.data[0];

            // 2. Fetch Lessons
            const lessons = await lessonService.getLessons();
            const myLessons = lessons.filter(l => l.student_id === user.id);

            // 3. Fetch Curriculum Progress
            let progressData = [];
            let progressPercent = 0;
            if (activeEnrollment) {
                try {
                    const progressRes = await api.get(`/curriculum/progress/${activeEnrollment.id}`);
                    progressData = progressRes.data;
                    // Mock topics count for now or fetch curriculum to get total topics
                    // For now let's assume 10 topics if none found to show some progress if any completed
                    const completedCount = progressData.filter(p => p.completed).length;
                    progressPercent = completedCount > 0 ? Math.round((completedCount / 10) * 100) : 0;
                } catch (e) {
                    console.warn("Could not fetch progress", e);
                }
            }

            setStats({
                users: 0,
                enrollments: enrollmentsRes.data.length,
                lessons: myLessons.length,
                revenue: progressPercent, // Reusing field for progress % in student view
                recentActivity: [],
                recentLessons: myLessons.slice(0, 5),
                trends: { users: 0, enrollments: 0, lessons: 0, revenue: 0 },
                charts: { revenue: [], enrollments: [] }
            });
        } catch (error) {
            console.error("Failed to load student stats", error);
            setError('Failed to load your dashboard. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        const userRole = user?.role?.toLowerCase();
        if (userRole === 'student') fetchStudentStats();
        else fetchStats();
    };

    if (loading) return <DashboardSkeleton />;

    const userRole = user?.role?.toLowerCase();
    const isStudent = userRole === 'student';

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Welcome back, {user?.full_name} 👋
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleRetry}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                        aria-label="Refresh dashboard"
                    >
                        <RefreshCw size={18} />
                    </button>
                    {!isStudent && (
                        <button
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center space-x-2"
                            onClick={() => navigate('/students/add')}
                        >
                            <UserPlus size={16} />
                            <span>New Student</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-red-800 font-medium">{error}</p>
                        <button onClick={handleRetry} className="mt-1 text-sm text-red-600 font-semibold hover:underline">Try again</button>
                    </div>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {!isStudent && (
                    <StatCard
                        icon={Users}
                        label="Active Students"
                        value={stats.users}
                        color="bg-blue-500"
                        trend={stats.trends.users}
                        trendLabel="vs last month"
                        sparklineData={generateSparklineData()}
                    />
                )}
                <StatCard
                    icon={BookOpen}
                    label={isStudent ? "My Courses" : "Active Enrollments"}
                    value={stats.enrollments}
                    color="bg-emerald-500"
                    trend={!isStudent ? stats.trends.enrollments : null}
                    trendLabel="vs last month"
                    sparklineData={generateSparklineData()}
                />
                <StatCard
                    icon={Calendar}
                    label={isStudent ? "My Lessons" : "Total Lessons"}
                    value={stats.lessons}
                    color="bg-purple-500"
                    trend={!isStudent ? stats.trends.lessons : null}
                    trendLabel="vs last month"
                    sparklineData={generateSparklineData()}
                />
                {isStudent ? (
                    <StatCard
                        icon={TrendingUp}
                        label="Course Progress"
                        value={`${stats.revenue}%`}
                        color="bg-blue-600"
                        trend={null}
                        sparklineData={[{ name: 'Progress', value: stats.revenue }, { name: 'Remaining', value: 100 - stats.revenue }]}
                    />
                ) : (
                    <StatCard
                        icon={CreditCard}
                        label="Total Revenue"
                        value={`KES ${stats.revenue.toLocaleString()}`}
                        color="bg-orange-500"
                        trend={stats.trends.revenue}
                        trendLabel="vs last month"
                        sparklineData={generateSparklineData()}
                    />
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column (Charts & Activity) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Revenue Chart */}
                    {!isStudent && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                                    <TrendingUp size={18} className="text-gray-400" />
                                    <span>Revenue Analytics</span>
                                </h3>
                                <select className="bg-gray-50 border border-gray-200 text-xs rounded-lg px-2 py-1 outline-none text-gray-600">
                                    <option>Last 6 Months</option>
                                    <option>Last Year</option>
                                </select>
                            </div>
                            <RevenueChart data={stats.charts.revenue} />
                        </div>
                    )}

                    {/* Recent Activity/Lessons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                                <Activity size={18} className="text-gray-400" />
                                <span>{isStudent ? "Recent Lessons" : "Recent Activity"}</span>
                            </h3>
                            <button onClick={() => navigate(isStudent ? '/schedule' : '/reports')} className="text-xs font-semibold text-primary hover:text-primary/80">
                                View Report
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {isStudent ? (
                                stats.recentLessons.length > 0 ? (
                                    stats.recentLessons.map((lesson) => (
                                        <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{lesson.type} Lesson</p>
                                                    <p className="text-xs text-gray-400">{new Date(lesson.scheduled_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lesson.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                {lesson.status}
                                            </span>
                                        </div>
                                    ))
                                ) : <div className="p-6 text-center text-gray-400 text-sm">No recent lessons.</div>
                            ) : (
                                stats.recentActivity.length > 0 ? stats.recentActivity.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                )) : <div className="p-6 text-center text-gray-400 text-sm">No recent activity.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Secondary Stats & Widgets) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Enrollment Distribution */}
                    {!isStudent && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-2">Enrollment Status</h3>
                            <p className="text-xs text-gray-500 mb-6">Distribution of student statuses</p>
                            <EnrollmentChart data={stats.charts.enrollments} />
                        </div>
                    )}

                    {/* Operational Alerts / Quick Actions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">{isStudent ? "Quick Actions" : "Operational Alerts"}</h3>

                        {!isStudent ? (
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Maintenance Overdue</p>
                                        <p className="text-xs opacity-80 mt-1">Vehicle KCA 123B requires urgent service.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Unpaid Invoices</p>
                                        <p className="text-xs opacity-80 mt-1">5 invoices are pending payment.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition" onClick={() => navigate('/courses')}>
                                    <BookOpen size={20} className="mx-auto text-primary mb-2" />
                                    <span className="text-xs font-bold text-gray-700">My Courses</span>
                                </button>
                                <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition" onClick={() => navigate('/assessments')}>
                                    <FileText size={20} className="mx-auto text-secondary mb-2" />
                                    <span className="text-xs font-bold text-gray-700">Assessments</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Vehicle Quick Status (Admin Only) */}
                    {!isStudent && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Vehicle Status</h3>
                                <button onClick={() => navigate('/vehicles')} className="text-xs text-primary font-medium hover:underline">Manage</button>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'KCA 123B', status: 'In Service', color: 'green' },
                                    { name: 'KBZ 890L', status: 'Maintenance', color: 'red' },
                                    { name: 'KDD 456P', status: 'Available', color: 'green' },
                                ].map((v, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{v.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full bg-${v.color}-500`}></span>
                                            <span className="text-gray-500 text-xs">{v.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
