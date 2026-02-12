import axios from 'axios';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log requests in development
        if (ENVIRONMENT === 'development') {
            console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => {
        // Log responses in development
        if (ENVIRONMENT === 'development') {
            console.log(`[API] Response from ${response.config.url}:`, response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Log errors
        console.error('[API] Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.detail || error.message,
        });

        // Handle 401 Unauthorized - Try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    // Attempt to refresh the access token
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token } = response.data;

                    // Save new access token
                    localStorage.setItem('token', access_token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - clear tokens and redirect to login
                    console.error('[API] Token refresh failed:', refreshError);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');

                    // Redirect to login if not already there
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }

                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token - clear everything and redirect
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.error('[API] Access forbidden:', error.response.data?.detail);
        }

        // Handle 429 Rate Limit
        if (error.response?.status === 429) {
            console.error('[API] Rate limit exceeded. Please try again later.');
        }

        // Handle network errors with retry logic
        if (!error.response && !originalRequest._retryCount) {
            originalRequest._retryCount = 0;
        }

        if (!error.response && originalRequest._retryCount < 2) {
            originalRequest._retryCount++;
            console.log(`[API] Retrying request (${originalRequest._retryCount}/2)...`);

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * originalRequest._retryCount));
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;
