import { create } from "zustand";
import NETWORK_URLS from "../config/network_string";

export const useServerStore = create((set) => ({
    isServerDown: false,
    isChecking: false,
    hasChecked: false, // Tracks if the initial server connection test has completed

    setIsServerDown: (status) => set({ isServerDown: status, hasChecked: true }),

    checkServerHealth: async () => {
        set({ isChecking: true });

        // Enforce a strict 1.8s timeout so users don't wait for browser's default 10s TCP timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        try {
            // Fetch the dedicated health endpoint
            const res = await fetch(`${NETWORK_URLS.BASE_URL}/health`, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                signal: controller.signal,
                cache: "no-store"
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                set({ isServerDown: false, isChecking: false, hasChecked: true });
                return true;
            }
        } catch (error) {
            console.warn("Connection check failed. Backend is unreachable.", error);
        }

        clearTimeout(timeoutId);
        set({ isServerDown: true, isChecking: false, hasChecked: true });
        return false;
    }
}));

