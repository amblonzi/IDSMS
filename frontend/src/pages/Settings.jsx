import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import settingsService from '../services/settingsService';

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        school_name: '',
        school_tagline: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        primary_color: '#3b82f6',
        logo_url: '',
        timezone: 'Africa/Nairobi',
        currency: 'KES'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getSettings();
            setSettings(data);
            setFormData({
                school_name: data.school_name || '',
                school_tagline: data.school_tagline || '',
                contact_email: data.contact_email || '',
                contact_phone: data.contact_phone || '',
                address: data.address || '',
                primary_color: data.primary_color || '#3b82f6',
                logo_url: data.logo_url || '',
                timezone: data.timezone || 'Africa/Nairobi',
                currency: data.currency || 'KES'
            });
        } catch (err) {
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            await settingsService.updateSettings(formData);
            setSuccess('Settings updated successfully!');
            await fetchSettings(); // Refresh to get updated data

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-2">Configure your school's identity and system preferences</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* School Identity Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">School Identity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                School Name *
                            </label>
                            <input
                                type="text"
                                name="school_name"
                                value={formData.school_name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., Nairobi Driving Academy"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tagline *
                            </label>
                            <input
                                type="text"
                                name="school_tagline"
                                value={formData.school_tagline}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., Learn to Drive with Confidence"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Email
                            </label>
                            <input
                                type="email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="info@school.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="+254 700 000 000"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="School physical address"
                            />
                        </div>
                    </div>
                </div>

                {/* Branding Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Primary Color *
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    name="primary_color"
                                    value={formData.primary_color}
                                    onChange={handleChange}
                                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="#3b82f6"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Used for buttons, links, and highlights</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                name="logo_url"
                                value={formData.logo_url}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="https://example.com/logo.png"
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional: URL to your school logo</p>
                        </div>
                    </div>
                </div>

                {/* System Preferences Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">System Preferences</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timezone *
                            </label>
                            <select
                                name="timezone"
                                value={formData.timezone}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="Africa/Nairobi">East Africa Time (Nairobi)</option>
                                <option value="Africa/Lagos">West Africa Time (Lagos)</option>
                                <option value="Africa/Cairo">Egypt Time (Cairo)</option>
                                <option value="Africa/Johannesburg">South Africa Time (Johannesburg)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency *
                            </label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="KES">KES - Kenyan Shilling</option>
                                <option value="NGN">NGN - Nigerian Naira</option>
                                <option value="ZAR">ZAR - South African Rand</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between bg-white rounded-lg shadow p-6">
                    <button
                        type="button"
                        onClick={fetchSettings}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <RefreshCw size={18} />
                        <span>Reset</span>
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
