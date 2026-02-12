import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, scheduleRes, studentsRes] = await Promise.all([
                api.get('/instructor/dashboard/stats'),
                api.get('/instructor/dashboard/schedule'),
                api.get('/instructor/students/list')
            ]);

            setStats(statsRes.data);
            setSchedule(scheduleRes.data);
            setStudents(studentsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-KE', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            scheduled: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
                    <p className="mt-1 text-gray-600">Manage your schedule and track student progress</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Lessons Today</p>
                                <p className="text-3xl font-bold text-gray-900">{stats?.total_lessons_today || 0}</p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">This Week</p>
                                <p className="text-3xl font-bold text-gray-900">{stats?.total_lessons_week || 0}</p>
                                <p className="text-sm text-green-600">{stats?.completed_lessons_week || 0} completed</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-3xl font-bold text-gray-900">{stats?.total_students || 0}</p>
                            </div>
                            <div className="bg-purple-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Upcoming Lessons</p>
                                <p className="text-3xl font-bold text-gray-900">{stats?.upcoming_lessons || 0}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    KES {stats?.revenue_this_month?.toLocaleString() || '0'}
                                </p>
                            </div>
                            <div className="bg-emerald-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-3 text-sm font-medium ${activeTab === 'overview'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Schedule
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`px-6 py-3 text-sm font-medium ${activeTab === 'students'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Students
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Schedule Tab */}
                        {activeTab === 'overview' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Lessons</h3>
                                {schedule.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No upcoming lessons scheduled</p>
                                ) : (
                                    <div className="space-y-4">
                                        {schedule.map((lesson) => (
                                            <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3">
                                                            <h4 className="text-lg font-medium text-gray-900">{lesson.student_name}</h4>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}>
                                                                {lesson.status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {formatDateTime(lesson.start_time)}
                                                            </div>
                                                            {lesson.end_time && (
                                                                <div className="flex items-center">
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {formatDateTime(lesson.end_time)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Students Tab */}
                        {activeTab === 'students' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Students</h3>
                                {students.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No students yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Lessons
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Completed
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Progress
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{student.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{student.total_lessons}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{student.completed_lessons}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                                    <div
                                                                        className="bg-blue-600 h-2 rounded-full"
                                                                        style={{ width: `${student.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm text-gray-900">{student.progress}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
