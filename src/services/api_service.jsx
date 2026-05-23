import useAuthStore from "../store/logic/user";
import NETWORK_URLS from "../config/network_string";
import { useServerStore } from "../store/serverStore";

const API_BASE_URL = NETWORK_URLS.BASE_URL;

console.log("Tasree3 API Service Loaded [v2]");

// Helper function to get auth headers
function getAuthHeaders(additionalHeaders = {}) {
    const authToken = useAuthStore.getState().authToken || localStorage.getItem('token');

    const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    // If additionalHeaders is an object containing a 'headers' key, extract it
    const actualHeaders = additionalHeaders.headers ? additionalHeaders.headers : additionalHeaders;

    if (actualHeaders && typeof actualHeaders === 'object') {
        Object.entries(actualHeaders).forEach(([key, value]) => {
            // NEVER allow a header literally named 'headers'
            // Also filter out 'responseType' and 'signal' as they are fetch options, not headers
            if (key.toLowerCase() !== 'headers' && key !== 'responseType' && key !== 'signal' && value !== undefined) {
                headers.set(key, value);
            }
        });
    }

    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
    }

    return headers;
}

// Helper function to handle token refresh on 401
async function handleUnauthorized() {
    const { refreshAccessToken, logout } = useAuthStore.getState();

    try {
        const { success } = await refreshAccessToken();
        if (success) {
            return true; // Token refreshed successfully
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }

    // If refresh fails, logout and redirect
    logout();
    window.location.href = '/login';
    return false;
}

// Helper to flag backend connection failures globally
function handleConnectionFailure(error, status) {
    const isNetworkError = error && error instanceof TypeError && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') || 
         error.message.includes('failed to fetch') ||
         error.message.includes('network error'));
         
    const isGatewayError = status === 502 || status === 503 || status === 504;

    if (isNetworkError || isGatewayError) {
        useServerStore.getState().setIsServerDown(true);
    }
}

// Common GET method
export async function apiGet(endpoint, options = {}) {
    let attempt = 0;
    const maxAttempts = 2;

    const responseType = options.responseType || (options.headers && options.headers.responseType);

    while (attempt < maxAttempts) {
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: getAuthHeaders(options),
                signal: options.signal,
            });

            // Handle 401 Unauthorized
            if (res.status === 401 && attempt === 0 && !endpoint.includes('login')) {
                const refreshed = await handleUnauthorized();
                if (refreshed) {
                    attempt++;
                    continue; // Retry with new token
                }
            }

            if (!res.ok) {
                handleConnectionFailure(null, res.status);
                const errorData = await res.json().catch(() => ({}));
                const error = new Error(`GET ${endpoint} failed: ${res.status}`);
                error.response = {
                    status: res.status,
                    statusText: res.statusText,
                    data: errorData,
                };
                throw error;
            }

            // Support different response types (blob for downloads)
            if (responseType === 'blob') {
                return { data: await res.blob() };
            }

            return { data: await res.json() }; // Return object with data property to match axios response structure
        } catch (error) {
            handleConnectionFailure(error, null);
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            attempt++;
        }
    }
}

// Common POST method
export async function apiPost(endpoint, data = {}, options = {}) {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
        try {
            const isFormData = data instanceof FormData;
            const requestHeaders = getAuthHeaders(options);

            if (isFormData) {
                requestHeaders.delete('Content-Type'); // Let browser set boundary
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: requestHeaders,
                body: isFormData ? data : JSON.stringify(data),
                signal: options.signal,
            });

            // Handle 401 Unauthorized
            if (response.status === 401 && attempt === 0 && !endpoint.includes('login')) {
                const refreshed = await handleUnauthorized();
                if (refreshed) {
                    attempt++;
                    continue; // Retry with new token
                }
            }

            if (!response.ok) {
                handleConnectionFailure(null, response.status);
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = {};
                }
                const error = new Error(`POST ${endpoint} failed: ${response.status}`);
                error.response = {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData,
                };
                throw error;
            }

            // Support different response types
            const responseType = options.responseType || (options.headers && options.headers.responseType);
            if (responseType === 'blob') {
                return { data: await response.blob() };
            }

            return { data: await response.json() }; // Match axios structure
        } catch (error) {
            handleConnectionFailure(error, null);
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            attempt++;
        }
    }
}

// Common PUT method
export async function apiPut(endpoint, data = {}, options = {}) {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
        try {
            const isFormData = data instanceof FormData;
            const requestHeaders = getAuthHeaders(options);

            if (isFormData) {
                requestHeaders.delete('Content-Type'); // Let browser set boundary
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: requestHeaders,
                body: isFormData ? data : JSON.stringify(data),
                signal: options.signal,
            });

            // Handle 401 Unauthorized
            if (response.status === 401 && attempt === 0 && !endpoint.includes('login')) {
                const refreshed = await handleUnauthorized();
                if (refreshed) {
                    attempt++;
                    continue; // Retry with new token
                }
            }

            if (!response.ok) {
                handleConnectionFailure(null, response.status);
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = {};
                }
                const error = new Error(`PUT ${endpoint} failed: ${response.status}`);
                error.response = {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData,
                };
                throw error;
            }

            return { data: await response.json() }; // Match axios structure
        } catch (error) {
            handleConnectionFailure(error, null);
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            attempt++;
        }
    }
}

// Common DELETE method
export async function apiDelete(endpoint, options = {}) {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: getAuthHeaders(options),
                signal: options.signal,
            });

            // Handle 401 Unauthorized
            if (response.status === 401 && attempt === 0 && !endpoint.includes('login')) {
                const refreshed = await handleUnauthorized();
                if (refreshed) {
                    attempt++;
                    continue; // Retry with new token
                }
            }

            if (!response.ok) {
                handleConnectionFailure(null, response.status);
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = {};
                }
                const error = new Error(`DELETE ${endpoint} failed: ${response.status}`);
                error.response = {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData,
                };
                throw error;
            }

            return { data: await response.json() }; // Match axios structure
        } catch (error) {
            handleConnectionFailure(error, null);
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            attempt++;
        }
    }
}

// Default export for backward compatibility
const api = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    // patch: apiPatch // Implement if needed
};

export default api;
