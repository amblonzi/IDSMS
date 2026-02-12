import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, Save, ArrowLeft, ChevronRight } from 'lucide-react';

const AddStudent = () => {
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
    const [enablePortalAccess, setEnablePortalAccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation - only if portal access enabled
        if (enablePortalAccess) {
            if (!formData.email) {
                newErrors.email = 'Email is required for portal access';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }

            // Password validation - only if portal access enabled
            if (!formData.password) {
                newErrors.password = 'Password is required for portal access';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            // Validate email format if provided even if toggle is off
            newErrors.email = 'Invalid email format';
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
                newErrors.date_of_birth = 'Student must be at least 18 years old';
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
            await api.post('/onboarding/register', {
                email: formData.email || null,
                password: enablePortalAccess ? formData.password : null,
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
                navigate('/users');
            }, 2000);
        } catch (error) {
            console.error('Registration error:', error);
            if (error.response?.data?.detail) {
                setErrors({ submit: error.response.data.detail });
            } else {
                setErrors({ submit: 'Failed to create student. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Created Successfully!</h2>
                    <p className="text-gray-600">Redirecting to users list...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumbs & Header */}
            <div>
                <nav className="flex mb-4" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <button onClick={() => navigate('/users')} className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                                Users
                            </button>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Add Student</span>
                            </div>
                        </li>
                    </ol>
                </nav>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/users')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
                        <p className="text-gray-500 text-sm">Register a new student to the system</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 p-6 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserPlus className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Account Information */}
                        <div className="bg-blue-50/50 -mx-6 px-6 py-6 border-y border-blue-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Portal Access</h3>
                                    <p className="text-xs text-gray-500 mt-1">Enable this to allow student to log in and track progress</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={enablePortalAccess}
                                        onChange={(e) => setEnablePortalAccess(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {(enablePortalAccess || formData.email) && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email Address {enablePortalAccess && '*'}
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                                placeholder="student@example.com"
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                    </div>

                                    {enablePortalAccess && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className={`w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                                    placeholder="Create a password"
                                                />
                                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className={`w-full rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                                    placeholder="Confirm password"
                                                />
                                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={`w-full rounded-lg border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                    />
                                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={`w-full rounded-lg border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                    />
                                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="254712345678"
                                        className={`w-full rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID *</label>
                                    <input
                                        type="text"
                                        name="national_id"
                                        value={formData.national_id}
                                        onChange={handleChange}
                                        placeholder="12345678"
                                        className={`w-full rounded-lg border ${errors.national_id ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                    />
                                    {errors.national_id && <p className="mt-1 text-sm text-red-600">{errors.national_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 17)).toISOString().split('T')[0]}
                                        className={`w-full rounded-lg border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                    />
                                    {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="e.g. Nairobi, Westlands"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        name="emergency_contact_name"
                                        value={formData.emergency_contact_name}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        name="emergency_contact_phone"
                                        value={formData.emergency_contact_phone}
                                        onChange={handleChange}
                                        placeholder="254712345678"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <div className="text-red-500 mt-0.5">⚠️</div>
                                <p className="text-sm text-red-700">{errors.submit}</p>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200"
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Create Student
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddStudent;
