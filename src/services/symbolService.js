import api from './api_service';

const BASE_URL = '/symbols';

export const symbolService = {
    getAll: async () => {
        const response = await api.get(BASE_URL + '/');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post(BASE_URL + '/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`${BASE_URL}/${id}`);
        return response.data;
    },

    seed: async (data) => {
        // data is an array of symbol objects
        const response = await api.post(`${BASE_URL}/seed?force=true`, data);
        return response.data;
    }
};
