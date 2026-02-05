import { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import { CreditCard, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const data = await paymentService.getPayments();
            setPayments(data);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Payments Analysis</h1>
                <button
                    onClick={fetchPayments}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">
                        KES {payments.reduce((acc, p) => p.status === 'completed' ? acc + p.amount : acc, 0).toLocaleString()}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Pending Transactions</p>
                    <h3 className="text-3xl font-bold text-yellow-600 mt-2">
                        {payments.filter(p => p.status === 'pending').length}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Today's Transactions</p>
                    <h3 className="text-3xl font-bold text-blue-600 mt-2">
                        {payments.filter(p => new Date(p.timestamp).toDateString() === new Date().toDateString()).length}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Reference</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Method</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
                            ) : payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-mono text-sm">{payment.external_ref || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <CreditCard size={16} className="text-gray-400" />
                                            <span>{payment.method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">KES {payment.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(payment.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
