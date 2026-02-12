import api from './api';

export const vehicleService = {
    getVehicles: async () => {
        const response = await api.get('/vehicles/');
        return response.data;
    },

    createVehicle: async (vehicleData) => {
        const response = await api.post('/vehicles/', vehicleData);
        return response.data;
    },

    addMaintenance: async (vehicleId, maintenanceData) => {
        const response = await api.post(`/vehicles/${vehicleId}/maintenance`, maintenanceData);
        return response.data;
    }
};
