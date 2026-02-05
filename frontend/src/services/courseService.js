import api from './api';

export const courseService = {
    getCourses: async (skip = 0, limit = 100) => {
        const response = await api.get(`/courses/?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    createCourse: async (courseData) => {
        const response = await api.post('/courses/', courseData);
        return response.data;
    },

    enroll: async (courseId) => {
        const response = await api.post(`/courses/${courseId}/enroll`);
        return response.data;
    },

    getMyEnrollments: async () => {
        const response = await api.get('/courses/my-enrollments');
        return response.data;
    }
};
