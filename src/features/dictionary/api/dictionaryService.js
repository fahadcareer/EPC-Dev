import api from '../../../services/api_service';

const BASE_URL = '/dictionary';

export const dictionaryService = {
    getAllRequest: async (orgId = null) => {
        const query = orgId ? `?org_id=${orgId}` : '';
        const response = await api.get(BASE_URL + '/' + query);
        return response.data;
    },

    createRequest: async (data) => {
        const response = await api.post(BASE_URL + '/', data);
        return response.data;
    },

    updateRequest: async (id, data) => {
        const response = await api.put(`${BASE_URL}/${id}/`, data);
        return response.data;
    },

    deleteRequest: async (id) => {
        const response = await api.delete(`${BASE_URL}/${id}/`);
        return response.data;
    }
};
