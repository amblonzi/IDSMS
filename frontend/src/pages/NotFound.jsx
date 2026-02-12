import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-red-600" />
                </div>

                <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Page Not Found</h2>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <Link
                    to="/dashboard"
                    className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    <Home size={20} />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        Need help? <a href="/admin/settings" className="text-primary hover:underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
