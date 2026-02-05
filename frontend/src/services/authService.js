import api from './api';

export const authService = {
    login: async (email, password) => {
        // OAuth2PasswordRequestForm sends data as form-urlencoded
        const formData = new FormData();
        formData.append('username', email); // IDSMS uses email as username
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/users/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
    }
};
