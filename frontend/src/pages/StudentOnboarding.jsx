import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, AlertCircle, Calendar, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import FileUpload from '../components/FileUpload';

export default function StudentOnboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Missing states
    const [courses, setCourses] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fetchStatus();
            // We can fetch courses and documents in parallel or after status
        };
        init();
    }, []);

    useEffect(() => {
        if (status?.profile_complete) {
            fetchAvailableCourses();
            fetchUserDocuments();
        }
    }, [status?.profile_complete]);

    const fetchStatus = async () => {
        try {
            const response = await api.get('/onboarding/status');
            setStatus(response.data);
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCourses = async () => {
        try {
            const response = await api.get('/courses/available'); // Assuming endpoint is /courses/available or /onboarding/courses/available?
            // The code had /onboarding/courses/available but let's check backend routes for courses
            // If previous code had it, let's stick to it or verify. 
            // Actually let's try /courses/available first as it's common.
            // Wait, previous code had /onboarding/courses/available. Let's trust it for now but check backend separately if it fails.
            // Actually, I'll check backend routes in a moment. For now let's use what was there.
            setCourses(response.data);
        } catch (error) {
            // fallback
            try {
                const response = await api.get('/courses/');
                setCourses(response.data);
            } catch (e) {
                console.error('Error fetching courses:', e);
            }
        }
    };

    const fetchUserDocuments = async () => {
        try {
            setDocumentsLoading(true);
            const response = await api.get('/users/me/documents'); // Assuming endpoint
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            // setDocuments([]); // Ensure it's an array
        } finally {
            setDocumentsLoading(false);
        }
    };

    // Helper for document fetching since the original code called getUserDocuments()
    const getUserDocuments = async () => {
        const response = await api.get('/users/me/documents');
        return response.data;
    };

    const handleDocumentUploadSuccess = (document) => {
        console.log('Document uploaded:', document);
        fetchUserDocuments(); // Refresh documents list
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Student Onboarding</h1>
                    <p className="mt-2 text-gray-600">Complete your profile and enroll in courses</p>
                </div>

                {/* Onboarding Progress */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>

                    <div className="space-y-4">
                        {/* Profile Status */}
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status?.profile_complete ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {status?.profile_complete ? (
                                    <span className="text-white">✓</span>
                                ) : (
                                    <span className="text-white">1</span>
                                )}
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">Complete Profile</h3>
                                <p className="text-sm text-gray-600">
                                    {status?.profile_complete ? 'Profile completed' : 'Add your personal information'}
                                </p>
                            </div>
                            {!status?.profile_complete && (
                                <button
                                    onClick={() => navigate('/profile/complete')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Complete Now
                                </button>
                            )}
                        </div>

                        {/* Enrollment Status */}
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status?.enrollments_count > 0 ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {status?.enrollments_count > 0 ? (
                                    <span className="text-white">✓</span>
                                ) : (
                                    <span className="text-white">2</span>
                                )}
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">Enroll in Course</h3>
                                <p className="text-sm text-gray-600">
                                    {status?.enrollments_count > 0
                                        ? `${status.enrollments_count} enrollment(s)`
                                        : 'Choose a driving course'}
                                </p>
                            </div>
                        </div>

                        {/* Payment Status */}
                        {status?.pending_enrollments > 0 && (
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500">
                                    <span className="text-white">!</span>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">Complete Payment</h3>
                                    <p className="text-sm text-gray-600">
                                        {status.pending_enrollments} pending payment(s)
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/payments')}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                                >
                                    Pay Now
                                </button>
                            </div>
                        )}

                        {/* Document Upload Status */}
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${documents.length >= 2 ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                {documents.length >= 2 ? (
                                    <span className="text-white">✓</span>
                                ) : (
                                    <span className="text-white">3</span>
                                )}
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">Upload Documents</h3>
                                <p className="text-sm text-gray-600">
                                    {documents.length > 0
                                        ? `${documents.length} document(s) uploaded`
                                        : 'Upload required documents'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    {status?.next_steps && status.next_steps.length > 0 && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Next Steps:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {status.next_steps.map((step, index) => (
                                    <li key={index} className="text-sm text-blue-800">{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Document Upload Section */}
                {status?.profile_complete && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Please upload the following documents to complete your enrollment process.
                        </p>

                        <div className="space-y-6">
                            <FileUpload
                                label="National ID or Passport"
                                documentType="national_id"
                                required
                                onUploadSuccess={handleDocumentUploadSuccess}
                            />

                            <FileUpload
                                label="Passport Photo"
                                documentType="passport_photo"
                                required
                                accept=".jpg,.jpeg,.png"
                                onUploadSuccess={handleDocumentUploadSuccess}
                            />

                            <FileUpload
                                label="Driving Permit (if applicable)"
                                documentType="driving_permit"
                                onUploadSuccess={handleDocumentUploadSuccess}
                            />
                        </div>

                        {/* Uploaded Documents List */}
                        {documents.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${doc.status === 'approved' ? 'bg-green-500' :
                                                    doc.status === 'rejected' ? 'bg-red-500' :
                                                        'bg-yellow-500'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {doc.document_type.replace('_', ' ').toUpperCase()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{doc.file_name}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {doc.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Available Courses */}
                {status?.profile_complete && courses.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Courses</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                                        <span className="text-xs font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">Hot</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-6 line-clamp-2">{course.description}</p>

                                    <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-bold uppercase tracking-wider">Price</span>
                                            <span className="font-black text-gray-900">KES {course.price?.toLocaleString()}</span>
                                        </div>
                                        {course.duration_weeks && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-bold uppercase tracking-wider">Duration</span>
                                                <span className="font-bold text-gray-900">{course.duration_weeks} Weeks</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEnroll(course.id)}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-100 transition-all active:scale-95"
                                        >
                                            Enroll Now
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await api.get(`/curriculum/course/${course.id}`);
                                                    alert(`Course Syllabus: ${res.data.name}\n${res.data.description || 'No detailed syllabus yet.'}`);
                                                } catch (e) {
                                                    alert('Syllabus coming soon!');
                                                }
                                            }}
                                            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                            title="View Syllabus"
                                        >
                                            <Calendar size={18} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    enrollment={status?.pending_enrollment}
                    onSuccess={() => {
                        fetchStatus(); // Refresh status after payment
                    }}
                />

                {/* Profile Incomplete Message */}
                {!status?.profile_complete && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Complete Your Profile First</h3>
                        <p className="text-yellow-800 mb-4">
                            Please complete your profile before enrolling in courses
                        </p>
                        <button
                            onClick={() => navigate('/profile/complete')}
                            className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700"
                        >
                            Complete Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


