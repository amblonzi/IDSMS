import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Save, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/me');
            setProfile({
                full_name: response.data.full_name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
                address: response.data.address || '',
                date_of_birth: response.data.date_of_birth || '',
            });
        } catch (err) {
            setError('Failed to load profile');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            await api.put('/users/me', profile);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your personal information</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                    Profile updated successfully!
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary">
                                {user?.full_name?.[0] || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <User size={16} className="inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={profile.full_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Mail size={16} className="inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Phone size={16} className="inline mr-2" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Calendar size={16} className="inline mr-2" />
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={profile.date_of_birth}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <MapPin size={16} className="inline mr-2" />
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={profile.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
