import api from './api';

export const paymentService = {
    getPayments: async (skip = 0, limit = 100) => {
        const response = await api.get(`/payments/?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    simulatePayment: async (enrollmentId, amount) => {
        const response = await api.post(`/payments/simulate-mpesa/${enrollmentId}?amount=${amount}`);
        return response.data;
    }
};
