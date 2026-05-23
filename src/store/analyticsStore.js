import { create } from 'zustand';
import api from '../services/api_service';

const useAnalyticsStore = create((set, get) => ({
    stats: null,
    trends: [],
    features: [],
    topUsers: [],
    isLoading: false,
    error: null,

    fetchAIAnalytics: async (orgId = null, days = 30) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = `?days=${days}${orgId ? `&org_id=${orgId}` : ''}`;
            const options = {};
 
            const [statsRes, trendsRes, featuresRes, usersRes] = await Promise.all([
                api.get(`/admin/analytics/ai/stats${queryParams}`, options),
                api.get(`/admin/analytics/ai/trends${queryParams}`, options),
                api.get(`/admin/analytics/ai/features${queryParams}`, options),
                api.get(`/admin/analytics/ai/top-users${queryParams}`, options)
            ]);

            set({
                stats: statsRes.data,
                trends: trendsRes.data,
                features: featuresRes.data,
                topUsers: usersRes.data,
                isLoading: false
            });
        } catch (err) {
            set({ 
                error: err.response?.data?.error || err.message || 'Failed to fetch analytics', 
                isLoading: false 
            });
        }
    },

    downloadOpsReport: async (orgId = null, days = 30) => {
        try {
            const queryParams = `?days=${days}${orgId ? `&org_id=${orgId}` : ''}`;
            const response = await api.get(`/admin/analytics/ai/report${queryParams}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `AI_Ops_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download report:', err);
        }
    }
}));

export default useAnalyticsStore;
