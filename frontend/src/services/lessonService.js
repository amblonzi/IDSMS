import api from './api';

export const lessonService = {
    getLessons: async (filters = {}) => {
        // Convert object to query string
        const params = new URLSearchParams(filters);
        const response = await api.get(`/lessons/?${params.toString()}`);
        return response.data;
    },

    scheduleLesson: async (lessonData) => {
        const response = await api.post('/lessons/', lessonData);
        return response.data;
    },

    updateStatus: async (lessonId, status) => {
        const response = await api.patch(`/lessons/${lessonId}/status?status=${status}`);
        return response.data;
    }
};
