import React, { useState } from 'react';
import api from '../services/api';
import { X, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, enrollment, onSuccess }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen || !enrollment) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('processing');
        setErrorMessage('');

        try {
            await api.post(`/payments/initiate/mpesa/${enrollment.id}`, null, {
                params: {
                    amount: enrollment.amount_due,
                    phone_number: phone
                }
            });
            setStatus('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 3000);
        } catch (error) {
            console.error('Payment initiation error:', error);
            setStatus('error');
            setErrorMessage(error.response?.data?.detail || 'Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-green-400" />
                        Pay with M-Pesa
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {status === 'success' ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h4>
                            <p className="text-gray-600 mb-2">Check your phone <strong>{phone}</strong> to enter your M-Pesa PIN.</p>
                            <p className="text-sm text-gray-400">Closing window...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-blue-600 font-medium">Course</span>
                                    <span className="text-sm text-blue-900 font-bold">{enrollment.course_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-600 font-medium">Amount Due</span>
                                    <span className="text-lg text-blue-900 font-bold">KES {enrollment.amount_due?.toLocaleString()}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone Number</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+254</span>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="712345678"
                                            className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-mono text-lg"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Enter number without the leading 0 (e.g. 712...)</p>
                                </div>

                                {status === 'error' && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending Request...
                                        </>
                                    ) : (
                                        <>PAY KES {enrollment.amount_due?.toLocaleString()}</>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
