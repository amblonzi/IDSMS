import { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import { useAuth } from '../contexts/AuthContext';
import { Plus, BookOpen, Clock, Tag } from 'lucide-react';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        duration_weeks: 4
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await courseService.getCourses();
            setCourses(data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await courseService.createCourse(formData);
            setShowAddModal(false);
            setFormData({ name: '', description: '', price: 0, duration_weeks: 4 });
            fetchCourses();
        } catch (error) {
            alert("Failed to create course");
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            if (confirm("Confirm enrollment? This will create a pending payment.")) {
                await courseService.enroll(courseId);
                alert("Enrolled successfully!");
            }
        } catch (error) {
            alert(error.response?.data?.detail || "Enrollment failed");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                {['admin', 'manager'].includes(user?.role) && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
                    >
                        <Plus size={20} />
                        <span>Create Course</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div>Loading...</div>
                ) : courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <BookOpen size={24} />
                            </div>
                            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                KES {course.price?.toLocaleString()}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">{course.name}</h3>
                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{course.description || "No description provided."}</p>

                        <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                                <Clock size={16} />
                                <span>{course.duration_weeks} Weeks</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Tag size={16} />
                                <span>Certified</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleEnroll(course.id)}
                            className="w-full py-2 bg-gray-50 text-primary font-medium rounded-lg hover:bg-primary hover:text-white transition-colors border border-gray-200"
                        >
                            Enroll Now
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Course Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create Course</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Course Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (KES)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (Weeks)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={formData.duration_weeks}
                                        onChange={e => setFormData({ ...formData, duration_weeks: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
