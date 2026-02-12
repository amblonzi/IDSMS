import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { Plus, Search, User, Eye, Trash2 } from 'lucide-react';

export default function Staff() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // all, instructor, admin, manager
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'instructor'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter]);

    const fetchUsers = async () => {
        try {
            const data = await userService.getUsers();
            // Filter only staff (non-students)
            setUsers(data.filter(u => u.role !== 'student'));
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let result = users;

        // Role Filter
        if (roleFilter !== 'all') {
            result = result.filter(user => user.role === roleFilter);
        }

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(user =>
                user.full_name?.toLowerCase().includes(lowerTerm) ||
                user.email?.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredUsers(result);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await userService.createUser(formData);
            setShowAddModal(false);
            setFormData({ email: '', password: '', full_name: '', phone: '', role: 'instructor' });
            fetchUsers();
            alert("Staff member created successfully");
        } catch (error) {
            alert("Failed to create staff: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-500 text-sm">Manage instructors, managers, and system administrators</p>
                </div>
                <div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold"
                    >
                        <Plus size={20} />
                        <span>Add Staff Member</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {['all', 'instructor', 'admin', 'manager'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${roleFilter === role
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            {role === 'all' ? 'All Staff' : `${role}s`}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-500">Loading staff members...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-500">No staff members found.</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.full_name || 'N/A'}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100 shadow-sm shadow-purple-50' :
                                            user.role === 'instructor' ? 'bg-orange-50 text-orange-700 border-orange-100 shadow-sm shadow-orange-50' :
                                                'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-50'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.is_active
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            <span className={`w-1 h-1 rounded-full mr-1.5 ${user.is_active ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></span>
                                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                        {new Date(user.created_at || Date.now()).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="View/Edit"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Add Staff Member</h2>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Access Details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="e.g. John Doe"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="e.g. 07XXXXXXXX"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="staff@idsms.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Initial Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Assign Role</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all capitalize"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="instructor">Instructor</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
