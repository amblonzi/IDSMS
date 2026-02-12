import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ProfileComplete() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: '',
        date_of_birth: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            await api.put('/users/me', formData);

            // Redirect to onboarding after successful profile completion
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-600">
                        Please provide your information to continue with enrollment
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User size={16} className="inline mr-2" />
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            required
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Phone size={16} className="inline mr-2" />
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                                placeholder="+254 700 000 000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Calendar size={16} className="inline mr-2" />
                                Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <MapPin size={16} className="inline mr-2" />
                            Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            required
                            placeholder="Enter your residential address"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This information is required for your student enrollment and will be used for official documentation.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>Continue to Enrollment</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
