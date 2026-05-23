import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
    persist(
        (set, get) => ({
            authToken: null,
            user: null,
            isAuthenticated: false,
            securityConfig: null,

            setAuth: (token, user) => set({ authToken: token, user, isAuthenticated: true }),
            
            updateUser: (userData) => set((state) => ({ 
                user: { ...state.user, ...userData } 
            })),

            setSecurityConfig: (config) => set({ securityConfig: config }),

            logout: () => {
                set({ authToken: null, user: null, isAuthenticated: false, securityConfig: null });
                localStorage.removeItem('token'); // Clear legacy token if any
                localStorage.removeItem('user_id');
            },

            refreshAccessToken: async () => {
                // Implement token refresh logic here if backend supports it
                // For now, we'll just return false to force logout on 401
                return { success: false };
            },

            isFeatureEnabled: (featureKey) => {
                const user = get().user;
                if (!user) return true;
                if (user.role === 'superadmin') return true;
                if (!user.enabled_features) return true;
                return user.enabled_features.includes(featureKey);
            }
        }),
        {
            name: "auth-storage", // unique name
            getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
        }
    )
);

export default useAuthStore;
