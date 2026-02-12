import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Phone, MapPin, Calendar, CreditCard, BookOpen, Clock, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';

export default function StudentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch student profile (which now includes profile details)
                const studentRes = await api.get(`/users/${id}`);
                setStudent(studentRes.data);

                // Fetch student enrollments
                const enrollmentsRes = await api.get(`/users/${id}/enrollments`);
                setEnrollments(enrollmentsRes.data);

                // Fetch payments (Placeholder until real endpoint)
                // const paymentsRes = await api.get(`/users/${id}/payments`);
                // setPayments(paymentsRes.data);
            } catch (error) {
                console.error("Error fetching student details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Student Not Found</h2>
                <p className="text-gray-500 mt-2">The requested student profile could not be loaded.</p>
                <button
                    onClick={() => navigate('/students')}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                    Back to Students List
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/students')}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                    <p className="text-gray-500 text-sm">View and manage student details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mb-4">
                                {student.full_name?.charAt(0) || <User size={40} />}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{student.full_name}</h2>
                            <p className="text-sm text-gray-500">{student.email}</p>
                            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-medium border ${student.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                {student.is_active ? 'Active Account' : 'Inactive Account'}
                            </span>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={16} className="text-gray-400" />
                                <span className="text-gray-600">{student.profile?.phone_number || student.phone || 'No phone number'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck size={16} className="text-gray-400" />
                                <span className="text-gray-600">ID: {student.profile?.national_id || student.national_id || 'Not set'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar size={16} className="text-gray-400" />
                                <span className="text-gray-600">DOB: {student.profile?.date_of_birth || student.date_of_birth || 'Not set'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin size={16} className="text-gray-400" />
                                <span className="text-gray-600">{student.profile?.address || student.address || 'No address provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* PDL Tracking - Kenyan Requirement */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">PDL Tracking</h3>
                            {!student.profile?.pdl_number && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">REQUIRED</span>}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase">PDL Number</p>
                                <p className="text-sm font-bold text-gray-900">{student.profile?.pdl_number || 'Not Applied'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase">Issue Date</p>
                                    <p className="text-sm text-gray-700">{student.profile?.pdl_issue_date || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase">Expiry Date</p>
                                    <p className="text-sm text-gray-700">{student.profile?.pdl_expiry_date || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Emergency Contact</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase">Name</p>
                                <p className="text-sm text-gray-700">{student.profile?.emergency_contact_name || student.emergency_contact_name || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase">Phone</p>
                                <p className="text-sm text-gray-700">{student.profile?.emergency_contact_phone || student.emergency_contact_phone || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Progress & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <BookOpen size={20} />
                                </div>
                                <span className="text-sm font-bold text-purple-900">Enrollments</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900">{enrollments.length || 0}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Clock size={20} />
                                </div>
                                <span className="text-sm font-bold text-orange-900">Lessons</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-900">0</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <CreditCard size={20} />
                                </div>
                                <span className="text-sm font-bold text-green-900">Payments</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900">KES {payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Enrollments List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Course Enrollments</h3>
                            <button className="text-sm text-primary hover:underline font-medium">Add Enrollment</button>
                        </div>

                        {enrollments.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Course</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Progress</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {enrollments.map(enrollment => (
                                        <tr key={enrollment.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{enrollment.course?.name || 'Driving Course'}</td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(enrollment.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1 block">0% Complete</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">Active</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>No active enrollments found for this student.</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity / Payments placeholder */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Financial Overview</h3>
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-100 rounded-lg">
                            <p>No payment history recorded.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
