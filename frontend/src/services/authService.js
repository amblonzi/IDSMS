import api from './api';

export const authService = {
    /**
     * Login user with email and password
     */
    login: async (email, password) => {
        try {
            // OAuth2 password flow expects x-www-form-urlencoded
            const params = new URLSearchParams();
            params.append('username', email); // OAuth2 uses 'username' field
            params.append('password', password);

            const response = await api.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const { access_token, refresh_token } = response.data;

            // Store tokens
            localStorage.setItem('token', access_token);
            if (refresh_token) {
                localStorage.setItem('refreshToken', refresh_token);
            }

            // Fetch user profile
            const user = await authService.getMe();
            localStorage.setItem('user', JSON.stringify(user));

            return user;
        } catch (error) {
            console.error('[Auth] Login failed:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Logout user - invalidate token on server
     */
    logout: async () => {
        try {
            // Call logout endpoint to blacklist token
            await api.post('/auth/logout');
        } catch (error) {
            console.error('[Auth] Logout API call failed:', error);
            // Continue with local cleanup even if API call fails
        } finally {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },

    /**
     * Get current authenticated user
     */
    getMe: async () => {
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error) {
            console.error('[Auth] Get current user failed:', error);
            throw error;
        }
    },

    /**
     * Change user password
     */
    changePassword: async (currentPassword, newPassword) => {
        try {
            const response = await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            return response.data;
        } catch (error) {
            console.error('[Auth] Password change failed:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    },

    /**
     * Get stored user data
     */
    getUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Check if user has specific role
     */
    hasRole: (role) => {
        const user = authService.getUser();
        return user?.role === role;
    },

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole: (roles) => {
        const user = authService.getUser();
        return roles.includes(user?.role);
    },
};
