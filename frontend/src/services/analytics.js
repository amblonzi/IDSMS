import api from './api';

export const analyticsService = {
    /**
     * Get dashboard statistics
     * Returns comprehensive stats for admin/manager dashboard
     */
    getDashboardStats: async () => {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    /**
     * Get revenue analytics
     * @param {Object} filters - Optional filters { startDate, endDate, courseId, paymentMethod }
     */
    getRevenueAnalytics: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.courseId) params.append('course_id', filters.courseId);
        if (filters.paymentMethod) params.append('payment_method', filters.paymentMethod);

        const response = await api.get(`/analytics/revenue?${params.toString()}`);
        return response.data;
    },

    /**
     * Get enrollment trends
     * @param {Object} filters - Optional filters { startDate, endDate, status }
     */
    getEnrollmentTrends: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.status) params.append('status', filters.status);

        const response = await api.get(`/analytics/enrollments?${params.toString()}`);
        return response.data;
    },

    /**
     * Get instructor performance metrics
     */
    getInstructorPerformance: async () => {
        const response = await api.get('/analytics/instructors');
        return response.data;
    },

    /**
     * Get vehicle utilization metrics
     */
    getVehicleUtilization: async () => {
        const response = await api.get('/analytics/vehicles');
        return response.data;
    }
};
