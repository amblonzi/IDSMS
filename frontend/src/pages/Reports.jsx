import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import analyticsService from '../services/analyticsService';
import { courseService } from '../services/courseService';
import { Download, Filter, FileText, TrendingUp, Users, Car, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const REPORT_TYPES = [
    { id: 'revenue', name: 'Revenue Report', icon: TrendingUp, color: 'text-emerald-600' },
    { id: 'enrollments', name: 'Enrollment Report', icon: Users, color: 'text-blue-600' },
    { id: 'instructors', name: 'Instructor Performance', icon: Calendar, color: 'text-purple-600' },
    { id: 'vehicles', name: 'Vehicle Utilization', icon: Car, color: 'text-orange-600' }
];

export default function Reports() {
    const { user } = useAuth();
    const [selectedReport, setSelectedReport] = useState('revenue');
    const [reportData, setReportData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        courseId: '',
        paymentMethod: '',
        status: ''
    });

    useEffect(() => {
        // Load courses for filter dropdown
        const loadCourses = async () => {
            try {
                const coursesData = await courseService.getCourses();
                setCourses(coursesData);
            } catch (err) {
                console.error('Failed to load courses:', err);
            }
        };
        loadCourses();
    }, []);

    useEffect(() => {
        // Load report data when report type or filters change
        loadReportData();
    }, [selectedReport]);

    const loadReportData = async () => {
        try {
            setLoading(true);
            setError(null);

            let data;
            switch (selectedReport) {
                case 'revenue':
                    data = await analyticsService.getRevenueAnalytics(filters);
                    break;
                case 'enrollments':
                    data = await analyticsService.getEnrollmentTrends(filters);
                    break;
                case 'instructors':
                    data = await analyticsService.getInstructorPerformance();
                    break;
                case 'vehicles':
                    data = await analyticsService.getVehicleUtilization();
                    break;
                default:
                    data = null;
            }

            setReportData(data);
        } catch (err) {
            console.error('Failed to load report data:', err);
            setError('Failed to load report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        loadReportData();
    };

    const handleExport = () => {
        if (!reportData) return;

        let exportData = [];
        let filename = `${selectedReport}_report_${format(new Date(), 'yyyy-MM-dd')}`;

        switch (selectedReport) {
            case 'revenue':
                exportData = reportData.by_course.map(item => ({
                    'Course': item.course_name,
                    'Revenue': item.amount,
                    'Enrollments': item.enrollment_count
                }));
                break;
            case 'enrollments':
                exportData = reportData.trend_data.map(item => ({
                    'Month': item.date,
                    'Enrollments': item.count
                }));
                break;
            case 'instructors':
                exportData = reportData.instructors.map(item => ({
                    'Instructor': item.instructor_name,
                    'Total Lessons': item.total_lessons,
                    'Completed': item.completed_lessons,
                    'Cancelled': item.cancelled_lessons,
                    'Completion Rate': `${item.completion_rate}%`,
                    'Active Students': item.active_students
                }));
                break;
            case 'vehicles':
                exportData = reportData.vehicles.map(item => ({
                    'Registration': item.reg_number,
                    'Type': item.type,
                    'Total Lessons': item.total_lessons,
                    'Status': item.is_active ? 'Active' : 'Inactive',
                    'Next Service': item.next_service_date || 'N/A',
                    'Insurance Expiry': item.insurance_expiry || 'N/A'
                }));
                break;
        }

        analyticsService.exportToCSV(exportData, filename);
    };

    const renderReportContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading report...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-800">{error}</p>
                </div>
            );
        }

        if (!reportData) return null;

        switch (selectedReport) {
            case 'revenue':
                return (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg border border-emerald-200">
                                <p className="text-sm text-emerald-700 font-medium">Total Revenue</p>
                                <p className="text-2xl font-bold text-emerald-900 mt-1">
                                    KES {reportData.total_revenue.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700 font-medium">Completed</p>
                                <p className="text-2xl font-bold text-green-900 mt-1">
                                    KES {reportData.completed_revenue.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-700 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-amber-900 mt-1">
                                    KES {reportData.pending_revenue.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Revenue by Course */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Revenue by Course</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.by_course.map((course) => (
                                            <tr key={course.course_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.course_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">KES {course.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{course.enrollment_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'enrollments':
                return (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700 font-medium">Total</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">{reportData.by_status.total}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700 font-medium">Active</p>
                                <p className="text-2xl font-bold text-green-900 mt-1">{reportData.by_status.active}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-700 font-medium">Completed</p>
                                <p className="text-2xl font-bold text-purple-900 mt-1">{reportData.by_status.completed}</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-700 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-amber-900 mt-1">{reportData.by_status.pending}</p>
                            </div>
                        </div>

                        {/* Enrollment Trends */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Enrollment Trends</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.trend_data.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'instructors':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Instructor Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lessons</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Students</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.instructors.map((instructor) => (
                                        <tr key={instructor.instructor_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instructor.instructor_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{instructor.total_lessons}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{instructor.completed_lessons}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{instructor.cancelled_lessons}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${instructor.completion_rate >= 80 ? 'bg-green-100 text-green-800' :
                                                        instructor.completion_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {instructor.completion_rate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{instructor.active_students}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'vehicles':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Vehicle Utilization</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lessons</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.vehicles.map((vehicle) => (
                                        <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.reg_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vehicle.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vehicle.total_lessons}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {vehicle.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {vehicle.next_service_date || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {vehicle.insurance_expiry || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500 mt-1">Generate and export detailed reports</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={!reportData || loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    <Download size={20} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Report Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {REPORT_TYPES.map((report) => {
                    const Icon = report.icon;
                    const isSelected = selectedReport === report.id;
                    return (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <Icon className={`${report.color} mb-2`} size={24} />
                            <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {report.name}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            {(selectedReport === 'revenue' || selectedReport === 'enrollments') && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Filter size={20} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {selectedReport === 'revenue' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                <select
                                    value={filters.courseId}
                                    onChange={(e) => handleFilterChange('courseId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-end">
                            <button
                                onClick={applyFilters}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Content */}
            {renderReportContent()}
        </div>
    );
}
