import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const StudentRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        national_id: '',
        date_of_birth: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Required fields
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.national_id) newErrors.national_id = 'National ID is required';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';

        // Phone validation (Kenyan format)
        if (formData.phone && !/^(254|0)[17]\d{8}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
            newErrors.phone = 'Invalid Kenyan phone number (use 254XXXXXXXXX or 07XXXXXXXX)';
        }

        // National ID validation
        if (formData.national_id && !/^\d{7,8}$/.test(formData.national_id)) {
            newErrors.national_id = 'National ID must be 7-8 digits';
        }

        // Age validation (must be 18+)
        if (formData.date_of_birth) {
            const birthDate = new Date(formData.date_of_birth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 18) {
                newErrors.date_of_birth = 'You must be at least 18 years old';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/onboarding/register', {
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                national_id: formData.national_id,
                date_of_birth: formData.date_of_birth,
                address: formData.address || null,
                emergency_contact_name: formData.emergency_contact_name || null,
                emergency_contact_phone: formData.emergency_contact_phone || null
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
            }, 2000);
        } catch (error) {
            console.error('Registration error:', error);
            if (error.response?.data?.detail) {
                setErrors({ submit: error.response.data.detail });
            } else {
                setErrors({ submit: 'Registration failed. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-green-500 text-6xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Student Registration</h2>
                    <p className="mt-2 text-gray-600">Join our driving school and start your journey</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Account Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`mt-1 block w-full rounded-md border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        />
                                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`mt-1 block w-full rounded-md border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        />
                                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={`mt-1 block w-full rounded-md border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="254712345678 or 0712345678"
                                        className={`mt-1 block w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">National ID *</label>
                                    <input
                                        type="text"
                                        name="national_id"
                                        value={formData.national_id}
                                        onChange={handleChange}
                                        placeholder="12345678"
                                        className={`mt-1 block w-full rounded-md border ${errors.national_id ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.national_id && <p className="mt-1 text-sm text-red-600">{errors.national_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                        className={`mt-1 block w-full rounded-md border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                                    <input
                                        type="text"
                                        name="emergency_contact_name"
                                        value={formData.emergency_contact_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                                    <input
                                        type="tel"
                                        name="emergency_contact_phone"
                                        value={formData.emergency_contact_phone}
                                        onChange={handleChange}
                                        placeholder="254712345678"
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="text-sm text-red-600">{errors.submit}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Already have an account? Login
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentRegistration;
