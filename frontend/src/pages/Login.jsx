import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            setError('');
            await login(email.toLowerCase().trim(), password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center w-full min-h-screen premium-gradient p-4">
            <div className="w-full max-w-[440px] glass p-10 rounded-2xl shadow-2xl border border-white/50">
                {/* Logo and Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {settings?.school_name || 'IDSMS'}
                    </h1>
                    <p className="text-slate-500 font-medium max-w-[280px] mx-auto text-sm">
                        {settings?.school_tagline || 'Inphora Driving School Management System'}
                    </p>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
                    <p className="text-sm text-slate-500 mt-1">Please enter your details to sign in</p>
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start animate-in fade-in slide-in-from-top-2">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="name@school.com"
                                className="block w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="block w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-4 px-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    <p>Protected System • Authorized Personnel Only</p>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                        Powered by Inphora Systems
                    </p>
                </div>
            </div>
        </div>
    );
}
