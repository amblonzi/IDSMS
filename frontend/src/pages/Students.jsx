import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { Plus, Search, User, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchTerm]);

    const fetchStudents = async () => {
        try {
            const data = await userService.getUsers();
            // Filter only students
            setStudents(data.filter(u => u.role === 'student'));
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        let result = students;

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(student =>
                student.full_name?.toLowerCase().includes(lowerTerm) ||
                student.email?.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredStudents(result);
    };

    const handleViewDetails = (student) => {
        navigate(`/students/${student.id}`);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-500 text-sm">Manage student profiles, enrollment, and progress</p>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/students/add')}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold"
                    >
                        <Plus size={20} />
                        <span>Add New Student</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="text-sm font-medium text-gray-600">
                    Total Students: <span className="text-blue-600 font-bold">{filteredStudents.length}</span>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Contact & ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Portal Access</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-500">Loading students...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-500">No students found.</td></tr>
                            ) : filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {student.full_name ? student.full_name.charAt(0).toUpperCase() : <User size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{student.full_name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{student.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="font-bold text-gray-900">{student.phone || 'No Phone'}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">ID: {student.national_id || 'N/A'}</p>
                                            <div className="mt-2 pt-2 border-t border-gray-50">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next of Kin</p>
                                                <p className="text-xs font-semibold text-slate-700">{student.emergency_contact_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {student.email ? (
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-medium">{student.email}</span>
                                                <span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Portal Enabled</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Offline Student</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${student.is_active
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${student.is_active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                            {student.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(student.created_at || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleViewDetails(student)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Profile"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Student">
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
        </div>
    );
}
