import api from './api';

/**
 * Analytics service for fetching dashboard and reporting data.
 */
const analyticsService = {
    /**
     * Get dashboard statistics
     */
    getDashboardStats: async () => {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    /**
     * Get revenue analytics with optional filters
     */
    getRevenueAnalytics: async (filters = {}) => {
        const params = new URLSearchParams();

        if (filters.startDate) {
            params.append('start_date', filters.startDate);
        }
        if (filters.endDate) {
            params.append('end_date', filters.endDate);
        }
        if (filters.courseId) {
            params.append('course_id', filters.courseId);
        }
        if (filters.paymentMethod) {
            params.append('payment_method', filters.paymentMethod);
        }

        const response = await api.get(`/analytics/revenue?${params.toString()}`);
        return response.data;
    },

    /**
     * Get enrollment trends with optional filters
     */
    getEnrollmentTrends: async (filters = {}) => {
        const params = new URLSearchParams();

        if (filters.startDate) {
            params.append('start_date', filters.startDate);
        }
        if (filters.endDate) {
            params.append('end_date', filters.endDate);
        }
        if (filters.status) {
            params.append('status', filters.status);
        }

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
    },

    /**
     * Export report data as CSV
     */
    exportToCSV: (data, filename) => {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Handle values that might contain commas
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export default analyticsService;
