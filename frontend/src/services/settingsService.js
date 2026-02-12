import api from './api';

const settingsService = {
    /**
     * Get current system settings (public - no auth required)
     */
    getSettings: async () => {
        const response = await api.get('/settings');
        return response.data;
    },

    /**
     * Update system settings (admin only)
     */
    updateSettings: async (data) => {
        const response = await api.put('/settings', data);
        return response.data;
    }
};

export default settingsService;
