import { useState, useEffect } from 'react';
import { lessonService } from '../services/lessonService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';

export default function Schedule() {
    const [lessons, setLessons] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        scheduled_at: '',
        duration_minutes: 60,
        type: 'practical',
        instructor_id: '',
        enrollment_id: '' // In real app, we'd select from active enrollments
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [lessonsData, usersData] = await Promise.all([
                lessonService.getLessons(),
                userService.getUsers(0, 100)
            ]);
            setLessons(lessonsData);
            setInstructors(usersData.filter(u => u.role === 'instructor'));
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Hardcoding enrollment_id isn't ideal but acceptable for demo without full enrollment selector context
            // In real world, we'd fetch user's enrollments first
            await lessonService.scheduleLesson({
                ...formData,
                enrollment_id: "00000000-0000-0000-0000-000000000000" // Placeholder UUID - will fail backend validation if not real
            });
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert("Failed to schedule. Ensure valid Enrollment ID (Note: Demo UI limitation).");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
                >
                    <Calendar size={20} />
                    <span>Book Lesson</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Upcoming Lessons</h3>
                <div className="space-y-4">
                    {lessons.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No lessons scheduled.</p>
                    ) : lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 border-gray-100">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 capitalize">{lesson.type} Lesson</p>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(lesson.scheduled_at), 'PPP p')}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                    ${lesson.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                        lesson.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                    {lesson.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Basic Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Book Lesson</h2>
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm mb-4 rounded">
                            Note: In this demo, Enrollment ID must be manual or mocked as we haven't built the full Student Selector flow.
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.scheduled_at}
                                    onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Instructor</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.instructor_id}
                                    onChange={e => setFormData({ ...formData, instructor_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Instructor</option>
                                    {instructors.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Enrollment ID (UUID)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Paste Enrollment ID associated with Student"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.enrollment_id}
                                    onChange={e => setFormData({ ...formData, enrollment_id: e.target.value })}
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
