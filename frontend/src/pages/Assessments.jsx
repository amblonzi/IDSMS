import { useState, useEffect } from 'react';
import { ClipboardCheck, Target, Award, ShieldCheck, HelpCircle, TrendingUp } from 'lucide-react';
import { getMyAssessments } from '../services/assessments';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ExamCard = ({ assessment }) => {
    const { assessment_type, score, max_score, passed, assessment_date, notes } = assessment;

    // Calculate percentage
    const percentage = max_score > 0 ? Math.round((score / max_score) * 100) : 0;

    // Map assessment types to icons and titles
    const typeConfig = {
        theory_test: { icon: ClipboardCheck, title: 'Theory Test', color: 'blue' },
        practical_eval: { icon: Target, title: 'Practical Evaluation', color: 'indigo' },
        final_exam: { icon: Award, title: 'Final Exam', color: 'purple' },
        progress_check: { icon: TrendingUp, title: 'Progress Check', color: 'gray' },
        ntsa_theory: { icon: ShieldCheck, title: 'NTSA Theory', color: 'green' },
        ntsa_practical: { icon: ShieldCheck, title: 'NTSA Practical', color: 'green' }
    };

    const config = typeConfig[assessment_type] || { icon: HelpCircle, title: assessment_type, color: 'blue' };
    const Icon = config.icon;
    const status = passed ? 'passed' : 'failed';
    const colorClass = config.color === 'green' ? 'bg-green-50 text-green-600' :
        config.color === 'purple' ? 'bg-purple-50 text-purple-600' :
            'bg-blue-50 text-blue-600';

    // Format date
    const formattedDate = new Date(assessment_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${colorClass} rounded-xl`}>
                    <Icon size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {status}
                </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{config.title}</h3>
            <p className="text-sm text-gray-400 mb-2">{formattedDate}</p>

            {(assessment.booking_reference || assessment.test_center) && (
                <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                    {assessment.booking_reference && (
                        <p className="text-[10px] text-gray-500 font-medium">Ref: <span className="text-gray-900 font-bold">{assessment.booking_reference}</span></p>
                    )}
                    {assessment.test_center && (
                        <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={assessment.test_center}>Center: <span className="text-gray-900 font-bold">{assessment.test_center}</span></p>
                    )}
                </div>
            )}

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Score</p>
                    <p className="text-2xl font-black text-gray-900">{percentage}%</p>
                    <p className="text-xs text-gray-500">{score}/{max_score} points</p>
                </div>
                {notes && (
                    <button
                        className="text-xs font-bold text-primary hover:underline"
                        title={notes}
                    >
                        View Notes
                    </button>
                )}
            </div>
        </div>
    );
};

export default function Assessments() {
    const [activeTab, setActiveTab] = useState('all');
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const isStudent = user?.role?.toLowerCase() === 'student';

    useEffect(() => {
        if (isStudent) {
            fetchAssessments();
        } else {
            setLoading(false);
        }
    }, [isStudent]);

    const fetchAssessments = async () => {
        try {
            setLoading(true);
            const data = await getMyAssessments();
            setAssessments(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching assessments:', err);
            setError('Failed to load assessments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter assessments based on active tab
    const filteredAssessments = activeTab === 'all'
        ? assessments
        : assessments.filter(a => a.assessment_type === activeTab);

    // Calculate statistics
    const totalAssessments = assessments.length;
    const passedAssessments = assessments.filter(a => a.passed).length;
    const averageScore = assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + (a.score / a.max_score * 100), 0) / assessments.length)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading assessments...</p>
                </div>
            </div>
        );
    }

    if (!isStudent) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ClipboardCheck size={40} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Dashboard</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        This dashboard is designed for students to track their personal exam results and progress.
                        As {user?.role === 'instructor' ? 'an instructor' : 'a member of staff'}, you can manage student assessments directly from the Student Management section.
                    </p>
                    <button
                        onClick={() => navigate('/students')}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Go to Student Management
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-primary">Assessments & Exams</h1>
                    <p className="text-gray-500 mt-1">Track your progress and performance.</p>
                </div>
                <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('theory_test')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'theory_test' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Theory
                    </button>
                    <button
                        onClick={() => setActiveTab('practical_eval')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'practical_eval' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Practical
                    </button>
                </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
                <div className="flex items-center justify-between">
                    <div className="max-w-md">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Your Performance</span>
                        </div>
                        <h2 className="text-3xl font-black mb-2">Average Score: {averageScore}%</h2>
                        <p className="text-blue-100 opacity-80 leading-relaxed">
                            You've completed {totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''} with {passedAssessments} passing grade{passedAssessments !== 1 ? 's' : ''}.
                            {averageScore >= 80 && " Excellent work! Keep it up!"}
                            {averageScore >= 60 && averageScore < 80 && " Good progress! A bit more practice will help."}
                            {averageScore < 60 && " Focus on improving your weak areas."}
                        </p>
                    </div>
                    <div className="hidden lg:block relative">
                        <div className="w-32 h-32 border-8 border-white/20 rounded-full flex items-center justify-center">
                            <span className="text-4xl font-black">
                                {averageScore >= 90 ? 'A+' : averageScore >= 80 ? 'A' : averageScore >= 70 ? 'B' : averageScore >= 60 ? 'C' : 'D'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {/* Assessments Grid */}
            {filteredAssessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssessments.map((assessment) => (
                        <ExamCard key={assessment.id} assessment={assessment} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardCheck size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Assessments Yet</h3>
                        <p className="text-gray-500">
                            {activeTab === 'all'
                                ? "You haven't taken any assessments yet. They will appear here once your instructor creates them."
                                : `No ${activeTab.replace('_', ' ')} assessments found.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Compliance Checklist */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <ShieldCheck size={28} className="text-primary" />
                    <h3 className="text-xl font-bold text-gray-900">Readiness Checklist</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {[
                        { label: 'Profile Complete', status: true },
                        { label: 'Course Enrolled', status: totalAssessments > 0 },
                        { label: 'Theory Assessments', status: assessments.some(a => a.assessment_type === 'theory_test' && a.passed) },
                        { label: 'Practical Assessments', status: assessments.some(a => a.assessment_type === 'practical_eval' && a.passed) },
                        { label: 'Average Score Above 60%', status: averageScore >= 60 },
                        { label: 'Ready for Final Exam', status: passedAssessments >= 3 && averageScore >= 70 }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-sm font-bold text-gray-700">{item.label}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${item.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {item.status ? 'Complete' : 'Pending'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
